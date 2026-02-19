import type { Actor } from "@/lib/actor";
import { requirePermission } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  ApprovalDelegationEntity,
  ApprovalDomain,
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

type UpdateApprovalDelegationInput = {
  delegateActorId?: string;
  startsAt?: Date;
  endsAt?: Date;
  reason?: string | null;
  active?: boolean;
};

type ExpireApprovalDelegationsInput = {
  organizationId?: string;
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

function resolveExpectedApproverRole(
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

function isDelegationActiveAt(delegation: ApprovalDelegationEntity, now: Date) {
  return delegation.startsAt <= now && delegation.endsAt >= now && delegation.active;
}

export async function assertApprovalPolicyGate(
  context: ServiceContext,
  input: {
    domain: ApprovalDomain;
    organizationId: string | null;
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
  const expectedRole = resolveExpectedApproverRole(policy, input.domain);
  if (actor.role === expectedRole) {
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
    (delegation) => delegation.delegatorRole === expectedRole && isDelegationActiveAt(delegation, now)
  );
  if (delegated) {
    return;
  }

  throw new ServiceError(403, `approval policy requires ${expectedRole} role or active delegation`);
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
