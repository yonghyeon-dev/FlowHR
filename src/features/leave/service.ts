import type { Actor } from "@/lib/actor";
import { requireOwnOrAny, requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import { applyApprovalExecutionAction, assertApprovalPolicyGate } from "@/features/approval/service";
import type {
  DataAccess,
  LeaveBalanceEntity,
  LeaveRequestEntity,
  LeaveRequestUnit,
  LeaveType
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { ensureTenantMatch, requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const FULL_DAY_HOURS = 8;
const DEFAULT_GRANTED_DAYS = 15;
const DEFAULT_CARRY_OVER_CAP_DAYS = 5;
const DEFAULT_ALLOW_HALF_DAY = true;
const DEFAULT_ALLOW_HOURLY = true;
const DEFAULT_HOURLY_INCREMENT_MINUTES = 30;
const DEFAULT_MAX_HOURS_PER_REQUEST = 8;
const DEFAULT_MIN_NOTICE_DAYS = 0;
const DEFAULT_MAX_CONSECUTIVE_DAYS: number | null = null;
const DEFAULT_ANNUAL_LEAVE_PROMOTION_ENABLED = false;
const DEFAULT_ANNUAL_LEAVE_PROMOTION_THRESHOLD_DAYS = 5;
const DEFAULT_ANNUAL_LEAVE_PROMOTION_LEAD_DAYS = 30;
const DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE =
  "Annual leave notice: Please use your remaining annual leave before year end.";

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

type CreateLeaveRequestInput = {
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  unit?: LeaveRequestUnit;
  hours?: number;
  reason?: string;
};

type UpdateLeaveRequestInput = {
  leaveType?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  unit?: LeaveRequestUnit;
  hours?: number | null;
  reason?: string;
};

type SettleLeaveAccrualInput = {
  employeeId: string;
  year: number;
  annualGrantDays?: number;
  carryOverCapDays?: number;
};

type ReadLeavePolicyInput = {
  organizationId?: string;
};

type UpsertLeavePolicyInput = {
  organizationId?: string;
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay?: boolean;
  allowHourly?: boolean;
  hourlyIncrementMinutes?: number;
  maxHoursPerRequest?: number;
  minNoticeDays?: number;
  maxConsecutiveDays?: number | null;
  annualLeavePromotionEnabled?: boolean;
  annualLeavePromotionThresholdDays?: number;
  annualLeavePromotionLeadDays?: number;
  annualLeavePromotionMessageTemplate?: string | null;
};

type LeavePolicyRules = {
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay: boolean;
  allowHourly: boolean;
  hourlyIncrementMinutes: number;
  maxHoursPerRequest: number;
  minNoticeDays: number;
  maxConsecutiveDays: number | null;
  annualLeavePromotionEnabled: boolean;
  annualLeavePromotionThresholdDays: number;
  annualLeavePromotionLeadDays: number;
  annualLeavePromotionMessageTemplate: string;
};

type PreviewAnnualLeavePromotionInput = {
  organizationId?: string;
  asOf?: Date;
  includeUpcoming?: boolean;
};

type DispatchAnnualLeavePromotionNoticeInput = {
  organizationId?: string;
  asOf?: Date;
  includeUpcoming?: boolean;
  dryRun?: boolean;
  deliveryChannel?: "webhook" | "email_template";
  emailTemplateId?: string;
};

type PromotionWebhookProvider = "discord" | "slack";
type PromotionDeliveryProvider = PromotionWebhookProvider | "email_template";

type PromotionWebhookConfig = {
  url: string;
  provider: PromotionWebhookProvider;
  source: string;
};

type PromotionEmailTemplateConfig = {
  url: string;
  token: string | null;
  from: string;
  urlSource: string;
  tokenSource: string | null;
  fromSource: string;
};

type ListLeaveRequestsInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  state?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
};

function toSeoulDayIndex(value: Date) {
  const adjusted = new Date(value.getTime() + SEOUL_OFFSET_MS);
  return Math.floor(
    Date.UTC(adjusted.getUTCFullYear(), adjusted.getUTCMonth(), adjusted.getUTCDate()) / DAY_MS
  );
}

function fromSeoulDayIndex(dayIndex: number) {
  return new Date(dayIndex * DAY_MS - SEOUL_OFFSET_MS);
}

function formatSeoulDay(value: Date) {
  const adjusted = new Date(value.getTime() + SEOUL_OFFSET_MS);
  const year = adjusted.getUTCFullYear();
  const month = String(adjusted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(adjusted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveSeoulYearEnd(value: Date) {
  const adjusted = new Date(value.getTime() + SEOUL_OFFSET_MS);
  const year = adjusted.getUTCFullYear();
  return new Date(Date.UTC(year, 11, 31, 14, 59, 59, 999));
}

function calculateLeaveDays(startDate: Date, endDate: Date) {
  if (endDate < startDate) {
    throw new ServiceError(400, "endDate must be same or after startDate");
  }
  const startDay = toSeoulDayIndex(startDate);
  const endDay = toSeoulDayIndex(endDate);
  const days = endDay - startDay + 1;
  if (days <= 0) {
    throw new ServiceError(400, "leave days must be positive");
  }
  return days;
}

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateHoursBetween(startDate: Date, endDate: Date) {
  if (endDate <= startDate) {
    throw new ServiceError(400, "endDate must be after startDate");
  }
  return roundTo2((endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000));
}

function isSameSeoulDay(left: Date, right: Date) {
  return toSeoulDayIndex(left) === toSeoulDayIndex(right);
}

function resolvePolicyRules(policy?: {
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay?: boolean;
  allowHourly?: boolean;
  hourlyIncrementMinutes?: number;
  maxHoursPerRequest?: number;
  minNoticeDays?: number;
  maxConsecutiveDays?: number | null;
  annualLeavePromotionEnabled?: boolean;
  annualLeavePromotionThresholdDays?: number;
  annualLeavePromotionLeadDays?: number;
  annualLeavePromotionMessageTemplate?: string | null;
} | null): LeavePolicyRules {
  return {
    annualGrantDays: policy?.annualGrantDays ?? DEFAULT_GRANTED_DAYS,
    carryOverCapDays: policy?.carryOverCapDays ?? DEFAULT_CARRY_OVER_CAP_DAYS,
    allowHalfDay: policy?.allowHalfDay ?? DEFAULT_ALLOW_HALF_DAY,
    allowHourly: policy?.allowHourly ?? DEFAULT_ALLOW_HOURLY,
    hourlyIncrementMinutes: policy?.hourlyIncrementMinutes ?? DEFAULT_HOURLY_INCREMENT_MINUTES,
    maxHoursPerRequest: policy?.maxHoursPerRequest ?? DEFAULT_MAX_HOURS_PER_REQUEST,
    minNoticeDays: policy?.minNoticeDays ?? DEFAULT_MIN_NOTICE_DAYS,
    maxConsecutiveDays: policy?.maxConsecutiveDays ?? DEFAULT_MAX_CONSECUTIVE_DAYS,
    annualLeavePromotionEnabled:
      policy?.annualLeavePromotionEnabled ?? DEFAULT_ANNUAL_LEAVE_PROMOTION_ENABLED,
    annualLeavePromotionThresholdDays:
      policy?.annualLeavePromotionThresholdDays ?? DEFAULT_ANNUAL_LEAVE_PROMOTION_THRESHOLD_DAYS,
    annualLeavePromotionLeadDays:
      policy?.annualLeavePromotionLeadDays ?? DEFAULT_ANNUAL_LEAVE_PROMOTION_LEAD_DAYS,
    annualLeavePromotionMessageTemplate:
      policy?.annualLeavePromotionMessageTemplate?.trim() ||
      DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE
  };
}

function renderPromotionMessageTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const value = values[key];
    return value === undefined || value === null ? match : String(value);
  });
}

function normalizeEnvValue(value: string | undefined) {
  return (value ?? "").trim();
}

function resolvePromotionWebhookProvider(webhookUrl: string): PromotionWebhookProvider {
  const configured = normalizeEnvValue(
    process.env.FLOWHR_LEAVE_PROMOTION_WEBHOOK_PROVIDER ??
      process.env.FLOWHR_ALERT_WEBHOOK_PROVIDER
  ).toLowerCase();
  if (configured === "discord" || configured === "slack") {
    return configured;
  }

  if (
    webhookUrl.includes("discord.com/api/webhooks/") ||
    webhookUrl.includes("discordapp.com/api/webhooks/")
  ) {
    return "discord";
  }
  if (webhookUrl.includes("hooks.slack.com/services/")) {
    return "slack";
  }
  return "slack";
}

function resolvePromotionWebhookConfig(): PromotionWebhookConfig | null {
  const candidates: Array<{ source: string; value: string }> = [
    {
      source: "FLOWHR_LEAVE_PROMOTION_WEBHOOK_URL",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_WEBHOOK_URL)
    },
    {
      source: "FLOWHR_LEAVE_PROMOTION_DISCORD_WEBHOOK",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_DISCORD_WEBHOOK)
    },
    {
      source: "FLOWHR_LEAVE_PROMOTION_SLACK_WEBHOOK",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_SLACK_WEBHOOK)
    },
    {
      source: "FLOWHR_ALERT_WEBHOOK_URL",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_WEBHOOK_URL)
    },
    {
      source: "FLOWHR_ALERT_DISCORD_WEBHOOK",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_DISCORD_WEBHOOK)
    },
    {
      source: "FLOWHR_ALERT_SLACK_WEBHOOK",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_SLACK_WEBHOOK)
    }
  ];

  const matched = candidates.find((candidate) => candidate.value.length > 0);
  if (!matched) {
    return null;
  }

  return {
    url: matched.value,
    provider: resolvePromotionWebhookProvider(matched.value),
    source: matched.source
  };
}

