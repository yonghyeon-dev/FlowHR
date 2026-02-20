import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  ApprovalDelegationEntity,
  ApprovalDomain,
  ApprovalExecutionEntity,
  ApprovalExecutionState,
  ApprovalLineTemplateEntity,
  ApprovalPolicyEntity,
  ApprovalStageHistoryEntity,
  ApprovalStageResolution,
  DataAccess
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { ServiceError } from "@/features/shared/service-error";
import { ensureTenantMatch, resolveTenantScope } from "@/features/shared/tenant-scope";

const defaultApprovalPolicyRoles: Record<ApprovalDomain, string> = {
  ATTENDANCE: "manager",
  LEAVE: "manager",
  PAYROLL: "payroll_operator"
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

type ReadApprovalPolicyInput = {
  organizationId?: string;
};

type UpsertApprovalPolicyInput = {
  organizationId?: string;
  attendanceApproverRole: string;
  leaveApproverRole: string;
  payrollApproverRole: string;
};

type ListApprovalDelegationsInput = {
  organizationId?: string;
  domain?: ApprovalDomain;
  active?: boolean;
  delegateActorId?: string;
};

type ListApprovalLineTemplatesInput = {
  organizationId?: string;
  domain?: ApprovalDomain;
  active?: boolean;
};

type ListApprovalStageHistoryInput = {
  organizationId?: string;
  domain?: ApprovalDomain;
  targetEntityType?: string;
  targetEntityId?: string;
  allowed?: boolean;
  resolution?: ApprovalStageResolution;
  from?: Date;
  to?: Date;
  limit?: number;
};

type ListApprovalExecutionsInput = {
  organizationId?: string;
  domain?: ApprovalDomain;
  targetEntityType?: string;
  targetEntityId?: string;
  state?: ApprovalExecutionState;
  limit?: number;
  sort?: "updated_desc" | "priority_desc";
  stalledHoursMin?: number;
  asOf?: Date;
};

type TriggerApprovalExecutionEscalationInput = {
  organizationId?: string;
  domain?: ApprovalDomain;
  stalledHoursMin?: number;
  limit?: number;
  asOf?: Date;
  dryRun?: boolean;
  notificationChannel?: string;
};

type ApprovalExecutionEscalationDecision = "REQUESTED" | "DRY_RUN";

type ApprovalExecutionEscalationItem = {
  executionId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  stalledHours: number;
  currentStageIndex: number;
  totalStages: number;
  decision: ApprovalExecutionEscalationDecision;
};

type ApprovalEscalationWebhookProvider = "discord" | "slack";

type ApprovalEscalationWebhookConfig = {
  url: string;
  provider: ApprovalEscalationWebhookProvider;
  source: string;
};

type CreateApprovalDelegationInput = {
  organizationId?: string;
  domain: ApprovalDomain;
  delegatorRole: string;
  delegateActorId: string;
  startsAt: Date;
  endsAt: Date;
  reason?: string;
  active?: boolean;
};

type CreateApprovalLineTemplateInput = {
  organizationId?: string;
  name: string;
  domain: ApprovalDomain;
  approverRoles?: string[];
  approvalStages?: ApprovalTemplateStageInput[];
  payrollGrossPayMinKrw?: number | null;
  payrollGrossPayMaxKrw?: number | null;
  active?: boolean;
};

type UpdateApprovalDelegationInput = {
  delegateActorId?: string;
  startsAt?: Date;
  endsAt?: Date;
  reason?: string | null;
  active?: boolean;
};

type UpdateApprovalLineTemplateInput = {
  name?: string;
  domain?: ApprovalDomain;
  approverRoles?: string[];
  approvalStages?: ApprovalTemplateStageInput[];
  payrollGrossPayMinKrw?: number | null;
  payrollGrossPayMaxKrw?: number | null;
  active?: boolean;
};

type ApprovalTemplateStageInput = {
  stageIndex: number;
  label?: string;
  approverRoles: string[];
  minApprovals?: number;
};

type PreviewApprovalPolicyGateInput = {
  organizationId?: string;
  domain: ApprovalDomain;
  actorRole?: string;
  actorId?: string;
  payrollGrossPayKrw?: number | null;
  effectiveAt?: Date;
};

type ApplyApprovalExecutionActionInput = {
  domain: ApprovalDomain;
  organizationId: string | null;
  targetEntityType: string;
  targetEntityId: string;
  action: "APPROVE" | "REJECT";
  payrollGrossPayKrw?: number | null;
  evaluatedAt?: Date;
};

type ExpireApprovalDelegationsInput = {
  organizationId?: string;
  expiresBeforeAt?: Date;
  dryRun?: boolean;
};

type ExpireApprovalDelegationsSweepInput = {
  organizationIds?: string[];
  expiresBeforeAt?: Date;
  dryRun?: boolean;
};

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

function requireActor(context: ServiceContext): Actor {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  return context.actor;
}

function isPrivilegedActor(role: string) {
  return role === "admin" || role === "system";
}

async function resolveOrganizationId(
  context: ServiceContext,
  requestedOrganizationId?: string
): Promise<string> {
  const actor = requireActor(context);
  const requested = requestedOrganizationId?.trim() ?? "";
  const resolved = requested || actor.organizationId || "";
  if (!resolved) {
    throw new ServiceError(400, "organizationId is required");
  }

  const tenantScope = resolveTenantScope(actor);
  ensureTenantMatch(tenantScope, resolved, "organization not found");

  const organization = await context.dataAccess.organizations.findById(resolved);
  if (!organization) {
    throw new ServiceError(404, "organization not found");
  }

  return organization.id;
}

function ensureValidDelegationWindow(startsAt: Date, endsAt: Date) {
  if (endsAt <= startsAt) {
    throw new ServiceError(400, "endsAt must be after startsAt");
  }
}

function normalizeApproverRoles(input: string[]): string[] {
  const deduped = new Set<string>();
  for (const role of input) {
    const normalized = role.trim();
    if (!normalized) {
      continue;
    }
    deduped.add(normalized);
  }
  const roles = Array.from(deduped);
  if (roles.length === 0) {
    throw new ServiceError(400, "approverRoles must contain at least one role");
  }
  return roles;
}

function normalizeApprovalTemplateStages(input: {
  approverRoles?: string[];
  approvalStages?: ApprovalTemplateStageInput[];
  fallbackApproverRoles?: string[];
  fallbackApprovalStages?: ApprovalTemplateStageInput[];
}): {
  approverRoles: string[];
  approvalStages: Array<{
    stageIndex: number;
    label: string;
    approverRoles: string[];
    minApprovals: number;
  }>;
} {
  const stageInput = input.approvalStages;
  if (!stageInput || stageInput.length === 0) {
    const fallbackApprovalStages = (input.fallbackApprovalStages ?? [])
      .map((stage) => ({
        stageIndex: stage.stageIndex,
        label: stage.label?.trim() || `stage-${stage.stageIndex}`,
        approverRoles: [...stage.approverRoles],
        minApprovals: Math.max(1, Math.min(stage.minApprovals ?? 1, stage.approverRoles.length))
      }))
      .sort((left, right) => left.stageIndex - right.stageIndex);

    if (input.approverRoles !== undefined) {
      const baseApproverRoles = normalizeApproverRoles(input.approverRoles);
      if (fallbackApprovalStages.length > 0) {
        const firstStage = fallbackApprovalStages[0];
        firstStage.approverRoles = baseApproverRoles;
        firstStage.minApprovals = Math.max(
          1,
          Math.min(firstStage.minApprovals ?? 1, baseApproverRoles.length)
        );
        return {
          approverRoles: baseApproverRoles,
          approvalStages: fallbackApprovalStages
        };
      }
      return {
        approverRoles: baseApproverRoles,
        approvalStages: [
          {
            stageIndex: 1,
            label: "stage-1",
            approverRoles: baseApproverRoles,
            minApprovals: 1
          }
        ]
      };
    }

    if (fallbackApprovalStages.length > 0) {
      return {
        approverRoles: [...fallbackApprovalStages[0].approverRoles],
        approvalStages: fallbackApprovalStages
      };
    }

    const baseApproverRoles = normalizeApproverRoles(input.fallbackApproverRoles ?? []);
    return {
      approverRoles: baseApproverRoles,
      approvalStages: [
        {
          stageIndex: 1,
          label: "stage-1",
          approverRoles: baseApproverRoles,
          minApprovals: 1
        }
      ]
    };
  }

  const normalized = stageInput.map((stage) => {
    if (!Number.isInteger(stage.stageIndex) || stage.stageIndex < 1) {
      throw new ServiceError(400, "approval stage index must be an integer greater than or equal to 1");
    }
    const approverRoles = normalizeApproverRoles(stage.approverRoles);
    const label = stage.label?.trim() || `stage-${stage.stageIndex}`;
    if (label.length > 80) {
      throw new ServiceError(400, "approval stage label must be 80 characters or fewer");
    }
    const minApprovals = stage.minApprovals ?? 1;
    if (!Number.isInteger(minApprovals) || minApprovals < 1) {
      throw new ServiceError(400, "approval stage minApprovals must be an integer greater than or equal to 1");
    }
    if (minApprovals > approverRoles.length) {
      throw new ServiceError(
        400,
        "approval stage minApprovals must be less than or equal to approverRoles length"
      );
    }
    return {
      stageIndex: stage.stageIndex,
      label,
      approverRoles,
      minApprovals
    };
  });

  normalized.sort((left, right) => left.stageIndex - right.stageIndex);
  if (normalized.length > 5) {
    throw new ServiceError(400, "approval stages must contain at most 5 stages");
  }

  const seen = new Set<number>();
  for (let index = 0; index < normalized.length; index += 1) {
    const stage = normalized[index];
    if (seen.has(stage.stageIndex)) {
      throw new ServiceError(400, "approval stage index must be unique");
    }
    seen.add(stage.stageIndex);
    if (stage.stageIndex !== index + 1) {
      throw new ServiceError(400, "approval stage indexes must be sequential starting from 1");
    }
  }

  return {
    approverRoles: normalized[0].approverRoles,
    approvalStages: normalized
  };
}

function toPolicyFallback(organizationId: string): ApprovalPolicyEntity {
  const now = new Date();
  return {
    id: "default",
    organizationId,
    attendanceApproverRole: defaultApprovalPolicyRoles.ATTENDANCE,
    leaveApproverRole: defaultApprovalPolicyRoles.LEAVE,
    payrollApproverRole: defaultApprovalPolicyRoles.PAYROLL,
    createdAt: now,
    updatedAt: now
  };
}

function resolvePolicyApproverRole(
  policy: ApprovalPolicyEntity | null,
  domain: ApprovalDomain
): string {
  if (!policy) {
    return defaultApprovalPolicyRoles[domain];
  }
  if (domain === "ATTENDANCE") {
    return policy.attendanceApproverRole;
  }
  if (domain === "LEAVE") {
    return policy.leaveApproverRole;
  }
  return policy.payrollApproverRole;
}

function resolveExpectedApproverRoles(
  policy: ApprovalPolicyEntity | null,
  templates: ApprovalLineTemplateEntity[],
  input: { domain: ApprovalDomain; payrollGrossPayKrw?: number | null }
): string[] {
  const matchedTemplates = templates.filter((template) =>
    doesTemplateMatchGateContext(template, input)
  );
  if (matchedTemplates.length === 0) {
    return [resolvePolicyApproverRole(policy, input.domain)];
  }

  const deduped = new Set<string>();
  for (const template of matchedTemplates) {
    for (const role of template.approverRoles) {
      const normalized = role.trim();
      if (!normalized) {
        continue;
      }
      deduped.add(normalized);
    }
  }

  const roles = Array.from(deduped);
  if (roles.length > 0) {
    return roles;
  }
  return [resolvePolicyApproverRole(policy, input.domain)];
}

function doesTemplateMatchGateContext(
  template: ApprovalLineTemplateEntity,
  input: { domain: ApprovalDomain; payrollGrossPayKrw?: number | null }
) {
  if (template.domain !== input.domain) {
    return false;
  }
  if (input.domain !== "PAYROLL") {
    return true;
  }

  const min = template.payrollGrossPayMinKrw;
  const max = template.payrollGrossPayMaxKrw;
  if (min === null && max === null) {
    return true;
  }

  if (input.payrollGrossPayKrw === null || input.payrollGrossPayKrw === undefined) {
    return false;
  }
  if (min !== null && input.payrollGrossPayKrw < min) {
    return false;
  }
  if (max !== null && input.payrollGrossPayKrw > max) {
    return false;
  }
  return true;
}

function normalizePayrollTemplateCondition(input: {
  domain: ApprovalDomain;
  payrollGrossPayMinKrw?: number | null;
  payrollGrossPayMaxKrw?: number | null;
}) {
  const hasCondition =
    (input.payrollGrossPayMinKrw !== undefined && input.payrollGrossPayMinKrw !== null) ||
    (input.payrollGrossPayMaxKrw !== undefined && input.payrollGrossPayMaxKrw !== null);
  if (input.domain !== "PAYROLL") {
    if (hasCondition) {
      throw new ServiceError(
        400,
        "payrollGrossPayMinKrw/payrollGrossPayMaxKrw are only allowed for PAYROLL domain"
      );
    }
    return {
      payrollGrossPayMinKrw: null as number | null,
      payrollGrossPayMaxKrw: null as number | null
    };
  }

  const payrollGrossPayMinKrw =
    input.payrollGrossPayMinKrw === undefined ? null : input.payrollGrossPayMinKrw;
  const payrollGrossPayMaxKrw =
    input.payrollGrossPayMaxKrw === undefined ? null : input.payrollGrossPayMaxKrw;
  if (
    payrollGrossPayMinKrw !== null &&
    payrollGrossPayMaxKrw !== null &&
    payrollGrossPayMinKrw > payrollGrossPayMaxKrw
  ) {
    throw new ServiceError(
      400,
      "payrollGrossPayMaxKrw must be greater than or equal to payrollGrossPayMinKrw"
    );
  }

  return { payrollGrossPayMinKrw, payrollGrossPayMaxKrw };
}

function resolveApprovalStages(
  policy: ApprovalPolicyEntity | null,
  templates: ApprovalLineTemplateEntity[],
  input: { domain: ApprovalDomain; payrollGrossPayKrw?: number | null }
): {
  fallbackRole: string;
  matchedTemplateIds: string[];
  templateId: string | null;
  stages: Array<{
    stageIndex: number;
    label: string;
    approverRoles: string[];
    minApprovals: number;
  }>;
} {
  const matchedTemplates = templates.filter((template) =>
    doesTemplateMatchGateContext(template, input)
  );
  const fallbackRole = resolvePolicyApproverRole(policy, input.domain);

  if (matchedTemplates.length === 0) {
    return {
      fallbackRole,
      matchedTemplateIds: [],
      templateId: null,
      stages: [
        {
          stageIndex: 1,
          label: "stage-1",
          approverRoles: [fallbackRole],
          minApprovals: 1
        }
      ]
    };
  }

  const template = matchedTemplates[0];
  const stages =
    template.approvalStages.length > 0
      ? template.approvalStages.map((stage) => ({
          stageIndex: stage.stageIndex,
          label: stage.label,
          approverRoles: [...stage.approverRoles],
          minApprovals: stage.minApprovals
        }))
      : [
          {
            stageIndex: 1,
            label: "stage-1",
            approverRoles: [...template.approverRoles],
            minApprovals: 1
          }
        ];

  return {
    fallbackRole,
    matchedTemplateIds: matchedTemplates.map((item) => item.id),
    templateId: template.id,
    stages
  };
}

async function resolveStageActorGate(
  context: ServiceContext,
  input: {
    actor: Actor;
    organizationId: string;
    domain: ApprovalDomain;
    requiredRoles: string[];
    evaluatedAt: Date;
  }
): Promise<{
  allowed: boolean;
  resolution: ApprovalStageResolution;
  activeDelegationIds: string[];
}> {
  if (isPrivilegedActor(input.actor.role)) {
    return {
      allowed: true,
      resolution: "PRIVILEGED_BYPASS",
      activeDelegationIds: []
    };
  }

  if (input.requiredRoles.includes(input.actor.role)) {
    return {
      allowed: true,
      resolution: "EXPECTED_ROLE",
      activeDelegationIds: []
    };
  }

  const delegations = await context.dataAccess.approvals.listDelegations({
    organizationId: input.organizationId,
    domain: input.domain,
    active: true,
    delegateActorId: input.actor.id
  });
  const activeDelegations = delegations.filter(
    (delegation) =>
      input.requiredRoles.includes(delegation.delegatorRole) &&
      isDelegationActiveAt(delegation, input.evaluatedAt)
  );
  if (activeDelegations.length > 0) {
    return {
      allowed: true,
      resolution: "ACTIVE_DELEGATION",
      activeDelegationIds: activeDelegations.map((delegation) => delegation.id)
    };
  }

  return {
    allowed: false,
    resolution: "DENIED",
    activeDelegationIds: []
  };
}

function isDelegationActiveAt(delegation: ApprovalDelegationEntity, now: Date) {
  return delegation.startsAt <= now && delegation.endsAt >= now && delegation.active;
}

function resolveExecutionDomainPriority(domain: ApprovalDomain) {
  if (domain === "PAYROLL") {
    return 300;
  }
  if (domain === "LEAVE") {
    return 200;
  }
  return 100;
}

function calculateExecutionStalledHours(execution: ApprovalExecutionEntity, asOf: Date) {
  return Math.max(0, (asOf.getTime() - execution.updatedAt.getTime()) / (60 * 60 * 1000));
}

function calculateExecutionPriorityScore(execution: ApprovalExecutionEntity, asOf: Date) {
  const pendingWeight = execution.state === "PENDING" ? 100_000 : execution.state === "REJECTED" ? 1_000 : 0;
  const stalledHours = calculateExecutionStalledHours(execution, asOf);
  const stalledWeight = Math.round(stalledHours * 100);
  const domainWeight = resolveExecutionDomainPriority(execution.domain);
  const stageWeight =
    execution.state === "PENDING"
      ? Math.max(0, execution.totalStages - execution.currentStageIndex + 1) * 10
      : 0;
  return pendingWeight + stalledWeight + domainWeight + stageWeight;
}

function compareExecutionsByPriority(left: ApprovalExecutionEntity, right: ApprovalExecutionEntity, asOf: Date) {
  const byPriority =
    calculateExecutionPriorityScore(right, asOf) - calculateExecutionPriorityScore(left, asOf);
  if (byPriority !== 0) {
    return byPriority;
  }

  const byUpdatedAt = left.updatedAt.getTime() - right.updatedAt.getTime();
  if (byUpdatedAt !== 0) {
    return byUpdatedAt;
  }

  return left.id.localeCompare(right.id);
}

function normalizeEnvValue(value: string | undefined) {
  return (value ?? "").trim();
}

function resolveApprovalEscalationWebhookProvider(
  webhookUrl: string
): ApprovalEscalationWebhookProvider {
  const configured = normalizeEnvValue(
    process.env.FLOWHR_APPROVAL_EXECUTION_ESCALATION_WEBHOOK_PROVIDER ??
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

function resolveApprovalEscalationWebhookConfig(): ApprovalEscalationWebhookConfig | null {
  const candidates: Array<{ source: string; value: string }> = [
    {
      source: "FLOWHR_APPROVAL_EXECUTION_ESCALATION_WEBHOOK_URL",
      value: normalizeEnvValue(process.env.FLOWHR_APPROVAL_EXECUTION_ESCALATION_WEBHOOK_URL)
    },
    {
      source: "FLOWHR_APPROVAL_EXECUTION_ESCALATION_DISCORD_WEBHOOK",
      value: normalizeEnvValue(process.env.FLOWHR_APPROVAL_EXECUTION_ESCALATION_DISCORD_WEBHOOK)
    },
    {
      source: "FLOWHR_APPROVAL_EXECUTION_ESCALATION_SLACK_WEBHOOK",
      value: normalizeEnvValue(process.env.FLOWHR_APPROVAL_EXECUTION_ESCALATION_SLACK_WEBHOOK)
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
    provider: resolveApprovalEscalationWebhookProvider(matched.value),
    source: matched.source
  };
}

function buildApprovalExecutionEscalationMessage(input: {
  organizationId: string;
  requestedAt: string;
  asOf: string;
  stalledHoursMin: number;
  notificationChannel: string;
  dryRun: boolean;
  items: ApprovalExecutionEscalationItem[];
}) {
  const title = input.dryRun
    ? "[FlowHR] 결재 실행 정체 에스컬레이션 드라이런"
    : "[FlowHR] 결재 실행 정체 에스컬레이션";
  const lines = [
    title,
    `- organizationId: ${input.organizationId}`,
    `- requestedAt: ${input.requestedAt}`,
    `- asOf: ${input.asOf}`,
    `- stalledHoursMin: ${input.stalledHoursMin}`,
    `- notificationChannel: ${input.notificationChannel}`,
    `- candidateCount: ${input.items.length}`,
    "- candidates:"
  ];

  for (const item of input.items.slice(0, 50)) {
    lines.push(
      `  - ${item.executionId} | ${item.domain} | ${item.targetEntityType}:${item.targetEntityId} | stalled=${item.stalledHours.toFixed(1)}h | stage=${item.currentStageIndex}/${item.totalStages}`
    );
  }
  if (input.items.length > 50) {
    lines.push(`  - ... and ${input.items.length - 50} more`);
  }
  return lines.join("\n");
}

async function sendApprovalEscalationWebhook(config: ApprovalEscalationWebhookConfig, message: string) {
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
    const body = await response.text();
    throw new Error(`${config.provider} webhook request failed: ${response.status} ${body}`);
  }
}

export async function assertApprovalPolicyGate(
  context: ServiceContext,
  input: {
    domain: ApprovalDomain;
    organizationId: string | null;
    payrollGrossPayKrw?: number | null;
    targetEntityType?: string;
    targetEntityId?: string;
    evaluatedAt?: Date;
  }
): Promise<void> {
  const actor = requireActor(context);
  const organizationIdRaw = input.organizationId?.trim();
  if (!organizationIdRaw) {
    return;
  }
  const organizationId = organizationIdRaw;
  const targetEntityType = input.targetEntityType?.trim();
  const targetEntityId = input.targetEntityId?.trim();

  const policy = await context.dataAccess.approvals.findPolicyByOrganizationId(organizationId);
  const templates = await context.dataAccess.approvals.listTemplates({
    organizationId,
    domain: input.domain,
    active: true
  });
  const stageConfig = resolveApprovalStages(policy, templates, {
    domain: input.domain,
    payrollGrossPayKrw: input.payrollGrossPayKrw
  });
  const matchedTemplateIds = stageConfig.matchedTemplateIds;
  const fallbackRole = stageConfig.fallbackRole;
  const expectedRoles = [...stageConfig.stages[0].approverRoles];
  const evaluatedAt = input.evaluatedAt ?? new Date();
  const canRecordHistory = Boolean(targetEntityType && targetEntityId);

  async function appendStageHistory(
    allowed: boolean,
    resolution: ApprovalStageResolution,
    activeDelegationIds: string[] = []
  ) {
    if (!canRecordHistory) {
      return;
    }

    await context.dataAccess.approvals.appendStageHistory({
      organizationId,
      domain: input.domain,
      targetEntityType: targetEntityType as string,
      targetEntityId: targetEntityId as string,
      stageIndex: 1,
      stageLabel: "policy-gate",
      requiredRoles: expectedRoles,
      fallbackRole,
      matchedTemplateIds,
      activeDelegationIds,
      actorRole: actor.role,
      actorId: actor.id,
      allowed,
      resolution,
      payrollGrossPayKrw: input.payrollGrossPayKrw ?? null,
      evaluatedAt
    });
  }

  const gate = await resolveStageActorGate(context, {
    actor,
    organizationId,
    domain: input.domain,
    requiredRoles: expectedRoles,
    evaluatedAt
  });
  await appendStageHistory(gate.allowed, gate.resolution, gate.activeDelegationIds);
  if (gate.allowed) {
    return;
  }

  throw new ServiceError(
    403,
    `approval policy requires one of [${expectedRoles.join(", ")}] role or active delegation`
  );
}

export async function applyApprovalExecutionAction(
  context: ServiceContext,
  input: ApplyApprovalExecutionActionInput
): Promise<{
  execution: ApprovalExecutionEntity;
  finalized: boolean;
  stageIndex: number;
  totalStages: number;
}> {
  const actor = requireActor(context);
  const organizationIdRaw = input.organizationId?.trim();
  if (!organizationIdRaw) {
    throw new ServiceError(400, "organizationId is required for approval execution");
  }
  const organizationId: string = organizationIdRaw;

  const targetEntityType = input.targetEntityType.trim();
  const targetEntityId = input.targetEntityId.trim();
  if (!targetEntityType || !targetEntityId) {
    throw new ServiceError(400, "targetEntityType and targetEntityId are required");
  }

  const evaluatedAt = input.evaluatedAt ?? new Date();
  const policy = await context.dataAccess.approvals.findPolicyByOrganizationId(organizationId);
  const templates = await context.dataAccess.approvals.listTemplates({
    organizationId,
    domain: input.domain,
    active: true
  });
  const stageConfig = resolveApprovalStages(policy, templates, {
    domain: input.domain,
    payrollGrossPayKrw: input.payrollGrossPayKrw
  });

  let execution = await context.dataAccess.approvals.findExecutionByTarget({
    organizationId,
    domain: input.domain,
    targetEntityType,
    targetEntityId
  });
  if (!execution) {
    execution = await context.dataAccess.approvals.createExecution({
      organizationId,
      domain: input.domain,
      targetEntityType,
      targetEntityId,
      templateId: stageConfig.templateId,
      totalStages: stageConfig.stages.length,
      currentStageIndex: 1,
      state: "PENDING",
      startedAt: evaluatedAt
    });
  } else if (
    execution.templateId !== stageConfig.templateId ||
    execution.totalStages !== stageConfig.stages.length
  ) {
    const adjustedCurrentStage = Math.max(
      1,
      Math.min(execution.currentStageIndex, stageConfig.stages.length)
    );
    execution = await context.dataAccess.approvals.updateExecution(execution.id, {
      templateId: stageConfig.templateId,
      totalStages: stageConfig.stages.length,
      currentStageIndex: adjustedCurrentStage
    });
  }

  if (execution.state === "REJECTED") {
    throw new ServiceError(409, "approval execution already rejected");
  }
  if (execution.state === "APPROVED") {
    if (input.action === "APPROVE") {
      return {
        execution,
        finalized: true,
        stageIndex: execution.currentStageIndex,
        totalStages: execution.totalStages
      };
    }
    throw new ServiceError(409, "approval execution already approved");
  }

  const stageIndex = Math.max(1, Math.min(execution.currentStageIndex, stageConfig.stages.length));
  const stage = stageConfig.stages[stageIndex - 1];
  if (!stage) {
    throw new ServiceError(409, "approval execution stage is out of range");
  }

  const gate = await resolveStageActorGate(context, {
    actor,
    organizationId,
    domain: input.domain,
    requiredRoles: stage.approverRoles,
    evaluatedAt
  });

  async function appendStageHistory(allowed: boolean, resolution: ApprovalStageResolution) {
    await context.dataAccess.approvals.appendStageHistory({
      organizationId,
      domain: input.domain,
      targetEntityType,
      targetEntityId,
      stageIndex: stage.stageIndex,
      stageLabel: `${stage.label}:${input.action.toLowerCase()}`,
      requiredRoles: stage.approverRoles,
      fallbackRole: stageConfig.fallbackRole,
      matchedTemplateIds: stageConfig.matchedTemplateIds,
      activeDelegationIds: gate.activeDelegationIds,
      actorRole: actor.role,
      actorId: actor.id,
      allowed,
      resolution,
      payrollGrossPayKrw: input.payrollGrossPayKrw ?? null,
      evaluatedAt
    });
  }

  if (!gate.allowed) {
    await appendStageHistory(false, gate.resolution);
    throw new ServiceError(
      403,
      `approval stage ${stage.stageIndex} requires one of [${stage.approverRoles.join(
        ", "
      )}] role or active delegation`
    );
  }

  if (input.action === "APPROVE") {
    const existingActorApprovals = await context.dataAccess.approvals.listExecutionActions({
      executionId: execution.id,
      stageIndex,
      action: "APPROVE",
      actorId: actor.id
    });
    if (existingActorApprovals.length > 0) {
      throw new ServiceError(409, "actor already approved this stage");
    }

    await context.dataAccess.approvals.appendExecutionAction({
      executionId: execution.id,
      stageIndex,
      action: "APPROVE",
      actorRole: actor.role,
      actorId: actor.id,
      resolution: gate.resolution,
      createdAt: evaluatedAt
    });

    const approvals = await context.dataAccess.approvals.listExecutionActions({
      executionId: execution.id,
      stageIndex,
      action: "APPROVE"
    });
    const stageSatisfied =
      gate.resolution === "PRIVILEGED_BYPASS" || approvals.length >= stage.minApprovals;

    let finalized = false;
    if (stageSatisfied) {
      if (stageIndex >= stageConfig.stages.length) {
        execution = await context.dataAccess.approvals.updateExecution(execution.id, {
          state: "APPROVED",
          currentStageIndex: stageIndex,
          completedAt: evaluatedAt
        });
        finalized = true;
      } else {
        execution = await context.dataAccess.approvals.updateExecution(execution.id, {
          currentStageIndex: stageIndex + 1
        });
      }
    }

    await appendStageHistory(true, gate.resolution);
    return {
      execution,
      finalized,
      stageIndex,
      totalStages: stageConfig.stages.length
    };
  }

  const existingReject = await context.dataAccess.approvals.listExecutionActions({
    executionId: execution.id,
    stageIndex,
    action: "REJECT",
    actorId: actor.id
  });
  if (existingReject.length > 0) {
    throw new ServiceError(409, "actor already rejected this stage");
  }

  await context.dataAccess.approvals.appendExecutionAction({
    executionId: execution.id,
    stageIndex,
    action: "REJECT",
    actorRole: actor.role,
    actorId: actor.id,
    resolution: gate.resolution,
    createdAt: evaluatedAt
  });
  execution = await context.dataAccess.approvals.updateExecution(execution.id, {
    state: "REJECTED",
    currentStageIndex: stageIndex,
    completedAt: evaluatedAt
  });
  await appendStageHistory(true, gate.resolution);
  return {
    execution,
    finalized: true,
    stageIndex,
    totalStages: stageConfig.stages.length
  };
}

export async function previewApprovalPolicyGate(
  context: ServiceContext,
  input: PreviewApprovalPolicyGateInput
): Promise<{
  preview: {
    organizationId: string;
    domain: ApprovalDomain;
    fallbackRole: string;
    expectedRoles: string[];
    actorRole: string;
    actorId: string | null;
    allowed: boolean;
    allowedReason: "expected_role" | "active_delegation" | "privileged_bypass" | "denied";
    payrollGrossPayKrw: number | null;
    effectiveAt: string;
    matchedTemplates: Array<{
      id: string;
      name: string;
      domain: ApprovalDomain;
      approverRoles: string[];
      approvalStages: Array<{
        stageIndex: number;
        label: string;
        approverRoles: string[];
        minApprovals: number;
      }>;
      payrollGrossPayMinKrw: number | null;
      payrollGrossPayMaxKrw: number | null;
      active: boolean;
    }>;
    activeDelegations: Array<{
      id: string;
      delegatorRole: string;
      delegateActorId: string;
      startsAt: string;
      endsAt: string;
      active: boolean;
    }>;
  };
}> {
  const actor = requireActor(context);
  await requirePermission(context, Permissions.approvalPolicyRead, "approval policy read requires permission");

  const organizationId = await resolveOrganizationId(context, input.organizationId);
  const policy = await context.dataAccess.approvals.findPolicyByOrganizationId(organizationId);
  const templates = await context.dataAccess.approvals.listTemplates({
    organizationId,
    domain: input.domain,
    active: true
  });

  const gateContext = {
    domain: input.domain,
    payrollGrossPayKrw: input.payrollGrossPayKrw
  };
  const matchedTemplates = templates.filter((template) =>
    doesTemplateMatchGateContext(template, gateContext)
  );
  const fallbackRole = resolvePolicyApproverRole(policy, input.domain);
  const expectedRoles = resolveExpectedApproverRoles(policy, templates, gateContext);

  const previewActorRole = input.actorRole?.trim() || actor.role;
  const previewActorId = input.actorId?.trim() || actor.id || null;
  const effectiveAt = input.effectiveAt ?? new Date();

  let allowed = isPrivilegedActor(previewActorRole) || expectedRoles.includes(previewActorRole);
  let allowedReason: "expected_role" | "active_delegation" | "privileged_bypass" | "denied" = allowed
    ? isPrivilegedActor(previewActorRole)
      ? "privileged_bypass"
      : "expected_role"
    : "denied";
  let activeDelegations: Array<{
    id: string;
    delegatorRole: string;
    delegateActorId: string;
    startsAt: string;
    endsAt: string;
    active: boolean;
  }> = [];

  if (!allowed && previewActorId) {
    const delegations = await context.dataAccess.approvals.listDelegations({
      organizationId,
      domain: input.domain,
      active: true,
      delegateActorId: previewActorId
    });
    activeDelegations = delegations
      .filter(
        (delegation) =>
          expectedRoles.includes(delegation.delegatorRole) &&
          isDelegationActiveAt(delegation, effectiveAt)
      )
      .map((delegation) => ({
        id: delegation.id,
        delegatorRole: delegation.delegatorRole,
        delegateActorId: delegation.delegateActorId,
        startsAt: delegation.startsAt.toISOString(),
        endsAt: delegation.endsAt.toISOString(),
        active: delegation.active
      }));

    if (activeDelegations.length > 0) {
      allowed = true;
      allowedReason = "active_delegation";
    }
  }

  const preview = {
    organizationId,
    domain: input.domain,
    fallbackRole,
    expectedRoles,
    actorRole: previewActorRole,
    actorId: previewActorId,
    allowed,
    allowedReason,
    payrollGrossPayKrw: input.payrollGrossPayKrw ?? null,
    effectiveAt: effectiveAt.toISOString(),
    matchedTemplates: matchedTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      domain: template.domain,
      approverRoles: template.approverRoles,
      approvalStages: template.approvalStages.map((stage) => ({
        stageIndex: stage.stageIndex,
        label: stage.label,
        approverRoles: [...stage.approverRoles],
        minApprovals: stage.minApprovals
      })),
      payrollGrossPayMinKrw: template.payrollGrossPayMinKrw,
      payrollGrossPayMaxKrw: template.payrollGrossPayMaxKrw,
      active: template.active
    })),
    activeDelegations
  };

  await context.dataAccess.audit.append({
    action: "approval.policy_gate.previewed",
    entityType: "ApprovalPolicy",
    entityId: policy?.id ?? "default",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      domain: preview.domain,
      actorRole: preview.actorRole,
      actorId: preview.actorId,
      expectedRoles: preview.expectedRoles,
      fallbackRole: preview.fallbackRole,
      allowed: preview.allowed,
      allowedReason: preview.allowedReason,
      payrollGrossPayKrw: preview.payrollGrossPayKrw,
      matchedTemplateIds: preview.matchedTemplates.map((template) => template.id),
      activeDelegationIds: preview.activeDelegations.map((delegation) => delegation.id)
    }
  });

  return { preview };
}

