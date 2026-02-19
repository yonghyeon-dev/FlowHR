import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  ApprovalDelegationEntity,
  ApprovalDomain,
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
  const matchedTemplates = templates.filter((template) =>
    doesTemplateMatchGateContext(template, {
      domain: input.domain,
      payrollGrossPayKrw: input.payrollGrossPayKrw
    })
  );
  const matchedTemplateIds = matchedTemplates.map((template) => template.id);
  const fallbackRole = resolvePolicyApproverRole(policy, input.domain);
  const expectedRoles = resolveExpectedApproverRoles(policy, templates, {
    domain: input.domain,
    payrollGrossPayKrw: input.payrollGrossPayKrw
  });
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

  if (isPrivilegedActor(actor.role)) {
    await appendStageHistory(true, "PRIVILEGED_BYPASS");
    return;
  }

  if (expectedRoles.includes(actor.role)) {
    await appendStageHistory(true, "EXPECTED_ROLE");
    return;
  }

  const delegations = await context.dataAccess.approvals.listDelegations({
    organizationId,
    domain: input.domain,
    active: true,
    delegateActorId: actor.id
  });

  const activeDelegations = delegations.filter(
    (delegation) =>
      expectedRoles.includes(delegation.delegatorRole) && isDelegationActiveAt(delegation, evaluatedAt)
  );
  if (activeDelegations.length > 0) {
    await appendStageHistory(
      true,
      "ACTIVE_DELEGATION",
      activeDelegations.map((delegation) => delegation.id)
    );
    return;
  }

  await appendStageHistory(false, "DENIED");

  throw new ServiceError(
    403,
    `approval policy requires one of [${expectedRoles.join(", ")}] role or active delegation`
  );
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