function resolvePromotionEmailTemplateConfig(): PromotionEmailTemplateConfig | null {
  const urlCandidates: Array<{ source: string; value: string }> = [
    {
      source: "FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL)
    },
    {
      source: "FLOWHR_ALERT_EMAIL_TEMPLATE_URL",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_EMAIL_TEMPLATE_URL)
    }
  ];
  const fromCandidates: Array<{ source: string; value: string }> = [
    {
      source: "FLOWHR_LEAVE_PROMOTION_EMAIL_FROM",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_EMAIL_FROM)
    },
    {
      source: "FLOWHR_ALERT_EMAIL_FROM",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_EMAIL_FROM)
    }
  ];
  const tokenCandidates: Array<{ source: string; value: string }> = [
    {
      source: "FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_TOKEN",
      value: normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_TOKEN)
    },
    {
      source: "FLOWHR_ALERT_EMAIL_TEMPLATE_TOKEN",
      value: normalizeEnvValue(process.env.FLOWHR_ALERT_EMAIL_TEMPLATE_TOKEN)
    }
  ];

  const matchedUrl = urlCandidates.find((candidate) => candidate.value.length > 0);
  const matchedFrom = fromCandidates.find((candidate) => candidate.value.length > 0);
  if (!matchedUrl || !matchedFrom) {
    return null;
  }
  const matchedToken = tokenCandidates.find((candidate) => candidate.value.length > 0);

  return {
    url: matchedUrl.value,
    token: matchedToken?.value ?? null,
    from: matchedFrom.value,
    urlSource: matchedUrl.source,
    tokenSource: matchedToken?.source ?? null,
    fromSource: matchedFrom.source
  };
}

function buildPromotionNoticeMessage(input: {
  organizationId: string;
  asOf: string;
  includeUpcoming: boolean;
  dryRun: boolean;
  noticeWindow: {
    startAt: string;
    endAt: string;
    isOpen: boolean;
  };
  summary: {
    potentialTargetCount: number;
    displayTargetCount: number;
    eligibleNowCount: number;
  };
  targets: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    remainingDays: number;
    eligibleNow: boolean;
  }>;
  announcementDraft: {
    title: string;
    body: string;
  };
}) {
  const headline = input.dryRun
    ? "[FlowHR] 연차 촉진 공지 드라이런"
    : "[FlowHR] 연차 촉진 공지 발송";

  const lines = [
    headline,
    `- 조직: ${input.organizationId}`,
    `- 기준 시각(asOf): ${input.asOf}`,
    `- 공지 윈도우: ${input.noticeWindow.startAt} ~ ${input.noticeWindow.endAt}`,
    `- 윈도우 오픈: ${input.noticeWindow.isOpen ? "yes" : "no"}`,
    `- includeUpcoming: ${input.includeUpcoming ? "yes" : "no"}`,
    `- 대상자: 표시 ${input.summary.displayTargetCount}명 / 즉시 ${input.summary.eligibleNowCount}명 / 잠재 ${input.summary.potentialTargetCount}명`,
    "- 공지 제목:",
    input.announcementDraft.title,
    "- 공지 본문:",
    input.announcementDraft.body
  ];

  const sampleTargets = input.targets.slice(0, 30);
  if (sampleTargets.length > 0) {
    lines.push("- 대상자 샘플:");
    for (const target of sampleTargets) {
      const name = target.name?.trim() || "-";
      const email = target.email?.trim() || "-";
      lines.push(
        `  - ${target.employeeId} | ${name} | ${email} | remaining=${target.remainingDays} | ${target.eligibleNow ? "eligible" : "upcoming"}`
      );
    }
  }
  if (input.targets.length > sampleTargets.length) {
    lines.push(`  - ... and ${input.targets.length - sampleTargets.length} more target(s)`);
  }

  return lines.join("\n");
}

async function sendPromotionWebhook(config: PromotionWebhookConfig, message: string) {
  const payload =
    config.provider === "discord"
      ? JSON.stringify({ content: message })
      : JSON.stringify({ text: message });

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: payload
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`${config.provider} webhook request failed: ${response.status} ${responseBody}`);
  }
}

async function sendPromotionEmailTemplate(
  config: PromotionEmailTemplateConfig,
  payload: {
    templateId: string;
    from: string;
    subject: string;
    body: string;
    organizationId: string;
    asOf: string;
    includeUpcoming: boolean;
    noticeWindow: { startAt: string; endAt: string; isOpen: boolean };
    summary: { potentialTargetCount: number; displayTargetCount: number; eligibleNowCount: number };
    recipients: Array<{
      employeeId: string;
      email: string;
      name: string | null;
      remainingDays: number;
      grantedDays: number;
      usedDays: number;
      lastAccrualYear: number | null;
      eligibleNow: boolean;
    }>;
  }
) {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };
  if (config.token) {
    headers.authorization = `Bearer ${config.token}`;
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`email template request failed: ${response.status} ${responseBody}`);
  }
}

