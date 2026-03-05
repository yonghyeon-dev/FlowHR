import type { Actor } from "@/lib/actor";
import { requireOwnOrAny, requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import { applyApprovalExecutionAction, assertApprovalPolicyGate } from "@/features/approval/service";
import {
  notifyLeaveApproved,
  notifyLeaveRejected
} from "@/features/notifications/service";
import {
  dispatchAnnualLeavePromotionNoticeImpl,
  listLeavePromotionDeliveriesImpl,
  previewAnnualLeavePromotionImpl,
  readLeavePromotionDeliveryImpl,
  retryLeavePromotionDeliveryImpl
} from "@/features/leave/helpers/promotion-service-helpers";
import {
  assertValidLeaveBalanceYear,
  assertValidUpsertLeavePolicyInput,
  buildAvailableLeaveBalanceSummary,
  resolveSeoulYearFromDate,
  resolveSeoulYearRange
} from "@/features/leave/helpers/balance-policy-date-helpers";
import {
  DEFAULT_ALLOW_HALF_DAY,
  DEFAULT_ALLOW_HOURLY,
  DEFAULT_ANNUAL_LEAVE_PROMOTION_ENABLED,
  DEFAULT_ANNUAL_LEAVE_PROMOTION_LEAD_DAYS,
  DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE,
  DEFAULT_ANNUAL_LEAVE_PROMOTION_THRESHOLD_DAYS,
  DEFAULT_CARRY_OVER_CAP_DAYS,
  DEFAULT_GRANTED_DAYS,
  DEFAULT_HOURLY_INCREMENT_MINUTES,
  DEFAULT_MAX_CONSECUTIVE_DAYS,
  DEFAULT_MAX_HOURS_PER_REQUEST,
  DEFAULT_MIN_NOTICE_DAYS,
  assertPolicyRequestConstraints,
  calculateLeaveDays,
  calculateProRatedAnnualGrantDays,
  calculateRequestedLeave,
  ensureValidPeriod,
  renderPromotionMessageTemplate,
  resolvePolicyRules,
  resolveSeoulYearEnd,
  roundTo2,
} from "@/features/leave/policy-time-helpers";
import type {
  DataAccess,
  LeaveBalanceEntity,
  LeavePolicyStatus,
  LeaveRequestEntity,
  LeaveRequestUnit,
  LeaveType
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { ensureTenantMatch, requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

export type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

type CreateLeaveRequestInput = {
  employeeId: string;
  policyId?: string;
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

type AutoGrantLeaveAccrualInput = {
  organizationId?: string;
  year: number;
  dryRun?: boolean;
  includeAlreadySettled?: boolean;
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

type ListLeavePoliciesInput = {
  organizationId?: string;
  status?: LeavePolicyStatus;
};

type DeleteLeavePolicyInput = {
  policyId: string;
  organizationId?: string;
};

export type PreviewAnnualLeavePromotionInput = {
  organizationId?: string;
  asOf?: Date;
  includeUpcoming?: boolean;
};

export type DispatchAnnualLeavePromotionNoticeInput = {
  organizationId?: string;
  asOf?: Date;
  includeUpcoming?: boolean;
  dryRun?: boolean;
  deliveryChannel?: "webhook" | "email_template";
  emailTemplateId?: string;
};

export type ListLeavePromotionDeliveriesInput = {
  organizationId?: string;
  channel?: "webhook" | "email_template";
  status?: "dry_run" | "skipped_no_targets" | "dispatched" | "failed";
  retryOfDeliveryId?: string;
  limit?: number;
};

export type ReadLeavePromotionDeliveryInput = {
  deliveryId: string;
  organizationId?: string;
};

export type RetryLeavePromotionDeliveryInput = {
  deliveryId: string;
  organizationId?: string;
  dryRun?: boolean;
  emailTemplateId?: string;
  recipientEmployeeIds?: string[];
};

type ListLeaveRequestsInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  state?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
};

type GetAvailableLeaveBalanceInput = {
  employeeId: string;
  leaveType: LeaveType;
  year: number;
};

type AvailableLeaveBalance = {
  total: number;
  used: number;
  pending: number;
  available: number;
};

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

function requireAdminRole(actor: Actor | null): asserts actor is Actor {
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (actor.role !== "admin") {
    throw new ServiceError(403, "admin role required");
  }
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

async function calculateAvailableLeaveBalance(
  context: ServiceContext,
  input: GetAvailableLeaveBalanceInput
): Promise<AvailableLeaveBalance> {
  assertValidLeaveBalanceYear(input.year);

  const projection = await context.dataAccess.leaveBalance.ensure(
    input.employeeId,
    DEFAULT_GRANTED_DAYS
  );
  const { periodStart, periodEnd } = resolveSeoulYearRange(input.year);
  const requests = await context.dataAccess.leave.listInPeriod({
    periodStart,
    periodEnd,
    employeeId: input.employeeId
  });
  return buildAvailableLeaveBalanceSummary(requests, input.leaveType, projection.grantedDays);
}

async function ensureStatutoryLeavePolicies(context: ServiceContext, organizationId: string) {
  const activePolicies = await context.dataAccess.leavePolicy.list({
    organizationId,
    status: "ACTIVE"
  });
  const activeStatutoryNames = new Set(
    activePolicies
      .filter((policy) => policy.isStatutory)
      .map((policy) => policy.name.trim().toLowerCase())
  );

  if (!activeStatutoryNames.has("annual leave")) {
    await context.dataAccess.leavePolicy.create({
      organizationId,
      name: "Annual Leave",
      isStatutory: true,
      status: "ACTIVE",
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
      annualLeavePromotionMessageTemplate: DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE
    });
  }

  if (!activeStatutoryNames.has("sick leave")) {
    await context.dataAccess.leavePolicy.create({
      organizationId,
      name: "Sick Leave",
      isStatutory: true,
      status: "ACTIVE",
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
      annualLeavePromotionMessageTemplate: DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE
    });
  }
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

  let policy =
    employee.organizationId
      ? await context.dataAccess.leavePolicy.findByOrganizationId(employee.organizationId)
      : null;
  if (employee.organizationId && input.policyId) {
    const selectedPolicy = await context.dataAccess.leavePolicy.findById(input.policyId);
    if (!selectedPolicy || selectedPolicy.organizationId !== employee.organizationId) {
      throw new ServiceError(404, "leave policy not found");
    }
    if (selectedPolicy.status !== "ACTIVE") {
      throw new ServiceError(409, "leave policy is not active");
    }
    policy = selectedPolicy;
  }

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

  const requestYear = resolveSeoulYearFromDate(input.startDate);
  const availableBalance = await calculateAvailableLeaveBalance(context, {
    employeeId: input.employeeId,
    leaveType: input.leaveType,
    year: requestYear
  });
  if (availableBalance.available + 1e-9 < requested.days) {
    throw new ServiceError(
      400,
      `insufficient leave balance: available ${availableBalance.available} day(s), requested ${requested.days} day(s)`,
      {
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        year: requestYear,
        currentBalance: availableBalance.available,
        requestedDays: requested.days,
        total: availableBalance.total,
        used: availableBalance.used,
        pending: availableBalance.pending
      }
    );
  }

  await ensureNoOverlap(context, {
    employeeId: input.employeeId,
    startDate: input.startDate,
    endDate: input.endDate
  });

  const request = await context.dataAccess.leave.create({
    employeeId: input.employeeId,
    policyId: policy?.id ?? null,
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

  if (employee.organizationId) {
    notifyLeaveApproved(context, {
      organizationId: employee.organizationId,
      employeeId: request.employeeId,
      leaveType: request.leaveType,
      startDate: request.startDate.toISOString().slice(0, 10),
      endDate: request.endDate.toISOString().slice(0, 10)
    }).catch(() => {});
  }

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

  if (employee.organizationId) {
    notifyLeaveRejected(context, {
      organizationId: employee.organizationId,
      employeeId: request.employeeId,
      leaveType: pending.leaveType,
      reason
    }).catch(() => {});
  }

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

async function requireLeaveBalanceAccess(context: ServiceContext, employeeId: string) {
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
  return { actor, employee };
}

export async function getAvailableLeaveBalance(
  context: ServiceContext,
  input: GetAvailableLeaveBalanceInput
): Promise<AvailableLeaveBalance> {
  await requireLeaveBalanceAccess(context, input.employeeId);
  return calculateAvailableLeaveBalance(context, input);
}

export async function readLeaveBalance(
  context: ServiceContext,
  employeeId: string
): Promise<LeaveBalanceEntity> {
  const { actor, employee } = await requireLeaveBalanceAccess(context, employeeId);

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

export async function autoGrantLeaveAccrual(
  context: ServiceContext,
  input: AutoGrantLeaveAccrualInput
): Promise<{
  organizationId: string;
  year: number;
  dryRun: boolean;
  policy: {
    annualGrantDays: number;
    carryOverCapDays: number;
    source: "configured" | "default";
  };
  summary: {
    activeEmployeeCount: number;
    eligibleCount: number;
    alreadySettledCount: number;
    notEligibleCount: number;
    appliedCount: number;
    failedCount: number;
    totalSuggestedGrantDays: number;
    totalProjectedCarryOverDays: number;
  };
  results: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    joinedAt: string;
    lastAccrualYear: number | null;
    currentRemainingDays: number;
    suggestedAnnualGrantDays: number;
    carryOverAppliedDays: number;
    projectedGrantedDays: number;
    projectedRemainingDays: number;
    status: "ELIGIBLE" | "ALREADY_SETTLED" | "NOT_ELIGIBLE" | "APPLIED" | "FAILED";
    reason: string | null;
    balance:
      | {
          grantedDays: number;
          usedDays: number;
          remainingDays: number;
          carryOverDays: number;
          lastAccrualYear: number | null;
          updatedAt: string;
        }
      | null;
  }>;
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(
    context,
    Permissions.leaveAccrualSettle,
    "leave accrual auto-grant requires permission"
  );

  if (!Number.isInteger(input.year) || input.year < 2000 || input.year > 9999) {
    throw new ServiceError(400, "year must be a valid 4-digit year");
  }

  const organizationId = resolveTargetOrganizationId(actor, input.organizationId);
  ensureTenantAccess(actor, organizationId);

  const dryRun = input.dryRun ?? true;
  const includeAlreadySettled = input.includeAlreadySettled ?? true;
  const storedPolicy = await context.dataAccess.leavePolicy.findByOrganizationId(organizationId);
  const rules = resolvePolicyRules(storedPolicy);
  const employees = await context.dataAccess.employees.list({ organizationId, active: true });

  const results: Array<{
    employeeId: string;
    name: string | null;
    email: string | null;
    joinedAt: string;
    lastAccrualYear: number | null;
    currentRemainingDays: number;
    suggestedAnnualGrantDays: number;
    carryOverAppliedDays: number;
    projectedGrantedDays: number;
    projectedRemainingDays: number;
    status: "ELIGIBLE" | "ALREADY_SETTLED" | "NOT_ELIGIBLE" | "APPLIED" | "FAILED";
    reason: string | null;
    balance:
      | {
          grantedDays: number;
          usedDays: number;
          remainingDays: number;
          carryOverDays: number;
          lastAccrualYear: number | null;
          updatedAt: string;
        }
      | null;
  }> = [];

  let eligibleCount = 0;
  let alreadySettledCount = 0;
  let notEligibleCount = 0;
  let appliedCount = 0;
  let failedCount = 0;
  let totalSuggestedGrantDays = 0;
  let totalProjectedCarryOverDays = 0;

  for (const employee of employees) {
    const currentBalance = await context.dataAccess.leaveBalance.ensure(employee.id, DEFAULT_GRANTED_DAYS);
    const suggestedAnnualGrantDays = calculateProRatedAnnualGrantDays({
      joinDate: employee.createdAt,
      year: input.year,
      annualGrantDays: rules.annualGrantDays
    });
    const carryOverAppliedDays = roundTo2(
      Math.min(rules.carryOverCapDays, Math.max(0, currentBalance.remainingDays))
    );
    const projectedGrantedDays = roundTo2(suggestedAnnualGrantDays + carryOverAppliedDays);
    const projectedRemainingDays = projectedGrantedDays;
    const common = {
      employeeId: employee.id,
      name: employee.name,
      email: employee.email,
      joinedAt: employee.createdAt.toISOString(),
      lastAccrualYear: currentBalance.lastAccrualYear,
      currentRemainingDays: currentBalance.remainingDays,
      suggestedAnnualGrantDays,
      carryOverAppliedDays,
      projectedGrantedDays,
      projectedRemainingDays
    };

    if (currentBalance.lastAccrualYear !== null && currentBalance.lastAccrualYear >= input.year) {
      alreadySettledCount += 1;
      if (includeAlreadySettled) {
        results.push({
          ...common,
          status: "ALREADY_SETTLED",
          reason: "already settled for the same or newer year",
          balance: null
        });
      }
      continue;
    }

    if (suggestedAnnualGrantDays <= 0) {
      notEligibleCount += 1;
      results.push({
        ...common,
        status: "NOT_ELIGIBLE",
        reason: "join date is after target year",
        balance: null
      });
      continue;
    }

    eligibleCount += 1;
    totalSuggestedGrantDays = roundTo2(totalSuggestedGrantDays + suggestedAnnualGrantDays);
    totalProjectedCarryOverDays = roundTo2(totalProjectedCarryOverDays + carryOverAppliedDays);

    if (dryRun) {
      results.push({
        ...common,
        status: "ELIGIBLE",
        reason: null,
        balance: null
      });
      continue;
    }

    try {
      const appliedBalance = await settleLeaveAccrual(context, {
        employeeId: employee.id,
        year: input.year,
        annualGrantDays: suggestedAnnualGrantDays,
        carryOverCapDays: rules.carryOverCapDays
      });

      appliedCount += 1;
      results.push({
        ...common,
        status: "APPLIED",
        reason: null,
        balance: {
          grantedDays: appliedBalance.grantedDays,
          usedDays: appliedBalance.usedDays,
          remainingDays: appliedBalance.remainingDays,
          carryOverDays: appliedBalance.carryOverDays,
          lastAccrualYear: appliedBalance.lastAccrualYear,
          updatedAt: appliedBalance.updatedAt.toISOString()
        }
      });
    } catch (error) {
      failedCount += 1;
      const reason =
        error instanceof ServiceError
          ? error.message
          : error instanceof Error
            ? error.message
            : "unknown error";
      results.push({
        ...common,
        status: "FAILED",
        reason,
        balance: null
      });
    }
  }

  await context.dataAccess.audit.append({
    action: dryRun ? "leave.accrual_auto_grant.dry_run" : "leave.accrual_auto_grant.applied",
    entityType: "LeaveBalanceProjection",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      year: input.year,
      policySource: storedPolicy ? "configured" : "default",
      annualGrantDays: rules.annualGrantDays,
      carryOverCapDays: rules.carryOverCapDays,
      includeAlreadySettled,
      activeEmployeeCount: employees.length,
      eligibleCount,
      alreadySettledCount,
      notEligibleCount,
      appliedCount,
      failedCount,
      totalSuggestedGrantDays,
      totalProjectedCarryOverDays
    }
  });

  return {
    organizationId,
    year: input.year,
    dryRun,
    policy: {
      annualGrantDays: rules.annualGrantDays,
      carryOverCapDays: rules.carryOverCapDays,
      source: storedPolicy ? "configured" : "default"
    },
    summary: {
      activeEmployeeCount: employees.length,
      eligibleCount,
      alreadySettledCount,
      notEligibleCount,
      appliedCount,
      failedCount,
      totalSuggestedGrantDays,
      totalProjectedCarryOverDays
    },
    results
  };
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

  assertValidUpsertLeavePolicyInput(input);

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

export async function listLeavePolicies(
  context: ServiceContext,
  input: ListLeavePoliciesInput
): Promise<{
  organizationId: string;
  policies: Array<{
    id: string;
    name: string;
    isStatutory: boolean;
    status: LeavePolicyStatus;
    usageCount: number;
    updatedAt: string;
  }>;
}> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.leaveBalanceReadAny, "leave policy list requires permission");

  const organizationId = resolveTargetOrganizationId(actor, input.organizationId);
  ensureTenantAccess(actor, organizationId);
  await ensureStatutoryLeavePolicies(context, organizationId);

  const status = input.status ?? "ACTIVE";
  const policies = await context.dataAccess.leavePolicy.list({
    organizationId,
    status
  });

  const rows = await Promise.all(
    policies.map(async (policy) => ({
      id: policy.id,
      name: policy.name,
      isStatutory: policy.isStatutory,
      status: policy.status,
      usageCount: await context.dataAccess.leavePolicy.countUsage(policy.id),
      updatedAt: policy.updatedAt.toISOString()
    }))
  );

  await context.dataAccess.audit.append({
    action: "leave.policy_list",
    entityType: "LeavePolicy",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      status,
      count: rows.length
    }
  });

  return {
    organizationId,
    policies: rows
  };
}

export async function deleteLeavePolicy(
  context: ServiceContext,
  input: DeleteLeavePolicyInput
): Promise<{
  policy: {
    id: string;
    organizationId: string;
    name: string;
    isStatutory: boolean;
    status: LeavePolicyStatus;
    usageCount: number;
    updatedAt: string;
  };
}> {
  const actor = context.actor;
  requireAdminRole(actor);

  const policyId = input.policyId.trim();
  if (!policyId) {
    throw new ServiceError(400, "policyId is required");
  }

  const existing = await context.dataAccess.leavePolicy.findById(policyId);
  if (!existing) {
    throw new ServiceError(404, "leave policy not found");
  }
  if (input.organizationId && input.organizationId !== existing.organizationId) {
    throw new ServiceError(404, "leave policy not found");
  }
  ensureTenantAccess(actor, existing.organizationId);

  if (existing.isStatutory) {
    throw new ServiceError(400, "Cannot delete statutory leave policy");
  }

  const usageCount = await context.dataAccess.leavePolicy.countUsage(existing.id);
  if (usageCount > 0) {
    throw new ServiceError(400, "Policy has active usage, cannot delete");
  }

  const archived = await context.dataAccess.leavePolicy.archive(existing.id);

  await context.dataAccess.audit.append({
    action: "leave.policy_archived",
    entityType: "LeavePolicy",
    entityId: archived.id,
    organizationId: archived.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      name: archived.name
    }
  });

  return {
    policy: {
      id: archived.id,
      organizationId: archived.organizationId,
      name: archived.name,
      isStatutory: archived.isStatutory,
      status: archived.status,
      usageCount: 0,
      updatedAt: archived.updatedAt.toISOString()
    }
  };
}

export async function previewAnnualLeavePromotion(
  context: ServiceContext,
  input: PreviewAnnualLeavePromotionInput
) {
  return previewAnnualLeavePromotionImpl(context, input);
}

export async function dispatchAnnualLeavePromotionNotice(
  context: ServiceContext,
  input: DispatchAnnualLeavePromotionNoticeInput
) {
  return dispatchAnnualLeavePromotionNoticeImpl(context, input);
}

export async function listLeavePromotionDeliveries(
  context: ServiceContext,
  input: ListLeavePromotionDeliveriesInput
) {
  return listLeavePromotionDeliveriesImpl(context, input);
}

export async function readLeavePromotionDelivery(
  context: ServiceContext,
  input: ReadLeavePromotionDeliveryInput
) {
  return readLeavePromotionDeliveryImpl(context, input);
}

export async function retryLeavePromotionDelivery(
  context: ServiceContext,
  input: RetryLeavePromotionDeliveryInput
) {
  return retryLeavePromotionDeliveryImpl(context, input);
}

export const leaveServiceInternals = {
  calculateLeaveDays,
  calculateRequestedLeave,
  resolveSeoulYearEnd,
  renderPromotionMessageTemplate
};




