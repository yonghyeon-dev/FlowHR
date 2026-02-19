import type { Actor } from "@/lib/actor";
import { requireOwnOrAny, requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import { assertApprovalPolicyGate } from "@/features/approval/service";
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
} | null): LeavePolicyRules {
  return {
    annualGrantDays: policy?.annualGrantDays ?? DEFAULT_GRANTED_DAYS,
    carryOverCapDays: policy?.carryOverCapDays ?? DEFAULT_CARRY_OVER_CAP_DAYS,
    allowHalfDay: policy?.allowHalfDay ?? DEFAULT_ALLOW_HALF_DAY,
    allowHourly: policy?.allowHourly ?? DEFAULT_ALLOW_HOURLY,
    hourlyIncrementMinutes: policy?.hourlyIncrementMinutes ?? DEFAULT_HOURLY_INCREMENT_MINUTES,
    maxHoursPerRequest: policy?.maxHoursPerRequest ?? DEFAULT_MAX_HOURS_PER_REQUEST,
    minNoticeDays: policy?.minNoticeDays ?? DEFAULT_MIN_NOTICE_DAYS,
    maxConsecutiveDays: policy?.maxConsecutiveDays ?? DEFAULT_MAX_CONSECUTIVE_DAYS
  };
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
  await assertApprovalPolicyGate(context, {
    domain: "LEAVE",
    organizationId: employee.organizationId,
    targetEntityType: "LeaveRequest",
    targetEntityId: pending.id
  });
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
  await assertApprovalPolicyGate(context, {
    domain: "LEAVE",
    organizationId: employee.organizationId,
    targetEntityType: "LeaveRequest",
    targetEntityId: pending.id
  });
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

  const stored = await context.dataAccess.leavePolicy.upsertForOrganization({
    organizationId,
    annualGrantDays: input.annualGrantDays,
    carryOverCapDays: input.carryOverCapDays,
    allowHalfDay: input.allowHalfDay,
    allowHourly: input.allowHourly,
    hourlyIncrementMinutes: input.hourlyIncrementMinutes,
    maxHoursPerRequest: input.maxHoursPerRequest,
    minNoticeDays: input.minNoticeDays,
    maxConsecutiveDays: input.maxConsecutiveDays
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
      maxConsecutiveDays: stored.maxConsecutiveDays
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
      maxConsecutiveDays: stored.maxConsecutiveDays
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
      updatedAt: stored.updatedAt.toISOString()
    }
  };
}

export const leaveServiceInternals = {
  calculateLeaveDays,
  calculateRequestedLeave
};