function calculateRequestedLeave(input: {
  unit: LeaveRequestUnit;
  startDate: Date;
  endDate: Date;
  hours?: number | null;
  policy: LeavePolicyRules;
}): { unit: LeaveRequestUnit; days: number; hours: number | null } {
  const unit = input.unit;

  if (unit === "FULL_DAY") {
    const days = calculateLeaveDays(input.startDate, input.endDate);
    return {
      unit,
      days: roundTo2(days),
      hours: roundTo2(days * FULL_DAY_HOURS)
    };
  }

  if (unit === "HALF_DAY") {
    if (!input.policy.allowHalfDay) {
      throw new ServiceError(409, "leave policy does not allow half-day requests");
    }
    if (!isSameSeoulDay(input.startDate, input.endDate)) {
      throw new ServiceError(400, "half-day leave must be within the same day");
    }
    return {
      unit,
      days: 0.5,
      hours: FULL_DAY_HOURS / 2
    };
  }

  if (!input.policy.allowHourly) {
    throw new ServiceError(409, "leave policy does not allow hourly requests");
  }
  if (!isSameSeoulDay(input.startDate, input.endDate)) {
    throw new ServiceError(400, "hourly leave must be within the same day");
  }
  const hoursFromRange = calculateHoursBetween(input.startDate, input.endDate);
  const requestedHours = input.hours ?? hoursFromRange;
  if (!Number.isFinite(requestedHours) || requestedHours <= 0) {
    throw new ServiceError(400, "hourly leave hours must be positive");
  }
  if (requestedHours > input.policy.maxHoursPerRequest) {
    throw new ServiceError(400, "hourly leave exceeds maxHoursPerRequest policy");
  }
  const minutes = Math.round(requestedHours * 60);
  if (minutes % input.policy.hourlyIncrementMinutes !== 0) {
    throw new ServiceError(400, "hourly leave must align with policy increment");
  }
  return {
    unit,
    days: roundTo2(requestedHours / FULL_DAY_HOURS),
    hours: roundTo2(requestedHours)
  };
}

function assertPolicyRequestConstraints(input: {
  startDate: Date;
  requestedDays: number;
  policy: LeavePolicyRules;
  now?: Date;
}) {
  const maxConsecutiveDays = input.policy.maxConsecutiveDays;
  if (
    maxConsecutiveDays !== null &&
    Number.isFinite(maxConsecutiveDays) &&
    input.requestedDays > maxConsecutiveDays
  ) {
    throw new ServiceError(
      409,
      `leave policy maxConsecutiveDays exceeded (${maxConsecutiveDays} days)`
    );
  }

  const now = input.now ?? new Date();
  const noticeDays = toSeoulDayIndex(input.startDate) - toSeoulDayIndex(now);
  if (input.policy.minNoticeDays > 0 && noticeDays < input.policy.minNoticeDays) {
    throw new ServiceError(
      409,
      `leave policy requires at least ${input.policy.minNoticeDays} day(s) notice`
    );
  }
}

function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "to must be after from");
  }
}

function resolveTargetOrganizationId(actor: Actor | null, inputOrganizationId?: string) {
  const candidate = (inputOrganizationId ?? actor?.organizationId ?? "").trim();
  if (!candidate) {
    throw new ServiceError(400, "organizationId is required");
  }
  return candidate;
}

function ensureTenantAccess(actor: Actor | null, organizationId: string) {
  const tenantScope = resolveTenantScope(actor);
  ensureTenantMatch(tenantScope, organizationId, "organization not found");
}

async function ensureNoOverlap(
  context: ServiceContext,
  input: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
    excludeRequestId?: string;
  }
) {
  const overlaps = await context.dataAccess.leave.findOverlappingActiveRequests(input);
  if (overlaps.length > 0) {
    throw new ServiceError(409, "overlapping leave request exists");
  }
}

async function requirePendingRequest(context: ServiceContext, requestId: string) {
  const request = await context.dataAccess.leave.findById(requestId);
  if (!request) {
    throw new ServiceError(404, "leave request not found");
  }
  if (request.state !== "PENDING") {
    throw new ServiceError(409, "only pending leave request can be changed");
  }
  return request;
}

export async function createLeaveRequest(
  context: ServiceContext,
  input: CreateLeaveRequestInput
): Promise<LeaveRequestEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requireOwnOrAny(context, {
    own: Permissions.leaveRequestWriteOwn,
    any: Permissions.leaveRequestWriteAny,
    employeeId: input.employeeId
  });

  const employee = await requireEmployeeWithinTenant(context.dataAccess, actor, input.employeeId);

  const policy =
    employee.organizationId
      ? await context.dataAccess.leavePolicy.findByOrganizationId(employee.organizationId)
      : null;
  const policyRules = resolvePolicyRules(policy);
  const requested = calculateRequestedLeave({
    unit: input.unit ?? "FULL_DAY",
    startDate: input.startDate,
    endDate: input.endDate,
    hours: input.hours,
    policy: policyRules
  });
  assertPolicyRequestConstraints({
    startDate: input.startDate,
    requestedDays: requested.days,
    policy: policyRules
  });
  await ensureNoOverlap(context, {
    employeeId: input.employeeId,
    startDate: input.startDate,
    endDate: input.endDate
  });

  const request = await context.dataAccess.leave.create({
    employeeId: input.employeeId,
    leaveType: input.leaveType,
    startDate: input.startDate,
    endDate: input.endDate,
    unit: requested.unit,
    hours: requested.hours,
    days: requested.days,
    reason: input.reason
  });

  await context.dataAccess.audit.append({
    action: "leave.requested",
    entityType: "LeaveRequest",
    entityId: request.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: request.employeeId,
      leaveType: request.leaveType,
      unit: request.unit,
      hours: request.hours,
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
      days: request.days
    }
  });
  await getEventPublisher(context).publish({
    name: "leave.requested.v1",
    occurredAt: new Date().toISOString(),
    entityType: "LeaveRequest",
    entityId: request.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: request.employeeId,
      leaveType: request.leaveType,
      unit: request.unit,
      hours: request.hours,
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
      days: request.days
    }
  });

  return request;
}

export async function updateLeaveRequest(
  context: ServiceContext,
  requestId: string,
  input: UpdateLeaveRequestInput
): Promise<LeaveRequestEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const existing = await requirePendingRequest(context, requestId);
  const employee = await requireEmployeeWithinTenant(context.dataAccess, actor, existing.employeeId);
  await requireOwnOrAny(context, {
    own: Permissions.leaveRequestWriteOwn,
    any: Permissions.leaveRequestWriteAny,
    employeeId: existing.employeeId
  });

  const nextStartDate = input.startDate ?? existing.startDate;
  const nextEndDate = input.endDate ?? existing.endDate;
  const nextUnit = input.unit ?? existing.unit;
  const shouldRecalculateHourlyFromRange =
    nextUnit === "HOUR" &&
    input.hours === undefined &&
    (input.startDate !== undefined || input.endDate !== undefined || input.unit !== undefined);
  const policy =
    employee.organizationId
      ? await context.dataAccess.leavePolicy.findByOrganizationId(employee.organizationId)
      : null;
  const policyRules = resolvePolicyRules(policy);
  const requested = calculateRequestedLeave({
    unit: nextUnit,
    startDate: nextStartDate,
    endDate: nextEndDate,
    hours:
      nextUnit === "HOUR"
        ? input.hours !== undefined
          ? input.hours
          : shouldRecalculateHourlyFromRange
            ? undefined
            : existing.hours
        : undefined,
    policy: policyRules
  });
  assertPolicyRequestConstraints({
    startDate: nextStartDate,
    requestedDays: requested.days,
    policy: policyRules
  });
  await ensureNoOverlap(context, {
    employeeId: existing.employeeId,
    startDate: nextStartDate,
    endDate: nextEndDate,
    excludeRequestId: requestId
  });

  const updated = await context.dataAccess.leave.update(requestId, {
    leaveType: input.leaveType,
    startDate: input.startDate,
    endDate: input.endDate,
    unit: requested.unit,
    hours: requested.hours,
    reason: input.reason,
    days: requested.days
  });

  await context.dataAccess.audit.append({
    action: "leave.updated",
    entityType: "LeaveRequest",
    entityId: updated.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      leaveType: updated.leaveType,
      unit: updated.unit,
      hours: updated.hours,
      startDate: updated.startDate.toISOString(),
      endDate: updated.endDate.toISOString(),
      days: updated.days
    }
  });

  return updated;
}

