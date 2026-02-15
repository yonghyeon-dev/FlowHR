import type { Actor } from "@/lib/actor";
import { requireOwnOrAny, requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  DataAccess,
  LeaveBalanceEntity,
  LeaveRequestEntity,
  LeaveType
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_GRANTED_DAYS = 15;
const DEFAULT_CARRY_OVER_CAP_DAYS = 5;

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
  reason?: string;
};

type UpdateLeaveRequestInput = {
  leaveType?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
};

type SettleLeaveAccrualInput = {
  employeeId: string;
  year: number;
  annualGrantDays?: number;
  carryOverCapDays?: number;
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

function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "to must be after from");
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

  const days = calculateLeaveDays(input.startDate, input.endDate);
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
    days,
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
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
      days
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
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
      days
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
  const nextDays = calculateLeaveDays(nextStartDate, nextEndDate);
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
    reason: input.reason,
    days: nextDays
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

  const annualGrantDays = input.annualGrantDays ?? DEFAULT_GRANTED_DAYS;
  const carryOverCapDays = input.carryOverCapDays ?? DEFAULT_CARRY_OVER_CAP_DAYS;
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

export const leaveServiceInternals = {
  calculateLeaveDays
};