export async function readApprovalPolicy(
  context: ServiceContext,
  input: ReadApprovalPolicyInput
): Promise<{ policy: ApprovalPolicyEntity; configured: boolean }> {
  await requirePermission(context, Permissions.approvalPolicyRead, "approval policy read requires permission");
  const organizationId = await resolveOrganizationId(context, input.organizationId);
  const policy = await context.dataAccess.approvals.findPolicyByOrganizationId(organizationId);
  return {
    policy: policy ?? toPolicyFallback(organizationId),
    configured: policy !== null
  };
}

export async function upsertApprovalPolicy(
  context: ServiceContext,
  input: UpsertApprovalPolicyInput
): Promise<{ policy: ApprovalPolicyEntity; configured: true }> {
  const actor = requireActor(context);
  await requirePermission(context, Permissions.approvalPolicyWrite, "approval policy write requires permission");
  const organizationId = await resolveOrganizationId(context, input.organizationId);

  const policy = await context.dataAccess.approvals.upsertPolicyForOrganization({
    organizationId,
    attendanceApproverRole: input.attendanceApproverRole,
    leaveApproverRole: input.leaveApproverRole,
    payrollApproverRole: input.payrollApproverRole
  });

  await context.dataAccess.audit.append({
    action: "approval.policy.updated",
    entityType: "ApprovalPolicy",
    entityId: policy.id,
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      attendanceApproverRole: policy.attendanceApproverRole,
      leaveApproverRole: policy.leaveApproverRole,
      payrollApproverRole: policy.payrollApproverRole
    }
  });
  await getEventPublisher(context).publish({
    name: "approval.policy.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "ApprovalPolicy",
    entityId: policy.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      organizationId,
      attendanceApproverRole: policy.attendanceApproverRole,
      leaveApproverRole: policy.leaveApproverRole,
      payrollApproverRole: policy.payrollApproverRole
    }
  });

  return { policy, configured: true };
}