export async function approveLeaveRequest(
  context: ServiceContext,
  requestId: string
): Promise<{ request: LeaveRequestEntity; balance: LeaveBalanceEntity }> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.leaveRequestApprove, "approval requires permission");

  const pending = await requirePendingRequest(context, requestId);
  const employee = await requireEmployeeWithinTenant(context.dataAccess, actor, pending.employeeId);

  let approvalFinalized = true;
  if (employee.organizationId) {
    const execution = await applyApprovalExecutionAction(context, {
      domain: "LEAVE",
      organizationId: employee.organizationId,
      targetEntityType: "LeaveRequest",
      targetEntityId: pending.id,
      action: "APPROVE"
    });
    approvalFinalized = execution.finalized;
  } else {
    await assertApprovalPolicyGate(context, {
      domain: "LEAVE",
      organizationId: employee.organizationId,
      targetEntityType: "LeaveRequest",
      targetEntityId: pending.id
    });
  }

  if (!approvalFinalized) {
    const balance = await context.dataAccess.leaveBalance.ensure(
      pending.employeeId,
      DEFAULT_GRANTED_DAYS
    );
    return { request: pending, balance };
  }

  const now = new Date();
  const request = await context.dataAccess.leave.update(requestId, {
    state: "APPROVED",
    decisionReason: null,
    approvedAt: now,
    approvedBy: actor.id,
    rejectedAt: null,
    rejectedBy: null,
    canceledAt: null,
    canceledBy: null
  });

  await context.dataAccess.leave.appendDecision({
    requestId: request.id,
    action: "APPROVED",
    actorId: actor.id,
    actorRole: actor.role
  });

  const balance = await context.dataAccess.leaveBalance.applyUsage({
    employeeId: request.employeeId,
    usedDaysDelta: request.days,
    defaultGrantedDays: DEFAULT_GRANTED_DAYS
  });

  await context.dataAccess.audit.append({
    action: "leave.approved",
    entityType: "LeaveRequest",
    entityId: request.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: request.employeeId,
      days: request.days,
      unit: request.unit,
      hours: request.hours,
      leaveType: request.leaveType
    }
  });
  await getEventPublisher(context).publish({
    name: "leave.approved.v1",
    occurredAt: new Date().toISOString(),
    entityType: "LeaveRequest",
    entityId: request.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: request.employeeId,
      leaveType: request.leaveType,
      unit: request.unit,
      hours: request.hours,
      days: request.days,
      remainingDays: balance.remainingDays
    }
  });

  return { request, balance };
}

export async function rejectLeaveRequest(
  context: ServiceContext,
  requestId: string,
  reason: string
): Promise<LeaveRequestEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.leaveRequestReject, "rejection requires permission");

  const pending = await requirePendingRequest(context, requestId);
  const employee = await requireEmployeeWithinTenant(context.dataAccess, actor, pending.employeeId);
  if (employee.organizationId) {
    const execution = await applyApprovalExecutionAction(context, {
      domain: "LEAVE",
      organizationId: employee.organizationId,
      targetEntityType: "LeaveRequest",
      targetEntityId: pending.id,
      action: "REJECT"
    });
    if (!execution.finalized || execution.execution.state !== "REJECTED") {
      throw new ServiceError(409, "leave reject action is not finalized");
    }
  } else {
    await assertApprovalPolicyGate(context, {
      domain: "LEAVE",
      organizationId: employee.organizationId,
      targetEntityType: "LeaveRequest",
      targetEntityId: pending.id
    });
  }
  const now = new Date();
  const request = await context.dataAccess.leave.update(requestId, {
    state: "REJECTED",
    decisionReason: reason,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: now,
    rejectedBy: actor.id,
    canceledAt: null,
    canceledBy: null
  });

  await context.dataAccess.leave.appendDecision({
    requestId: request.id,
    action: "REJECTED",
    actorId: actor.id,
    actorRole: actor.role,
    reason
  });

  await context.dataAccess.audit.append({
    action: "leave.rejected",
    entityType: "LeaveRequest",
    entityId: request.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: request.employeeId,
      reason
    }
  });
  await getEventPublisher(context).publish({
    name: "leave.rejected.v1",
    occurredAt: new Date().toISOString(),
    entityType: "LeaveRequest",
    entityId: request.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: request.employeeId,
      reason
    }
  });

  return request;
}

export async function cancelLeaveRequest(
  context: ServiceContext,
  requestId: string,
  reason?: string
): Promise<LeaveRequestEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const existing = await requirePendingRequest(context, requestId);
  const employee = await requireEmployeeWithinTenant(context.dataAccess, actor, existing.employeeId);
  await requireOwnOrAny(context, {
    own: Permissions.leaveRequestWriteOwn,
    any: Permissions.leaveRequestWriteAny,
    employeeId: existing.employeeId
  });

  const now = new Date();
  const request = await context.dataAccess.leave.update(requestId, {
    state: "CANCELED",
    decisionReason: reason ?? null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    canceledAt: now,
    canceledBy: actor.id
  });

  await context.dataAccess.leave.appendDecision({
    requestId: request.id,
    action: "CANCELED",
    actorId: actor.id,
    actorRole: actor.role,
    reason
  });

  await context.dataAccess.audit.append({
    action: "leave.canceled",
    entityType: "LeaveRequest",
    entityId: request.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: request.employeeId,
      reason: reason ?? null
    }
  });
  await getEventPublisher(context).publish({
    name: "leave.canceled.v1",
    occurredAt: new Date().toISOString(),
    entityType: "LeaveRequest",
    entityId: request.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: request.employeeId,
      reason: reason ?? null
    }
  });

  return request;
}

export async function listLeaveRequests(
  context: ServiceContext,
  input: ListLeaveRequestsInput
): Promise<LeaveRequestEntity[]> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.employeeId) {
    await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  }

  const actor = context.actor;
  const permissions = await resolveActorPermissions(context);

  if (permissions.has(Permissions.leaveRequestListAny)) {
    return await context.dataAccess.leave.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId: tenantScope ?? undefined,
      employeeId: input.employeeId,
      state: input.state
    });
  }

  if (permissions.has(Permissions.leaveRequestListByEmployee)) {
    if (!input.employeeId) {
      throw new ServiceError(400, "employeeId is required for manager list queries");
    }
    return await context.dataAccess.leave.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId: tenantScope ?? undefined,
      employeeId: input.employeeId,
      state: input.state
    });
  }

  if (permissions.has(Permissions.leaveRequestListOwn)) {
    const employeeId = input.employeeId ?? actor.id;
    if (employeeId !== actor.id) {
      throw new ServiceError(403, "employee can only list own leave requests");
    }
    return await context.dataAccess.leave.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId: tenantScope ?? undefined,
      employeeId,
      state: input.state
    });
  }

  throw new ServiceError(403, "leave list requires permission");
}

