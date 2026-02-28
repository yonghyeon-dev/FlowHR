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
import {
  resolveApprovalEscalationWebhookConfig,
  sendApprovalEscalationWebhook,
  toApprovalExecutionEscalationItems,
  type ApprovalExecutionEscalationItem
} from "@/features/approval/execution-escalation-core-helpers";
import {
  normalizeApprovalExecutionListOptions,
  selectApprovalExecutionsForList
} from "@/features/approval/execution-list-helpers";
import { buildApprovalExecutionEscalationMessage } from "@/features/approval/execution-escalation-message-helpers";
import {
  buildApprovalExecutionListQueryInput,
  buildPendingApprovalExecutionQueryInput
} from "@/features/approval/execution-query-helpers";
import {
  buildApprovalStageHistoryListQueryInput,
  normalizeApprovalStageHistoryListLimit
} from "@/features/approval/stage-history-list-helpers";
import { buildApprovalExecutionEscalationRequestedEvent } from "@/features/approval/execution-escalation-event-helpers";
import {
  normalizeApprovalExecutionEscalationPolicy,
  selectApprovalExecutionEscalationCandidates
} from "@/features/approval/execution-escalation-input-helpers";
import {
  buildApprovalExecutionEscalationResponse,
  type ApprovalExecutionEscalationResponse
} from "@/features/approval/execution-escalation-response-helpers";
import {
  buildApprovalExecutionEscalationAuditActorContext,
  buildApprovalExecutionEscalationEventPublishFailedAuditEntry,
  buildApprovalExecutionEscalationFailedAuditEntry,
  buildApprovalExecutionEscalationGeneratedAuditEntry,
  buildApprovalExecutionEscalationRequestedAuditEntry,
  toApprovalExecutionEscalationErrorMessage
} from "@/features/approval/execution-escalation-audit-entry-helpers";
import {
  buildApprovalExecutionEscalationAuditPayloadBase,
  buildApprovalExecutionEscalationFailureAuditPayload
} from "@/features/approval/audit-payload-helpers";
import {
  buildApprovalListAuditActorContext,
  buildApprovalExecutionListedAuditEntry,
  buildApprovalStageHistoryListedAuditEntry
} from "@/features/approval/list-audit-entry-helpers";
import {
  buildApprovalPolicyGatePreviewAuditPayload,
  resolveApprovalGatePreviewActorContext,
  resolveApprovalPolicyReadResult,
  toApprovalPolicyGatePreview,
  type ApprovalPolicyGateAllowedReason,
  type ApprovalPolicyGatePreview
} from "@/features/approval/policy-read-helpers";

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
): Promise<{ preview: ApprovalPolicyGatePreview }> {
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

  const { previewActorRole, previewActorId } = resolveApprovalGatePreviewActorContext({
    actorRole: input.actorRole,
    actorId: input.actorId,
    defaultActorRole: actor.role,
    defaultActorId: actor.id || null
  });
  const effectiveAt = input.effectiveAt ?? new Date();

  let allowed = isPrivilegedActor(previewActorRole) || expectedRoles.includes(previewActorRole);
  let allowedReason: ApprovalPolicyGateAllowedReason = allowed
    ? isPrivilegedActor(previewActorRole)
      ? "privileged_bypass"
      : "expected_role"
    : "denied";
  let activeDelegations: Array<{
    id: string;
    delegatorRole: string;
    delegateActorId: string;
    startsAt: Date;
    endsAt: Date;
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
        startsAt: delegation.startsAt,
        endsAt: delegation.endsAt,
        active: delegation.active
      }));

    if (activeDelegations.length > 0) {
      allowed = true;
      allowedReason = "active_delegation";
    }
  }

  const preview = toApprovalPolicyGatePreview({
    organizationId,
    domain: input.domain,
    fallbackRole,
    expectedRoles,
    actorRole: previewActorRole,
    actorId: previewActorId,
    allowed,
    allowedReason,
    payrollGrossPayKrw: input.payrollGrossPayKrw,
    effectiveAt,
    matchedTemplates,
    activeDelegations
  });

  await context.dataAccess.audit.append({
    action: "approval.policy_gate.previewed",
    entityType: "ApprovalPolicy",
    entityId: policy?.id ?? "default",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: buildApprovalPolicyGatePreviewAuditPayload(preview)
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
  return resolveApprovalPolicyReadResult(policy, organizationId, toPolicyFallback);
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
  const listAuditActor = buildApprovalListAuditActorContext({
    organizationId,
    actorRole: actor.role,
    actorId: actor.id
  });
  const limit = normalizeApprovalStageHistoryListLimit(input.limit);

  const rows = await context.dataAccess.approvals.listStageHistory(
    buildApprovalStageHistoryListQueryInput({
      organizationId,
      domain: input.domain,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      allowed: input.allowed,
      resolution: input.resolution,
      from: input.from,
      to: input.to,
      limit
    })
  );

  await context.dataAccess.audit.append(
    buildApprovalStageHistoryListedAuditEntry({
      actor: listAuditActor,
      domain: input.domain,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      allowed: input.allowed,
      resolution: input.resolution,
      from: input.from,
      to: input.to,
      limit,
      resultCount: rows.length
    })
  );

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
  const listAuditActor = buildApprovalListAuditActorContext({
    organizationId,
    actorRole: actor.role,
    actorId: actor.id
  });
  const { limit, sort, stalledHoursMin, asOf } = normalizeApprovalExecutionListOptions({
    limit: input.limit,
    sort: input.sort,
    stalledHoursMin: input.stalledHoursMin,
    asOf: input.asOf
  });

  let rows = await context.dataAccess.approvals.listExecutions(
    buildApprovalExecutionListQueryInput({
      organizationId,
      domain: input.domain,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      state: input.state
    })
  );

  rows = selectApprovalExecutionsForList({
    rows,
    sort,
    stalledHoursMin,
    asOf,
    limit
  });

  await context.dataAccess.audit.append(
    buildApprovalExecutionListedAuditEntry({
      actor: listAuditActor,
      domain: input.domain,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      state: input.state,
      sort,
      stalledHoursMin,
      asOf,
      limit,
      resultCount: rows.length
    })
  );

  return rows;
}

export async function triggerApprovalExecutionEscalation(
  context: ServiceContext,
  input: TriggerApprovalExecutionEscalationInput
): Promise<ApprovalExecutionEscalationResponse> {
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

  const { stalledHoursMin, limit, dryRun, notificationChannel } =
    normalizeApprovalExecutionEscalationPolicy({
      stalledHoursMin: input.stalledHoursMin,
      limit: input.limit,
      dryRun: input.dryRun,
      notificationChannel: input.notificationChannel
    });

  let executions = await context.dataAccess.approvals.listExecutions(
    buildPendingApprovalExecutionQueryInput({
      organizationId,
      domain: input.domain
    })
  );

  const totalPending = executions.length;
  executions = selectApprovalExecutionEscalationCandidates({
    executions,
    asOf,
    stalledHoursMin,
    limit
  });

  const items: ApprovalExecutionEscalationItem[] = toApprovalExecutionEscalationItems({
    executions,
    asOf,
    dryRun
  });

  const webhook = resolveApprovalEscalationWebhookConfig();
  const escalationAuditActor = buildApprovalExecutionEscalationAuditActorContext({
    organizationId,
    actorRole: actor.role,
    actorId: actor.id
  });
  const payloadBase = buildApprovalExecutionEscalationAuditPayloadBase({
    asOf,
    domain: input.domain,
    stalledHoursMin,
    limit,
    notificationChannel,
    dryRun,
    totalPending,
    candidateCount: items.length,
    requestedAt,
    provider: webhook?.provider ?? null,
    webhookSource: webhook?.source ?? null
  });

  await context.dataAccess.audit.append(
    buildApprovalExecutionEscalationGeneratedAuditEntry({
      actor: escalationAuditActor,
      payload: payloadBase
    })
  );

  if (!dryRun && items.length > 0 && !webhook) {
    await context.dataAccess.audit.append(
      buildApprovalExecutionEscalationFailedAuditEntry({
        actor: escalationAuditActor,
        payload: buildApprovalExecutionEscalationFailureAuditPayload({
          base: payloadBase,
          reason: "webhook_not_configured"
        })
      })
    );
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
      await context.dataAccess.audit.append(
        buildApprovalExecutionEscalationRequestedAuditEntry({
          actor: escalationAuditActor,
          payload: payloadBase
        })
      );
    } catch (error) {
      await context.dataAccess.audit.append(
        buildApprovalExecutionEscalationFailedAuditEntry({
          actor: escalationAuditActor,
          payload: buildApprovalExecutionEscalationFailureAuditPayload({
            base: payloadBase,
            reason: "webhook_request_failed",
            error: toApprovalExecutionEscalationErrorMessage(error)
          })
        })
      );
      throw new ServiceError(502, "approval execution escalation webhook request failed");
    }

    try {
      await getEventPublisher(context).publish(
        buildApprovalExecutionEscalationRequestedEvent({
          requestedAt,
          actorRole: actor.role,
          actorId: actor.id,
          organizationId,
          asOf,
          domain: input.domain,
          stalledHoursMin,
          limit,
          notificationChannel,
          provider: webhook.provider,
          webhookSource: webhook.source,
          items
        })
      );
    } catch (error) {
      try {
        await context.dataAccess.audit.append(
          buildApprovalExecutionEscalationEventPublishFailedAuditEntry({
            actor: escalationAuditActor,
            payload: buildApprovalExecutionEscalationFailureAuditPayload({
              base: payloadBase,
              reason: "event_publish_failed",
              error: toApprovalExecutionEscalationErrorMessage(error)
            })
          })
        );
      } catch {
        // Non-blocking failure path: webhook dispatch already completed.
      }
    }
  }

  return buildApprovalExecutionEscalationResponse({
    requestedAt,
    dryRun,
    stalledHoursMin,
    limit,
    notificationChannel,
    provider: webhook?.provider ?? null,
    webhookSource: webhook?.source ?? null,
    organizationId,
    domain: input.domain,
    asOf,
    totalPending,
    items
  });
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