export async function listApprovalDelegations(
  context: ServiceContext,
  input: ListApprovalDelegationsInput
): Promise<ApprovalDelegationEntity[]> {
  await requirePermission(
    context,
    Permissions.approvalDelegationRead,
    "approval delegation read requires permission"
  );
  const organizationId = await resolveOrganizationId(context, input.organizationId);
  return await context.dataAccess.approvals.listDelegations({
    organizationId,
    domain: input.domain,
    active: input.active,
    delegateActorId: input.delegateActorId
  });
}

export async function listApprovalLineTemplates(
  context: ServiceContext,
  input: ListApprovalLineTemplatesInput
): Promise<ApprovalLineTemplateEntity[]> {
  await requirePermission(
    context,
    Permissions.approvalPolicyRead,
    "approval policy read requires permission"
  );
  const organizationId = await resolveOrganizationId(context, input.organizationId);
  return await context.dataAccess.approvals.listTemplates({
    organizationId,
    domain: input.domain,
    active: input.active
  });
}

export async function listApprovalStageHistory(
  context: ServiceContext,
  input: ListApprovalStageHistoryInput
): Promise<ApprovalStageHistoryEntity[]> {
  const actor = requireActor(context);
  await requirePermission(
    context,
    Permissions.approvalPolicyRead,
    "approval stage history read requires permission"
  );
  const organizationId = await resolveOrganizationId(context, input.organizationId);
  const limit = input.limit !== undefined ? Math.min(Math.max(input.limit, 1), 500) : 100;

  const rows = await context.dataAccess.approvals.listStageHistory({
    organizationId,
    domain: input.domain,
    targetEntityType: input.targetEntityType?.trim(),
    targetEntityId: input.targetEntityId?.trim(),
    allowed: input.allowed,
    resolution: input.resolution,
    from: input.from,
    to: input.to,
    limit
  });

  await context.dataAccess.audit.append({
    action: "approval.stage_history.listed",
    entityType: "ApprovalStageHistory",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      domain: input.domain ?? null,
      targetEntityType: input.targetEntityType ?? null,
      targetEntityId: input.targetEntityId ?? null,
      allowed: input.allowed ?? null,
      resolution: input.resolution ?? null,
      from: input.from?.toISOString() ?? null,
      to: input.to?.toISOString() ?? null,
      limit,
      resultCount: rows.length
    }
  });

  return rows;
}