export async function readLeaveBalance(
  context: ServiceContext,
  employeeId: string
): Promise<LeaveBalanceEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  const permissions = await resolveActorPermissions(context);
  if (permissions.has(Permissions.leaveBalanceReadAny)) {
    // ok
  } else if (permissions.has(Permissions.leaveBalanceReadOwn)) {
    if (actor.id !== employeeId) {
      throw new ServiceError(403, "insufficient permissions");
    }
  } else {
    throw new ServiceError(403, "insufficient permissions");
  }

  const employee = await requireEmployeeWithinTenant(context.dataAccess, actor, employeeId);

  const balance = await context.dataAccess.leaveBalance.ensure(employeeId, DEFAULT_GRANTED_DAYS);
  await context.dataAccess.audit.append({
    action: "leave.balance_read",
    entityType: "LeaveBalanceProjection",
    entityId: employeeId,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id
  });
  return balance;
}

export async function settleLeaveAccrual(
  context: ServiceContext,
  input: SettleLeaveAccrualInput
): Promise<LeaveBalanceEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.leaveAccrualSettle, "leave accrual settle requires permission");

  const employee = await requireEmployeeWithinTenant(context.dataAccess, actor, input.employeeId);

  const policy =
    employee.organizationId && (input.annualGrantDays === undefined || input.carryOverCapDays === undefined)
      ? await context.dataAccess.leavePolicy.findByOrganizationId(employee.organizationId)
      : null;

  const annualGrantDays = input.annualGrantDays ?? policy?.annualGrantDays ?? DEFAULT_GRANTED_DAYS;
  const carryOverCapDays = input.carryOverCapDays ?? policy?.carryOverCapDays ?? DEFAULT_CARRY_OVER_CAP_DAYS;
  if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 9999) {
    throw new ServiceError(400, "year must be a valid 4-digit year");
  }
  if (!Number.isInteger(annualGrantDays) || annualGrantDays <= 0) {
    throw new ServiceError(400, "annualGrantDays must be a positive integer");
  }
  if (!Number.isInteger(carryOverCapDays) || carryOverCapDays < 0) {
    throw new ServiceError(400, "carryOverCapDays must be a non-negative integer");
  }

  const current = await context.dataAccess.leaveBalance.ensure(input.employeeId, DEFAULT_GRANTED_DAYS);
  if (current.lastAccrualYear !== null && current.lastAccrualYear >= input.year) {
    throw new ServiceError(409, "leave accrual already settled for the same or newer year");
  }

  const balance = await context.dataAccess.leaveBalance.settleAccrual({
    employeeId: input.employeeId,
    year: input.year,
    annualGrantDays,
    carryOverCapDays,
    defaultGrantedDays: DEFAULT_GRANTED_DAYS
  });

  await context.dataAccess.audit.append({
    action: "leave.accrual_settled",
    entityType: "LeaveBalanceProjection",
    entityId: input.employeeId,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      year: input.year,
      annualGrantDays,
      carryOverCapDays,
      carryOverAppliedDays: balance.carryOverDays,
      grantedDays: balance.grantedDays,
      remainingDays: balance.remainingDays
    }
  });
  await getEventPublisher(context).publish({
    name: "leave.accrual.settled.v1",
    occurredAt: new Date().toISOString(),
    entityType: "LeaveBalanceProjection",
    entityId: input.employeeId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: input.employeeId,
      year: input.year,
      annualGrantDays,
      carryOverCapDays,
      carryOverAppliedDays: balance.carryOverDays,
      grantedDays: balance.grantedDays,
      remainingDays: balance.remainingDays
    }
  });

  return balance;
}

export async function readLeavePolicy(
  context: ServiceContext,
  input: ReadLeavePolicyInput
): Promise<{
  policy: {
    organizationId: string;
    annualGrantDays: number;
    carryOverCapDays: number;
    allowHalfDay: boolean;
    allowHourly: boolean;
    hourlyIncrementMinutes: number;
    maxHoursPerRequest: number;
    minNoticeDays: number;
    maxConsecutiveDays: number | null;
    annualLeavePromotionEnabled: boolean;
    annualLeavePromotionThresholdDays: number;
    annualLeavePromotionLeadDays: number;
    annualLeavePromotionMessageTemplate: string;
    source: "configured" | "default";
    updatedAt: string | null;
  };
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.leaveBalanceReadAny, "leave policy read requires permission");

  const organizationId = resolveTargetOrganizationId(actor, input.organizationId);
  ensureTenantAccess(actor, organizationId);

  const stored = await context.dataAccess.leavePolicy.findByOrganizationId(organizationId);
  const policy = stored
    ? {
        organizationId: stored.organizationId,
        annualGrantDays: stored.annualGrantDays,
        carryOverCapDays: stored.carryOverCapDays,
        allowHalfDay: stored.allowHalfDay,
        allowHourly: stored.allowHourly,
        hourlyIncrementMinutes: stored.hourlyIncrementMinutes,
        maxHoursPerRequest: stored.maxHoursPerRequest,
        minNoticeDays: stored.minNoticeDays,
        maxConsecutiveDays: stored.maxConsecutiveDays,
        annualLeavePromotionEnabled: stored.annualLeavePromotionEnabled,
        annualLeavePromotionThresholdDays: stored.annualLeavePromotionThresholdDays,
        annualLeavePromotionLeadDays: stored.annualLeavePromotionLeadDays,
        annualLeavePromotionMessageTemplate:
          stored.annualLeavePromotionMessageTemplate?.trim() ||
          DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE,
        source: "configured" as const,
        updatedAt: stored.updatedAt.toISOString()
      }
    : {
        organizationId,
        annualGrantDays: DEFAULT_GRANTED_DAYS,
        carryOverCapDays: DEFAULT_CARRY_OVER_CAP_DAYS,
        allowHalfDay: DEFAULT_ALLOW_HALF_DAY,
        allowHourly: DEFAULT_ALLOW_HOURLY,
        hourlyIncrementMinutes: DEFAULT_HOURLY_INCREMENT_MINUTES,
        maxHoursPerRequest: DEFAULT_MAX_HOURS_PER_REQUEST,
        minNoticeDays: DEFAULT_MIN_NOTICE_DAYS,
        maxConsecutiveDays: DEFAULT_MAX_CONSECUTIVE_DAYS,
        annualLeavePromotionEnabled: DEFAULT_ANNUAL_LEAVE_PROMOTION_ENABLED,
        annualLeavePromotionThresholdDays: DEFAULT_ANNUAL_LEAVE_PROMOTION_THRESHOLD_DAYS,
        annualLeavePromotionLeadDays: DEFAULT_ANNUAL_LEAVE_PROMOTION_LEAD_DAYS,
        annualLeavePromotionMessageTemplate: DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE,
        source: "default" as const,
        updatedAt: null
      };

  await context.dataAccess.audit.append({
    action: "leave.policy_read",
    entityType: "LeavePolicy",
    entityId: stored?.id,
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: policy
  });

  return { policy };
}

