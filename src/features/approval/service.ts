import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  ApprovalDelegationEntity,
  ApprovalDomain,
  ApprovalLineTemplateEntity,
  ApprovalPolicyEntity,
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
  approverRoles: string[];
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
  payrollGrossPayMinKrw?: number | null;
  payrollGrossPayMaxKrw?: number | null;
  active?: boolean;
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
  }
): Promise<void> {
  const actor = requireActor(context);
  if (!input.organizationId) {
    return;
  }

  if (isPrivilegedActor(actor.role)) {
    return;
  }

  const policy = await context.dataAccess.approvals.findPolicyByOrganizationId(input.organizationId);
  const templates = await context.dataAccess.approvals.listTemplates({
    organizationId: input.organizationId,
    domain: input.domain,
    active: true
  });
  const expectedRoles = resolveExpectedApproverRoles(policy, templates, {
    domain: input.domain,
    payrollGrossPayKrw: input.payrollGrossPayKrw
  });
  if (expectedRoles.includes(actor.role)) {
    return;
  }

  const now = new Date();
  const delegations = await context.dataAccess.approvals.listDelegations({
    organizationId: input.organizationId,
    domain: input.domain,
    active: true,
    delegateActorId: actor.id
  });

  const delegated = delegations.some(
    (delegation) =>
      expectedRoles.includes(delegation.delegatorRole) && isDelegationActiveAt(delegation, now)
  );
  if (delegated) {
    return;
  }

  throw new ServiceError(
    403,
    `approval policy requires one of [${expectedRoles.join(", ")}] role or active delegation`
  );
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

export async function createApprovalLineTemplate(
  context: ServiceContext,
  input: CreateApprovalLineTemplateInput
): Promise<ApprovalLineTemplateEntity> {
  const actor = requireActor(context);
  await requirePermission(context, Permissions.approvalPolicyWrite, "approval policy write requires permission");
  const organizationId = await resolveOrganizationId(context, input.organizationId);
  const approverRoles = normalizeApproverRoles(input.approverRoles);
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
  const nextApproverRoles =
    input.approverRoles !== undefined ? normalizeApproverRoles(input.approverRoles) : existing.approverRoles;
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
    ...(input.approverRoles !== undefined ? { approverRoles: nextApproverRoles } : {}),
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