export async function listApprovalExecutions(
  context: ServiceContext,
  input: ListApprovalExecutionsInput
): Promise<ApprovalExecutionEntity[]> {
  const actor = requireActor(context);
  await requirePermission(
    context,
    Permissions.approvalPolicyRead,
    "approval execution read requires permission"
  );
  const organizationId = await resolveOrganizationId(context, input.organizationId);
  const limit = input.limit !== undefined ? Math.min(Math.max(input.limit, 1), 500) : 100;
  const sort = input.sort ?? "updated_desc";
  const stalledHoursMin =
    input.stalledHoursMin !== undefined ? Math.max(input.stalledHoursMin, 0) : undefined;
  const asOf = input.asOf ?? new Date();
  if (!Number.isFinite(asOf.getTime())) {
    throw new ServiceError(400, "asOf must be a valid datetime");
  }

  let rows = await context.dataAccess.approvals.listExecutions({
    organizationId,
    domain: input.domain,
    targetEntityType: input.targetEntityType?.trim(),
    targetEntityId: input.targetEntityId?.trim(),
    state: input.state
  });

  if (stalledHoursMin !== undefined) {
    rows = rows.filter((row) => {
      if (row.state !== "PENDING") {
        return false;
      }
      return calculateExecutionStalledHours(row, asOf) >= stalledHoursMin;
    });
  }

  if (sort === "priority_desc") {
    rows = [...rows].sort((left, right) => compareExecutionsByPriority(left, right, asOf));
  }

  if (limit > 0 && rows.length > limit) {
    rows = rows.slice(0, limit);
  }

  await context.dataAccess.audit.append({
    action: "approval.execution.listed",
    entityType: "ApprovalExecution",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      domain: input.domain ?? null,
      targetEntityType: input.targetEntityType ?? null,
      targetEntityId: input.targetEntityId ?? null,
      state: input.state ?? null,
      sort,
      stalledHoursMin: stalledHoursMin ?? null,
      asOf: asOf.toISOString(),
      limit,
      resultCount: rows.length
    }
  });

  return rows;
}