export async function upsertLeavePolicy(
  context: ServiceContext,
  input: UpsertLeavePolicyInput
): Promise<{
  policy: {
    organizationId: string;
    annualGrantDays: number;
    carryOverCapDays: number;
    allowHalfDay: boolean;
    allowHourly: boolean;
    hourlyIncrementMinutes: number;
    maxHoursPerRequest: number;
    minNoticeDays: number;
    maxConsecutiveDays: number | null;
    annualLeavePromotionEnabled: boolean;
    annualLeavePromotionThresholdDays: number;
    annualLeavePromotionLeadDays: number;
    annualLeavePromotionMessageTemplate: string;
    updatedAt: string;
  };
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.leaveAccrualSettle, "leave policy write requires permission");

  const organizationId = resolveTargetOrganizationId(actor, input.organizationId);
  ensureTenantAccess(actor, organizationId);

  if (!Number.isInteger(input.annualGrantDays) || input.annualGrantDays <= 0) {
    throw new ServiceError(400, "annualGrantDays must be a positive integer");
  }
  if (!Number.isInteger(input.carryOverCapDays) || input.carryOverCapDays < 0) {
    throw new ServiceError(400, "carryOverCapDays must be a non-negative integer");
  }
  if (input.hourlyIncrementMinutes !== undefined) {
    if (!Number.isInteger(input.hourlyIncrementMinutes) || input.hourlyIncrementMinutes < 15) {
      throw new ServiceError(400, "hourlyIncrementMinutes must be an integer >= 15");
    }
  }
  if (input.maxHoursPerRequest !== undefined) {
    if (!Number.isFinite(input.maxHoursPerRequest) || input.maxHoursPerRequest <= 0) {
      throw new ServiceError(400, "maxHoursPerRequest must be a positive number");
    }
  }
  if (input.minNoticeDays !== undefined) {
    if (!Number.isInteger(input.minNoticeDays) || input.minNoticeDays < 0) {
      throw new ServiceError(400, "minNoticeDays must be a non-negative integer");
    }
  }
  if (input.maxConsecutiveDays !== undefined && input.maxConsecutiveDays !== null) {
    if (!Number.isFinite(input.maxConsecutiveDays) || input.maxConsecutiveDays <= 0) {
      throw new ServiceError(400, "maxConsecutiveDays must be a positive number or null");
    }
  }
  if (input.annualLeavePromotionThresholdDays !== undefined) {
    if (
      !Number.isFinite(input.annualLeavePromotionThresholdDays) ||
      input.annualLeavePromotionThresholdDays <= 0
    ) {
      throw new ServiceError(400, "annualLeavePromotionThresholdDays must be a positive number");
    }
  }
  if (input.annualLeavePromotionLeadDays !== undefined) {
    if (
      !Number.isInteger(input.annualLeavePromotionLeadDays) ||
      input.annualLeavePromotionLeadDays < 0
    ) {
      throw new ServiceError(400, "annualLeavePromotionLeadDays must be a non-negative integer");
    }
  }
  if (input.annualLeavePromotionMessageTemplate !== undefined && input.annualLeavePromotionMessageTemplate !== null) {
    if (input.annualLeavePromotionMessageTemplate.trim().length === 0) {
      throw new ServiceError(400, "annualLeavePromotionMessageTemplate cannot be blank");
    }
  }

  const stored = await context.dataAccess.leavePolicy.upsertForOrganization({
    organizationId,
    annualGrantDays: input.annualGrantDays,
    carryOverCapDays: input.carryOverCapDays,
    allowHalfDay: input.allowHalfDay,
    allowHourly: input.allowHourly,
    hourlyIncrementMinutes: input.hourlyIncrementMinutes,
    maxHoursPerRequest: input.maxHoursPerRequest,
    minNoticeDays: input.minNoticeDays,
    maxConsecutiveDays: input.maxConsecutiveDays,
    annualLeavePromotionEnabled: input.annualLeavePromotionEnabled,
    annualLeavePromotionThresholdDays: input.annualLeavePromotionThresholdDays,
    annualLeavePromotionLeadDays: input.annualLeavePromotionLeadDays,
    annualLeavePromotionMessageTemplate: input.annualLeavePromotionMessageTemplate
  });

  await context.dataAccess.audit.append({
    action: "leave.policy_updated",
    entityType: "LeavePolicy",
    entityId: stored.id,
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      organizationId: stored.organizationId,
      annualGrantDays: stored.annualGrantDays,
      carryOverCapDays: stored.carryOverCapDays,
      allowHalfDay: stored.allowHalfDay,
      allowHourly: stored.allowHourly,
      hourlyIncrementMinutes: stored.hourlyIncrementMinutes,
      maxHoursPerRequest: stored.maxHoursPerRequest,
      minNoticeDays: stored.minNoticeDays,
      maxConsecutiveDays: stored.maxConsecutiveDays,
      annualLeavePromotionEnabled: stored.annualLeavePromotionEnabled,
      annualLeavePromotionThresholdDays: stored.annualLeavePromotionThresholdDays,
      annualLeavePromotionLeadDays: stored.annualLeavePromotionLeadDays,
      annualLeavePromotionMessageTemplate:
        stored.annualLeavePromotionMessageTemplate?.trim() ||
        DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE
    }
  });
  await getEventPublisher(context).publish({
    name: "leave.policy.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "LeavePolicy",
    entityId: stored.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      organizationId: stored.organizationId,
      annualGrantDays: stored.annualGrantDays,
      carryOverCapDays: stored.carryOverCapDays,
      allowHalfDay: stored.allowHalfDay,
      allowHourly: stored.allowHourly,
      hourlyIncrementMinutes: stored.hourlyIncrementMinutes,
      maxHoursPerRequest: stored.maxHoursPerRequest,
      minNoticeDays: stored.minNoticeDays,
      maxConsecutiveDays: stored.maxConsecutiveDays,
      annualLeavePromotionEnabled: stored.annualLeavePromotionEnabled,
      annualLeavePromotionThresholdDays: stored.annualLeavePromotionThresholdDays,
      annualLeavePromotionLeadDays: stored.annualLeavePromotionLeadDays,
      annualLeavePromotionMessageTemplate:
        stored.annualLeavePromotionMessageTemplate?.trim() ||
        DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE
    }
  });

  return {
    policy: {
      organizationId: stored.organizationId,
      annualGrantDays: stored.annualGrantDays,
      carryOverCapDays: stored.carryOverCapDays,
      allowHalfDay: stored.allowHalfDay,
      allowHourly: stored.allowHourly,
      hourlyIncrementMinutes: stored.hourlyIncrementMinutes,
      maxHoursPerRequest: stored.maxHoursPerRequest,
      minNoticeDays: stored.minNoticeDays,
      maxConsecutiveDays: stored.maxConsecutiveDays,
      annualLeavePromotionEnabled: stored.annualLeavePromotionEnabled,
      annualLeavePromotionThresholdDays: stored.annualLeavePromotionThresholdDays,
      annualLeavePromotionLeadDays: stored.annualLeavePromotionLeadDays,
      annualLeavePromotionMessageTemplate:
        stored.annualLeavePromotionMessageTemplate?.trim() ||
        DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE,
      updatedAt: stored.updatedAt.toISOString()
    }
  };
}

