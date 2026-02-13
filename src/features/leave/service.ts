import type { Actor } from "@/lib/actor";
import { hasAnyRole } from "@/lib/permissions";
import type {
  DataAccess,
  LeaveBalanceEntity,
  LeaveRequestEntity,
  LeaveType
} from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_GRANTED_DAYS = 15;

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
};

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

function isMutator(actor: Actor, employeeId: string) {
  if (actor.role === "admin" || actor.role === "manager") {
    return true;
  }
  if (actor.role === "employee") {
    return actor.id === employeeId;
  }
  return false;
}

function canReadLeaveBalance(actor: Actor, employeeId: string) {
  if (actor.role === "admin" || actor.role === "manager" || actor.role === "payroll_operator") {
    return true;
  }
  return actor.role === "employee" && actor.id === employeeId;
}

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
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (!isMutator(context.actor, input.employeeId)) {
    throw new ServiceError(403, "insufficient permissions");
  }

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
    actorRole: context.actor.role,
    actorId: context.actor.id,
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
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const existing = await requirePendingRequest(context, requestId);
  if (!isMutator(context.actor, existing.employeeId)) {
    throw new ServiceError(403, "insufficient permissions");
  }

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
    actorRole: context.actor.role,
    actorId: context.actor.id,
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
  if (!context.actor || !hasAnyRole(context.actor, ["admin", "manager"])) {
    throw new ServiceError(403, "approval requires admin or manager role");
  }

  await requirePendingRequest(context, requestId);
  const now = new Date();
  const request = await context.dataAccess.leave.update(requestId, {
    state: "APPROVED",
    decisionReason: null,
    approvedAt: now,
    approvedBy: context.actor.id,
    rejectedAt: null,
    rejectedBy: null,
    canceledAt: null,
    canceledBy: null
  });

  await context.dataAccess.leave.appendDecision({
    requestId: request.id,
    action: "APPROVED",
    actorId: context.actor.id,
    actorRole: context.actor.role
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
    actorRole: context.actor.role,
    actorId: context.actor.id,
    payload: {
      employeeId: request.employeeId,
      days: request.days,
      leaveType: request.leaveType
    }
  });

  return { request, balance };
}

export async function rejectLeaveRequest(
  context: ServiceContext,
  requestId: string,
  reason: string
): Promise<LeaveRequestEntity> {
  if (!context.actor || !hasAnyRole(context.actor, ["admin", "manager"])) {
    throw new ServiceError(403, "rejection requires admin or manager role");
  }

  await requirePendingRequest(context, requestId);
  const now = new Date();
  const request = await context.dataAccess.leave.update(requestId, {
    state: "REJECTED",
    decisionReason: reason,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: now,
    rejectedBy: context.actor.id,
    canceledAt: null,
    canceledBy: null
  });

  await context.dataAccess.leave.appendDecision({
    requestId: request.id,
    action: "REJECTED",
    actorId: context.actor.id,
    actorRole: context.actor.role,
    reason
  });

  await context.dataAccess.audit.append({
    action: "leave.rejected",
    entityType: "LeaveRequest",
    entityId: request.id,
    actorRole: context.actor.role,
    actorId: context.actor.id,
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
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const existing = await requirePendingRequest(context, requestId);
  if (!isMutator(context.actor, existing.employeeId)) {
    throw new ServiceError(403, "insufficient permissions");
  }

  const now = new Date();
  const request = await context.dataAccess.leave.update(requestId, {
    state: "CANCELED",
    decisionReason: reason ?? null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    canceledAt: now,
    canceledBy: context.actor.id
  });

  await context.dataAccess.leave.appendDecision({
    requestId: request.id,
    action: "CANCELED",
    actorId: context.actor.id,
    actorRole: context.actor.role,
    reason
  });

  await context.dataAccess.audit.append({
    action: "leave.canceled",
    entityType: "LeaveRequest",
    entityId: request.id,
    actorRole: context.actor.role,
    actorId: context.actor.id,
    payload: {
      employeeId: request.employeeId,
      reason: reason ?? null
    }
  });

  return request;
}

export async function readLeaveBalance(
  context: ServiceContext,
  employeeId: string
): Promise<LeaveBalanceEntity> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (!canReadLeaveBalance(context.actor, employeeId)) {
    throw new ServiceError(403, "insufficient permissions");
  }

  const balance = await context.dataAccess.leaveBalance.ensure(employeeId, DEFAULT_GRANTED_DAYS);
  await context.dataAccess.audit.append({
    action: "leave.balance_read",
    entityType: "LeaveBalanceProjection",
    entityId: employeeId,
    actorRole: context.actor.role,
    actorId: context.actor.id
  });
  return balance;
}

export const leaveServiceInternals = {
  calculateLeaveDays
};