export async function triggerApprovalExecutionEscalation(
  context: ServiceContext,
  input: TriggerApprovalExecutionEscalationInput
): Promise<{
  requestedAt: string;
  dryRun: boolean;
  policy: {
    stalledHoursMin: number;
    limit: number;
    notificationChannel: string;
    webhookConfigured: boolean;
    provider: ApprovalEscalationWebhookProvider | null;
    webhookSource: string | null;
  };
  filters: {
    organizationId: string;
    domain: ApprovalDomain | null;
    asOf: string;
  };
  counts: {
    totalPending: number;
    candidates: number;
    requested: number;
    dryRun: number;
    skippedNoCandidate: number;
    failed: number;
  };
  items: ApprovalExecutionEscalationItem[];
}> {
  const actor = requireActor(context);
  await requirePermission(
    context,
    Permissions.approvalPolicyRead,
    "approval execution escalation requires permission"
  );
  const organizationId = await resolveOrganizationId(context, input.organizationId);
  const requestedAt = new Date().toISOString();
  const asOf = input.asOf ?? new Date();
  if (!Number.isFinite(asOf.getTime())) {
    throw new ServiceError(400, "asOf must be a valid datetime");
  }

  const stalledHoursMin =
    input.stalledHoursMin !== undefined
      ? Math.max(1, Math.min(input.stalledHoursMin, 24 * 365))
      : 24;
  const limit = input.limit !== undefined ? Math.min(Math.max(input.limit, 1), 500) : 50;
  const dryRun = input.dryRun ?? false;
  const notificationChannel =
    input.notificationChannel?.trim() || "approval-stalled-queue";

  let executions = await context.dataAccess.approvals.listExecutions({
    organizationId,
    domain: input.domain,
    state: "PENDING"
  });

  const totalPending = executions.length;
  executions = executions.filter(
    (execution) => calculateExecutionStalledHours(execution, asOf) >= stalledHoursMin
  );
  executions.sort((left, right) => compareExecutionsByPriority(left, right, asOf));
  if (executions.length > limit) {
    executions = executions.slice(0, limit);
  }

  const items: ApprovalExecutionEscalationItem[] = executions.map((execution) => ({
    executionId: execution.id,
    domain: execution.domain,
    targetEntityType: execution.targetEntityType,
    targetEntityId: execution.targetEntityId,
    stalledHours: Math.round(calculateExecutionStalledHours(execution, asOf) * 10) / 10,
    currentStageIndex: execution.currentStageIndex,
    totalStages: execution.totalStages,
    decision: dryRun ? "DRY_RUN" : "REQUESTED"
  }));

  const webhook = resolveApprovalEscalationWebhookConfig();
  const payloadBase = {
    asOf: asOf.toISOString(),
    domain: input.domain ?? null,
    stalledHoursMin,
    limit,
    notificationChannel,
    dryRun,
    totalPending,
    candidateCount: items.length,
    requestedAt,
    provider: webhook?.provider ?? null,
    webhookSource: webhook?.source ?? null
  };

  await context.dataAccess.audit.append({
    action: "approval.execution.escalation.generated",
    entityType: "ApprovalExecution",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: payloadBase
  });

  if (!dryRun && items.length > 0 && !webhook) {
    await context.dataAccess.audit.append({
      action: "approval.execution.escalation.failed",
      entityType: "ApprovalExecution",
      organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        ...payloadBase,
        reason: "webhook_not_configured"
      }
    });
    throw new ServiceError(
      503,
      "approval execution escalation webhook is not configured (set FLOWHR_APPROVAL_EXECUTION_ESCALATION_* or FLOWHR_ALERT_* webhook env)"
    );
  }

  if (!dryRun && items.length > 0 && webhook) {
    const message = buildApprovalExecutionEscalationMessage({
      organizationId,
      requestedAt,
      asOf: asOf.toISOString(),
      stalledHoursMin,
      notificationChannel,
      dryRun: false,
      items
    });
    try {
      await sendApprovalEscalationWebhook(webhook, message);
      await context.dataAccess.audit.append({
        action: "approval.execution.escalation.requested",
        entityType: "ApprovalExecution",
        organizationId,
        actorRole: actor.role,
        actorId: actor.id,
        payload: payloadBase
      });
    } catch (error) {
      await context.dataAccess.audit.append({
        action: "approval.execution.escalation.failed",
        entityType: "ApprovalExecution",
        organizationId,
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          ...payloadBase,
          reason: "webhook_request_failed",
          error: error instanceof Error ? error.message : "unknown error"
        }
      });
      throw new ServiceError(502, "approval execution escalation webhook request failed");
    }

    try {
      await getEventPublisher(context).publish({
        name: "approval.execution.escalation.requested.v1",
        occurredAt: requestedAt,
        entityType: "ApprovalExecution",
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          organizationId,
          asOf: asOf.toISOString(),
          domain: input.domain ?? null,
          stalledHoursMin,
          limit,
          notificationChannel,
          candidateCount: items.length,
          provider: webhook.provider,
          webhookSource: webhook.source,
          items: items.slice(0, 100)
        }
      });
    } catch (error) {
      try {
        await context.dataAccess.audit.append({
          action: "approval.execution.escalation.event_publish_failed",
          entityType: "ApprovalExecution",
          organizationId,
          actorRole: actor.role,
          actorId: actor.id,
          payload: {
            ...payloadBase,
            reason: "event_publish_failed",
            error: error instanceof Error ? error.message : "unknown error"
          }
        });
      } catch {
        // Non-blocking failure path: webhook dispatch already completed.
      }
    }
  }

  return {
    requestedAt,
    dryRun,
    policy: {
      stalledHoursMin,
      limit,
      notificationChannel,
      webhookConfigured: webhook !== null,
      provider: webhook?.provider ?? null,
      webhookSource: webhook?.source ?? null
    },
    filters: {
      organizationId,
      domain: input.domain ?? null,
      asOf: asOf.toISOString()
    },
    counts: {
      totalPending,
      candidates: items.length,
      requested: !dryRun && items.length > 0 ? items.length : 0,
      dryRun: dryRun ? items.length : 0,
      skippedNoCandidate: items.length === 0 ? 1 : 0,
      failed: 0
    },
    items
  };
}