export async function previewAnnualLeavePromotion(
  context: ServiceContext,
  input: PreviewAnnualLeavePromotionInput
): Promise<{
  organizationId: string;
  asOf: string;
  policy: {
    enabled: boolean;
    thresholdDays: number;
    leadDays: number;
    messageTemplate: string;
    source: "configured" | "default";
    updatedAt: string | null;
  };
  noticeWindow: {
    startAt: string;
    endAt: string;
    isOpen: boolean;
  };
  summary: {
    activeEmployeeCount: number;
    potentialTargetCount: number;
    displayTargetCount: number;
    eligibleNowCount: number;
  };
  targets: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    remainingDays: number;
    grantedDays: number;
    usedDays: number;
    lastAccrualYear: number | null;
    eligibleNow: boolean;
  }>;
  announcementDraft: {
    title: string;
    body: string;
  };
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(
    context,
    Permissions.leaveBalanceReadAny,
    "leave promotion preview requires permission"
  );

  const organizationId = resolveTargetOrganizationId(actor, input.organizationId);
  ensureTenantAccess(actor, organizationId);

  const asOf = input.asOf ?? new Date();
  if (!Number.isFinite(asOf.getTime())) {
    throw new ServiceError(400, "asOf must be a valid datetime");
  }

  const stored = await context.dataAccess.leavePolicy.findByOrganizationId(organizationId);
  const policyRules = resolvePolicyRules(stored);

  const yearEnd = resolveSeoulYearEnd(asOf);
  const yearEndDayIndex = toSeoulDayIndex(yearEnd);
  const noticeWindowStartDayIndex = yearEndDayIndex - policyRules.annualLeavePromotionLeadDays;
  const noticeWindowStart = fromSeoulDayIndex(noticeWindowStartDayIndex);
  const noticeWindowEnd = new Date(fromSeoulDayIndex(yearEndDayIndex + 1).getTime() - 1);
  const asOfDayIndex = toSeoulDayIndex(asOf);
  const noticeWindowOpen =
    asOfDayIndex >= noticeWindowStartDayIndex && asOfDayIndex <= yearEndDayIndex;

  const employees = await context.dataAccess.employees.list({
    organizationId,
    active: true
  });

  const potentialTargets: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    remainingDays: number;
    grantedDays: number;
    usedDays: number;
    lastAccrualYear: number | null;
    eligibleNow: boolean;
  }> = [];

  if (policyRules.annualLeavePromotionEnabled) {
    for (const employee of employees) {
      const balance = await context.dataAccess.leaveBalance.ensure(
        employee.id,
        policyRules.annualGrantDays
      );
      if (balance.remainingDays < policyRules.annualLeavePromotionThresholdDays) {
        continue;
      }
      potentialTargets.push({
        employeeId: employee.id,
        name: employee.name,
        email: employee.email,
        remainingDays: roundTo2(balance.remainingDays),
        grantedDays: roundTo2(balance.grantedDays),
        usedDays: roundTo2(balance.usedDays),
        lastAccrualYear: balance.lastAccrualYear,
        eligibleNow: noticeWindowOpen
      });
    }
  }

  potentialTargets.sort((left, right) => {
    if (right.remainingDays !== left.remainingDays) {
      return right.remainingDays - left.remainingDays;
    }
    return left.employeeId.localeCompare(right.employeeId);
  });

  const displayTargets = potentialTargets.filter((target) => {
    if (target.eligibleNow) {
      return true;
    }
    return Boolean(input.includeUpcoming);
  });

  const eligibleNowCount = potentialTargets.filter((target) => target.eligibleNow).length;
  const seoulYear = new Date(asOf.getTime() + SEOUL_OFFSET_MS).getUTCFullYear();
  const announcementBody = renderPromotionMessageTemplate(
    policyRules.annualLeavePromotionMessageTemplate,
    {
      organizationId,
      year: seoulYear,
      thresholdDays: policyRules.annualLeavePromotionThresholdDays,
      targetCount: displayTargets.length,
      potentialTargetCount: potentialTargets.length,
      eligibleNowCount,
      noticeWindowStart: formatSeoulDay(noticeWindowStart),
      noticeWindowEnd: formatSeoulDay(noticeWindowEnd)
    }
  );

  await context.dataAccess.audit.append({
    action: "leave.promotion_preview_read",
    entityType: "LeavePolicy",
    entityId: stored?.id,
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      asOf: asOf.toISOString(),
      includeUpcoming: Boolean(input.includeUpcoming),
      noticeWindowOpen,
      potentialTargetCount: potentialTargets.length,
      displayTargetCount: displayTargets.length
    }
  });

  return {
    organizationId,
    asOf: asOf.toISOString(),
    policy: {
      enabled: policyRules.annualLeavePromotionEnabled,
      thresholdDays: policyRules.annualLeavePromotionThresholdDays,
      leadDays: policyRules.annualLeavePromotionLeadDays,
      messageTemplate: policyRules.annualLeavePromotionMessageTemplate,
      source: stored ? "configured" : "default",
      updatedAt: stored?.updatedAt.toISOString() ?? null
    },
    noticeWindow: {
      startAt: noticeWindowStart.toISOString(),
      endAt: noticeWindowEnd.toISOString(),
      isOpen: noticeWindowOpen
    },
    summary: {
      activeEmployeeCount: employees.length,
      potentialTargetCount: potentialTargets.length,
      displayTargetCount: displayTargets.length,
      eligibleNowCount
    },
    targets: displayTargets,
    announcementDraft: {
      title: `Annual leave promotion notice (${seoulYear})`,
      body: announcementBody
    }
  };
}