export async function createApprovalLineTemplate(
  context: ServiceContext,
  input: CreateApprovalLineTemplateInput
): Promise<ApprovalLineTemplateEntity> {
  const actor = requireActor(context);
  await requirePermission(context, Permissions.approvalPolicyWrite, "approval policy write requires permission");
  const organizationId = await resolveOrganizationId(context, input.organizationId);
  const stageConfig = normalizeApprovalTemplateStages({
    approverRoles: input.approverRoles,
    approvalStages: input.approvalStages
  });
  const approverRoles = stageConfig.approverRoles;
  const payrollCondition = normalizePayrollTemplateCondition({
    domain: input.domain,
    payrollGrossPayMinKrw: input.payrollGrossPayMinKrw,
    payrollGrossPayMaxKrw: input.payrollGrossPayMaxKrw
  });
  const active = input.active ?? true;

  if (active) {
    const existingActive = await context.dataAccess.approvals.listTemplates({
      organizationId,
      domain: input.domain,
      active: true
    });
    if (existingActive.length > 0) {
      throw new ServiceError(409, "active approval line template already exists for domain", {
        domain: input.domain,
        existingTemplateIds: existingActive.map((template) => template.id)
      });
    }
  }

  const template = await context.dataAccess.approvals.createTemplate({
    organizationId,
    name: input.name.trim(),
    domain: input.domain,
    approverRoles,
    approvalStages: stageConfig.approvalStages,
    payrollGrossPayMinKrw: payrollCondition.payrollGrossPayMinKrw,
    payrollGrossPayMaxKrw: payrollCondition.payrollGrossPayMaxKrw,
    active
  });

  await context.dataAccess.audit.append({
    action: "approval.template.created",
    entityType: "ApprovalLineTemplate",
    entityId: template.id,
    organizationId: template.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      name: template.name,
      domain: template.domain,
      approverRoles: template.approverRoles,
      approvalStages: template.approvalStages,
      payrollGrossPayMinKrw: template.payrollGrossPayMinKrw,
      payrollGrossPayMaxKrw: template.payrollGrossPayMaxKrw,
      active: template.active
    }
  });
  await getEventPublisher(context).publish({
    name: "approval.template.created.v1",
    occurredAt: new Date().toISOString(),
    entityType: "ApprovalLineTemplate",
    entityId: template.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      organizationId: template.organizationId,
      name: template.name,
      domain: template.domain,
      approverRoles: template.approverRoles,
      approvalStages: template.approvalStages,
      payrollGrossPayMinKrw: template.payrollGrossPayMinKrw,
      payrollGrossPayMaxKrw: template.payrollGrossPayMaxKrw,
      active: template.active
    }
  });

  return template;
}

export async function updateApprovalLineTemplate(
  context: ServiceContext,
  templateId: string,
  input: UpdateApprovalLineTemplateInput
): Promise<ApprovalLineTemplateEntity> {
  const actor = requireActor(context);
  await requirePermission(context, Permissions.approvalPolicyWrite, "approval policy write requires permission");

  const existing = await context.dataAccess.approvals.findTemplateById(templateId);
  if (!existing) {
    throw new ServiceError(404, "approval line template not found");
  }

  const tenantScope = resolveTenantScope(actor);
  ensureTenantMatch(tenantScope, existing.organizationId, "approval line template not found");

  const nextDomain = input.domain ?? existing.domain;
  const nextActive = input.active ?? existing.active;
  const stageConfig = normalizeApprovalTemplateStages({
    approverRoles: input.approverRoles,
    approvalStages: input.approvalStages,
    fallbackApproverRoles: existing.approverRoles,
    fallbackApprovalStages: existing.approvalStages
  });
  const nextApproverRoles = stageConfig.approverRoles;
  const nextPayrollGrossPayMinKrw =
    nextDomain === "PAYROLL"
      ? input.payrollGrossPayMinKrw !== undefined
        ? input.payrollGrossPayMinKrw
        : existing.payrollGrossPayMinKrw
      : null;
  const nextPayrollGrossPayMaxKrw =
    nextDomain === "PAYROLL"
      ? input.payrollGrossPayMaxKrw !== undefined
        ? input.payrollGrossPayMaxKrw
        : existing.payrollGrossPayMaxKrw
      : null;
  const nextPayrollCondition = normalizePayrollTemplateCondition({
    domain: nextDomain,
    payrollGrossPayMinKrw: nextPayrollGrossPayMinKrw,
    payrollGrossPayMaxKrw: nextPayrollGrossPayMaxKrw
  });

  if (nextActive) {
    const existingActive = await context.dataAccess.approvals.listTemplates({
      organizationId: existing.organizationId,
      domain: nextDomain,
      active: true
    });
    const conflict = existingActive.find((template) => template.id !== existing.id);
    if (conflict) {
      throw new ServiceError(409, "active approval line template already exists for domain", {
        domain: nextDomain,
        existingTemplateId: conflict.id
      });
    }
  }

  const template = await context.dataAccess.approvals.updateTemplate(templateId, {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.domain !== undefined ? { domain: input.domain } : {}),
    ...(input.approverRoles !== undefined || input.approvalStages !== undefined
      ? { approverRoles: nextApproverRoles, approvalStages: stageConfig.approvalStages }
      : {}),
    ...(input.payrollGrossPayMinKrw !== undefined || nextDomain !== existing.domain
      ? { payrollGrossPayMinKrw: nextPayrollCondition.payrollGrossPayMinKrw }
      : {}),
    ...(input.payrollGrossPayMaxKrw !== undefined || nextDomain !== existing.domain
      ? { payrollGrossPayMaxKrw: nextPayrollCondition.payrollGrossPayMaxKrw }
      : {}),
    ...(input.active !== undefined ? { active: input.active } : {})
  });

  await context.dataAccess.audit.append({
    action: "approval.template.updated",
    entityType: "ApprovalLineTemplate",
    entityId: template.id,
    organizationId: template.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      name: template.name,
      domain: template.domain,
      approverRoles: template.approverRoles,
      approvalStages: template.approvalStages,
      payrollGrossPayMinKrw: template.payrollGrossPayMinKrw,
      payrollGrossPayMaxKrw: template.payrollGrossPayMaxKrw,
      active: template.active
    }
  });
  await getEventPublisher(context).publish({
    name: "approval.template.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "ApprovalLineTemplate",
    entityId: template.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      organizationId: template.organizationId,
      name: template.name,
      domain: template.domain,
      approverRoles: template.approverRoles,
      approvalStages: template.approvalStages,
      payrollGrossPayMinKrw: template.payrollGrossPayMinKrw,
      payrollGrossPayMaxKrw: template.payrollGrossPayMaxKrw,
      active: template.active
    }
  });

  return template;
}