export async function dispatchAnnualLeavePromotionNotice(
  context: ServiceContext,
  input: DispatchAnnualLeavePromotionNoticeInput
): Promise<{
  organizationId: string;
  asOf: string;
  policy: {
    enabled: boolean;
    thresholdDays: number;
    leadDays: number;
    messageTemplate: string;
    source: "configured" | "default";
    updatedAt: string | null;
  };
  noticeWindow: {
    startAt: string;
    endAt: string;
    isOpen: boolean;
  };
  summary: {
    activeEmployeeCount: number;
    potentialTargetCount: number;
    displayTargetCount: number;
    eligibleNowCount: number;
    sentTargetCount: number;
  };
  targets: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    remainingDays: number;
    grantedDays: number;
    usedDays: number;
    lastAccrualYear: number | null;
    eligibleNow: boolean;
  }>;
  announcementDraft: {
    title: string;
    body: string;
  };
  delivery: {
    status: "dry_run" | "skipped_no_targets" | "dispatched";
    attempted: boolean;
    dryRun: boolean;
    channel: "webhook" | "email_template";
    provider: PromotionDeliveryProvider | null;
    webhookSource: string | null;
    webhookConfigured: boolean;
    emailTemplateSource: string | null;
    emailTemplateConfigured: boolean;
    emailTemplateId: string | null;
    recipientCount: number;
    missingEmailCount: number;
    dispatchedAt: string | null;
  };
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(
    context,
    Permissions.leaveAccrualSettle,
    "leave promotion notice dispatch requires permission"
  );

  const preview = await previewAnnualLeavePromotion(context, {
    organizationId: input.organizationId,
    asOf: input.asOf,
    includeUpcoming: input.includeUpcoming
  });

  const dryRun = input.dryRun ?? false;
  const includeUpcoming = Boolean(input.includeUpcoming);
  const channel = input.deliveryChannel ?? "webhook";
  const requestedTemplateId = input.emailTemplateId?.trim() || "";
  const configuredTemplateId = normalizeEnvValue(process.env.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_ID);
  const emailTemplateId = requestedTemplateId || configuredTemplateId || null;
  const targetCount = preview.targets.length;
  const recipients = preview.targets.flatMap((target) => {
    const email = target.email?.trim() || "";
    if (!email) {
      return [];
    }
    return [
      {
        employeeId: target.employeeId,
        email,
        name: target.name,
        remainingDays: target.remainingDays,
        grantedDays: target.grantedDays,
        usedDays: target.usedDays,
        lastAccrualYear: target.lastAccrualYear,
        eligibleNow: target.eligibleNow
      }
    ];
  });
  const recipientCount = recipients.length;
  const missingEmailCount = Math.max(targetCount - recipientCount, 0);
  const webhook = channel === "webhook" ? resolvePromotionWebhookConfig() : null;
  const emailTemplateConfig =
    channel === "email_template" ? resolvePromotionEmailTemplateConfig() : null;
  const attempted = !dryRun && (channel === "webhook" ? targetCount > 0 : recipientCount > 0);

  const provider: PromotionDeliveryProvider | null =
    channel === "webhook"
      ? webhook?.provider ?? null
      : emailTemplateConfig
        ? "email_template"
        : null;

  if (channel === "email_template" && attempted && !emailTemplateId) {
    await context.dataAccess.audit.append({
      action: "leave.promotion_notice.failed",
      entityType: "LeavePolicy",
      organizationId: preview.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        asOf: preview.asOf,
        includeUpcoming,
        dryRun,
        targetCount,
        recipientCount,
        missingEmailCount,
        channel,
        reason: "email_template_id_missing"
      }
    });
    throw new ServiceError(
      400,
      "emailTemplateId is required for deliveryChannel=email_template (or set FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_ID)"
    );
  }

  if (channel === "webhook" && attempted && !webhook) {
    await context.dataAccess.audit.append({
      action: "leave.promotion_notice.failed",
      entityType: "LeavePolicy",
      organizationId: preview.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        asOf: preview.asOf,
        includeUpcoming,
        dryRun,
        targetCount,
        recipientCount,
        missingEmailCount,
        channel,
        reason: "webhook_not_configured"
      }
    });
    throw new ServiceError(
      503,
      "leave promotion webhook is not configured (set FLOWHR_LEAVE_PROMOTION_* or FLOWHR_ALERT_* webhook env)"
    );
  }

  if (channel === "email_template" && attempted && !emailTemplateConfig) {
    await context.dataAccess.audit.append({
      action: "leave.promotion_notice.failed",
      entityType: "LeavePolicy",
      organizationId: preview.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        asOf: preview.asOf,
        includeUpcoming,
        dryRun,
        targetCount,
        recipientCount,
        missingEmailCount,
        channel,
        reason: "email_template_not_configured"
      }
    });
    throw new ServiceError(
      503,
      "leave promotion email template dispatch is not configured (set FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL and FLOWHR_LEAVE_PROMOTION_EMAIL_FROM)"
    );
  }

  const message = buildPromotionNoticeMessage({
    organizationId: preview.organizationId,
    asOf: preview.asOf,
    includeUpcoming,
    dryRun,
    noticeWindow: preview.noticeWindow,
    summary: preview.summary,
    targets: preview.targets,
    announcementDraft: preview.announcementDraft
  });

  let status: "dry_run" | "skipped_no_targets" | "dispatched" = "dry_run";
  let dispatchedAt: string | null = null;

  if (attempted) {
    try {
      if (channel === "webhook" && webhook) {
        await sendPromotionWebhook(webhook, message);
      } else if (channel === "email_template" && emailTemplateConfig && emailTemplateId) {
        await sendPromotionEmailTemplate(emailTemplateConfig, {
          templateId: emailTemplateId,
          from: emailTemplateConfig.from,
          subject: preview.announcementDraft.title,
          body: preview.announcementDraft.body,
          organizationId: preview.organizationId,
          asOf: preview.asOf,
          includeUpcoming,
          noticeWindow: preview.noticeWindow,
          summary: preview.summary,
          recipients
        });
      }
      status = "dispatched";
      dispatchedAt = new Date().toISOString();
    } catch (error) {
      await context.dataAccess.audit.append({
        action: "leave.promotion_notice.failed",
        entityType: "LeavePolicy",
        organizationId: preview.organizationId,
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          asOf: preview.asOf,
          includeUpcoming,
          dryRun,
          targetCount,
          recipientCount,
          missingEmailCount,
          channel,
          provider,
          webhookSource: webhook?.source ?? null,
          emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
          emailTemplateId,
          error: error instanceof Error ? error.message : "unknown error"
        }
      });
      if (channel === "webhook") {
        throw new ServiceError(502, "leave promotion webhook request failed");
      }
      throw new ServiceError(502, "leave promotion email template request failed");
    }
  } else if (!dryRun) {
    status = "skipped_no_targets";
  }

  const sentTargetCount =
    status === "dispatched" ? (channel === "webhook" ? targetCount : recipientCount) : 0;
  const action =
    status === "dispatched"
      ? "leave.promotion_notice.dispatched"
      : status === "skipped_no_targets"
        ? "leave.promotion_notice.skipped"
        : "leave.promotion_notice.dry_run";

  await context.dataAccess.audit.append({
    action,
    entityType: "LeavePolicy",
    organizationId: preview.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      asOf: preview.asOf,
      includeUpcoming,
      dryRun,
      targetCount,
      recipientCount,
      missingEmailCount,
      sentTargetCount,
      status,
      channel,
      provider,
      webhookSource: webhook?.source ?? null,
      emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
      emailTemplateId
    }
  });

  if (status === "dispatched" && dispatchedAt) {
    try {
      await getEventPublisher(context).publish({
        name: "leave.promotion.notice.dispatched.v1",
        occurredAt: dispatchedAt,
        entityType: "LeavePolicy",
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          organizationId: preview.organizationId,
          asOf: preview.asOf,
          includeUpcoming,
          targetCount,
          recipientCount,
          missingEmailCount,
          channel,
          provider,
          webhookSource: webhook?.source ?? null,
          emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
          emailTemplateId,
          announcementTitle: preview.announcementDraft.title,
          noticeWindow: preview.noticeWindow,
          targetEmployeeIds:
            channel === "webhook"
              ? preview.targets.slice(0, 100).map((target) => target.employeeId)
              : recipients.slice(0, 100).map((target) => target.employeeId)
        }
      });
    } catch (error) {
      try {
        await context.dataAccess.audit.append({
          action: "leave.promotion_notice.event_publish_failed",
          entityType: "LeavePolicy",
          organizationId: preview.organizationId,
          actorRole: actor.role,
          actorId: actor.id,
          payload: {
            asOf: preview.asOf,
            includeUpcoming,
            dispatchedAt,
            targetCount,
            recipientCount,
            missingEmailCount,
            channel,
            provider,
            webhookSource: webhook?.source ?? null,
            emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
            emailTemplateId,
            error: error instanceof Error ? error.message : "unknown error"
          }
        });
      } catch {
        // Non-blocking failure path: dispatch already completed.
      }
    }
  }

  return {
    organizationId: preview.organizationId,
    asOf: preview.asOf,
    policy: preview.policy,
    noticeWindow: preview.noticeWindow,
    summary: {
      activeEmployeeCount: preview.summary.activeEmployeeCount,
      potentialTargetCount: preview.summary.potentialTargetCount,
      displayTargetCount: preview.summary.displayTargetCount,
      eligibleNowCount: preview.summary.eligibleNowCount,
      sentTargetCount
    },
    targets: preview.targets,
    announcementDraft: preview.announcementDraft,
    delivery: {
      status,
      attempted,
      dryRun,
      channel,
      provider,
      webhookSource: webhook?.source ?? null,
      webhookConfigured: webhook !== null,
      emailTemplateSource: emailTemplateConfig?.urlSource ?? null,
      emailTemplateConfigured: emailTemplateConfig !== null,
      emailTemplateId,
      recipientCount,
      missingEmailCount,
      dispatchedAt
    }
  };
}

export const leaveServiceInternals = {
  calculateLeaveDays,
  calculateRequestedLeave,
  resolveSeoulYearEnd,
  renderPromotionMessageTemplate
};