export async function expireApprovalDelegations(
  context: ServiceContext,
  input: ExpireApprovalDelegationsInput
): Promise<{
  organizationId: string;
  checkedCount: number;
  expiredCount: number;
  delegationIds: string[];
  effectiveAt: string;
  dryRun: boolean;
}> {
  const actor = requireActor(context);
  await requirePermission(
    context,
    Permissions.approvalDelegationWrite,
    "approval delegation write requires permission"
  );

  const organizationId = await resolveOrganizationId(context, input.organizationId);
  const effectiveAt = input.expiresBeforeAt ?? new Date();
  const dryRun = input.dryRun ?? false;

  const delegations = await context.dataAccess.approvals.listDelegations({
    organizationId,
    active: true
  });
  const targets = delegations.filter((delegation) => delegation.endsAt < effectiveAt);
  const delegationIds = targets.map((delegation) => delegation.id);

  if (dryRun) {
    return {
      organizationId,
      checkedCount: delegations.length,
      expiredCount: targets.length,
      delegationIds,
      effectiveAt: effectiveAt.toISOString(),
      dryRun: true
    };
  }

  for (const delegation of targets) {
    const updated = await context.dataAccess.approvals.updateDelegation(delegation.id, {
      active: false
    });

    await context.dataAccess.audit.append({
      action: "approval.delegation.auto_expired",
      entityType: "ApprovalDelegation",
      entityId: updated.id,
      organizationId: updated.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        domain: updated.domain,
        delegatorRole: updated.delegatorRole,
        delegateActorId: updated.delegateActorId,
        startsAt: updated.startsAt.toISOString(),
        endsAt: updated.endsAt.toISOString(),
        effectiveAt: effectiveAt.toISOString(),
        active: updated.active
      }
    });
    await getEventPublisher(context).publish({
      name: "approval.delegation.updated.v1",
      occurredAt: new Date().toISOString(),
      entityType: "ApprovalDelegation",
      entityId: updated.id,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        organizationId: updated.organizationId,
        domain: updated.domain,
        delegatorRole: updated.delegatorRole,
        delegateActorId: updated.delegateActorId,
        active: updated.active,
        autoExpired: true,
        effectiveAt: effectiveAt.toISOString()
      }
    });
  }

  return {
    organizationId,
    checkedCount: delegations.length,
    expiredCount: targets.length,
    delegationIds,
    effectiveAt: effectiveAt.toISOString(),
    dryRun: false
  };
}

function normalizeOrganizationIdList(values: string[] | undefined): string[] {
  if (!values || values.length === 0) {
    return [];
  }

  const deduped = new Set<string>();
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    deduped.add(normalized);
  }
  return Array.from(deduped);
}

export async function expireApprovalDelegationsSweep(
  context: ServiceContext,
  input: ExpireApprovalDelegationsSweepInput
): Promise<{
  totalOrganizations: number;
  totalCheckedCount: number;
  totalExpiredCount: number;
  effectiveAt: string;
  dryRun: boolean;
  organizations: Array<{
    organizationId: string;
    checkedCount: number;
    expiredCount: number;
    delegationIds: string[];
  }>;
}> {
  const actor = requireActor(context);
  await requirePermission(
    context,
    Permissions.approvalDelegationWrite,
    "approval delegation write requires permission"
  );

  const effectiveAt = input.expiresBeforeAt ?? new Date();
  const dryRun = input.dryRun ?? false;
  const requestedOrganizationIds = normalizeOrganizationIdList(input.organizationIds);

  let organizationIds: string[];
  if (requestedOrganizationIds.length > 0) {
    organizationIds = [];
    for (const organizationId of requestedOrganizationIds) {
      const resolved = await resolveOrganizationId(context, organizationId);
      organizationIds.push(resolved);
    }
  } else {
    const tenantScope = resolveTenantScope(actor);
    if (tenantScope) {
      organizationIds = [tenantScope];
    } else {
      const organizations = await context.dataAccess.organizations.list();
      organizationIds = organizations.map((organization) => organization.id);
    }
  }

  if (organizationIds.length === 0) {
    return {
      totalOrganizations: 0,
      totalCheckedCount: 0,
      totalExpiredCount: 0,
      effectiveAt: effectiveAt.toISOString(),
      dryRun,
      organizations: []
    };
  }

  const organizations: Array<{
    organizationId: string;
    checkedCount: number;
    expiredCount: number;
    delegationIds: string[];
  }> = [];
  let totalCheckedCount = 0;
  let totalExpiredCount = 0;

  for (const organizationId of organizationIds) {
    const result = await expireApprovalDelegations(context, {
      organizationId,
      expiresBeforeAt: effectiveAt,
      dryRun
    });
    organizations.push({
      organizationId: result.organizationId,
      checkedCount: result.checkedCount,
      expiredCount: result.expiredCount,
      delegationIds: result.delegationIds
    });
    totalCheckedCount += result.checkedCount;
    totalExpiredCount += result.expiredCount;
  }

  return {
    totalOrganizations: organizations.length,
    totalCheckedCount,
    totalExpiredCount,
    effectiveAt: effectiveAt.toISOString(),
    dryRun,
    organizations
  };
}

export async function createApprovalDelegation(
  context: ServiceContext,
  input: CreateApprovalDelegationInput
): Promise<ApprovalDelegationEntity> {
  const actor = requireActor(context);
  await requirePermission(
    context,
    Permissions.approvalDelegationWrite,
    "approval delegation write requires permission"
  );

  const organizationId = await resolveOrganizationId(context, input.organizationId);
  ensureValidDelegationWindow(input.startsAt, input.endsAt);
  if (actor.role === "manager" && input.delegatorRole !== "manager") {
    throw new ServiceError(403, "manager can only delegate manager approval authority");
  }

  const delegation = await context.dataAccess.approvals.createDelegation({
    organizationId,
    domain: input.domain,
    delegatorRole: input.delegatorRole,
    delegateActorId: input.delegateActorId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    reason: input.reason,
    active: input.active
  });

  await context.dataAccess.audit.append({
    action: "approval.delegation.created",
    entityType: "ApprovalDelegation",
    entityId: delegation.id,
    organizationId: delegation.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      domain: delegation.domain,
      delegatorRole: delegation.delegatorRole,
      delegateActorId: delegation.delegateActorId,
      startsAt: delegation.startsAt.toISOString(),
      endsAt: delegation.endsAt.toISOString(),
      active: delegation.active
    }
  });
  await getEventPublisher(context).publish({
    name: "approval.delegation.created.v1",
    occurredAt: new Date().toISOString(),
    entityType: "ApprovalDelegation",
    entityId: delegation.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      organizationId: delegation.organizationId,
      domain: delegation.domain,
      delegatorRole: delegation.delegatorRole,
      delegateActorId: delegation.delegateActorId
    }
  });

  return delegation;
}

export async function updateApprovalDelegation(
  context: ServiceContext,
  delegationId: string,
  input: UpdateApprovalDelegationInput
): Promise<ApprovalDelegationEntity> {
  const actor = requireActor(context);
  await requirePermission(
    context,
    Permissions.approvalDelegationWrite,
    "approval delegation write requires permission"
  );

  const existing = await context.dataAccess.approvals.findDelegationById(delegationId);
  if (!existing) {
    throw new ServiceError(404, "approval delegation not found");
  }

  const tenantScope = resolveTenantScope(actor);
  ensureTenantMatch(tenantScope, existing.organizationId, "approval delegation not found");
  if (actor.role === "manager" && existing.delegatorRole !== "manager") {
    throw new ServiceError(403, "manager can only update manager delegations");
  }

  const startsAt = input.startsAt ?? existing.startsAt;
  const endsAt = input.endsAt ?? existing.endsAt;
  ensureValidDelegationWindow(startsAt, endsAt);

  const delegation = await context.dataAccess.approvals.updateDelegation(delegationId, input);

  await context.dataAccess.audit.append({
    action: "approval.delegation.updated",
    entityType: "ApprovalDelegation",
    entityId: delegation.id,
    organizationId: delegation.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      domain: delegation.domain,
      delegatorRole: delegation.delegatorRole,
      delegateActorId: delegation.delegateActorId,
      startsAt: delegation.startsAt.toISOString(),
      endsAt: delegation.endsAt.toISOString(),
      active: delegation.active
    }
  });
  await getEventPublisher(context).publish({
    name: "approval.delegation.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "ApprovalDelegation",
    entityId: delegation.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      organizationId: delegation.organizationId,
      domain: delegation.domain,
      delegatorRole: delegation.delegatorRole,
      delegateActorId: delegation.delegateActorId,
      active: delegation.active
    }
  });

  return delegation;
}
