import type { Actor } from "@/lib/actor";
import { requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  AttendanceRecordEntity,
  CreateWorkScheduleTemplateInput,
  CreateWorkScheduleInput,
  DataAccess,
  UpdateWorkScheduleInput,
  WorkScheduleTemplateEntity,
  WorkScheduleEntity
} from "@/features/shared/data-access";
import { listAttendanceRecords } from "@/features/attendance/service";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

type CreateScheduleInput = {
  employeeId: string;
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
};

type ListScheduleInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
};

type ListScheduleAnomaliesInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  lateThresholdMinutes?: number;
};

type UpdateScheduleInput = {
  startAt?: Date;
  endAt?: Date;
  breakMinutes?: number;
  isHoliday?: boolean;
  notes?: string;
};

type CreateTemplateInput = {
  name: string;
  startMinute: number;
  endMinute: number;
  breakMinutes: number;
  isHoliday: boolean;
  weekdays: number[];
  notes?: string;
};

type AssignTemplateInput = {
  templateId: string;
  employeeId: string;
  date: string;
};

export type ScheduleAttendanceAnomalyType = "LATE" | "NO_SHOW";

export type ScheduleAttendanceAnomaly = {
  scheduleId: string;
  employeeId: string;
  scheduleStartAt: Date;
  scheduleEndAt: Date;
  anomalyType: ScheduleAttendanceAnomalyType;
  lateMinutes: number | null;
  attendanceRecordId: string | null;
  checkInAt: Date | null;
};

export type ScheduleAttendanceAnomalyReport = {
  periodStart: Date;
  periodEnd: Date;
  lateThresholdMinutes: number;
  counts: {
    evaluatedSchedules: number;
    anomalies: number;
    late: number;
    noShow: number;
  };
  anomalies: ScheduleAttendanceAnomaly[];
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "to must be after from");
  }
}

function normalizeLateThresholdMinutes(value: number | undefined) {
  const normalized = value ?? 10;
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 240) {
    throw new ServiceError(400, "lateThresholdMinutes must be an integer in range 0..240");
  }
  return normalized;
}

function toCreateInput(input: CreateScheduleInput): CreateWorkScheduleInput {
  return {
    employeeId: input.employeeId,
    startAt: input.startAt,
    endAt: input.endAt,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    notes: input.notes
  };
}

function toUpdateInput(input: UpdateScheduleInput): UpdateWorkScheduleInput {
  return {
    startAt: input.startAt,
    endAt: input.endAt,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    notes: input.notes
  };
}

function toTemplateCreateInput(input: CreateTemplateInput, organizationId: string): CreateWorkScheduleTemplateInput {
  return {
    organizationId,
    name: input.name,
    startMinute: input.startMinute,
    endMinute: input.endMinute,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    weekdays: [...input.weekdays],
    notes: input.notes
  };
}

function ensureValidTemplateMinutes(startMinute: number, endMinute: number) {
  if (startMinute < 0 || startMinute >= 1440 || endMinute < 0 || endMinute >= 1440) {
    throw new ServiceError(400, "template minute fields must be in range 0..1439");
  }
  if (startMinute === endMinute) {
    throw new ServiceError(400, "startMinute and endMinute cannot be equal");
  }
}

function normalizeWeekdays(weekdays: number[]) {
  const unique = Array.from(new Set(weekdays)).sort((a, b) => a - b);
  if (unique.length === 0) {
    throw new ServiceError(400, "weekdays must include at least one day");
  }
  if (unique.some((day) => day < 1 || day > 7)) {
    throw new ServiceError(400, "weekdays must be in range 1..7");
  }
  return unique;
}

function requireTemplateTenantScope(context: ServiceContext) {
  const tenantScope = resolveTenantScope(context.actor);
  if (!tenantScope) {
    throw new ServiceError(400, "template operations require tenant organization scope");
  }
  return tenantScope;
}

function parseDateToKstBase(dateYmd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
    throw new ServiceError(400, "date must follow YYYY-MM-DD");
  }
  const base = new Date(`${dateYmd}T00:00:00+09:00`);
  if (Number.isNaN(base.getTime())) {
    throw new ServiceError(400, "invalid date");
  }
  return base;
}

function weekdayFromKstDate(dateYmd: string) {
  const base = parseDateToKstBase(dateYmd);
  const shiftedToKst = new Date(base.getTime() + 9 * 60 * 60 * 1000);
  const weekdayJs = shiftedToKst.getUTCDay();
  return weekdayJs === 0 ? 7 : weekdayJs;
}

function dateTimeFromKstDateAndMinute(dateYmd: string, minute: number) {
  const base = parseDateToKstBase(dateYmd);
  return new Date(base.getTime() + minute * 60_000);
}

export async function createWorkSchedule(
  context: ServiceContext,
  input: CreateScheduleInput
): Promise<WorkScheduleEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.schedulingScheduleWriteAny, "schedule assignment requires permission");

  if (input.endAt <= input.startAt) {
    throw new ServiceError(400, "endAt must be after startAt");
  }

  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);

  const overlapping = await context.dataAccess.scheduling.listInPeriod({
    periodStart: input.startAt,
    periodEnd: input.endAt,
    organizationId: employee.organizationId ?? undefined,
    employeeId: input.employeeId
  });
  const strictOverlaps = overlapping.filter((existing) => existing.startAt < input.endAt && existing.endAt > input.startAt);
  if (strictOverlaps.length > 0) {
    throw new ServiceError(409, "overlapping schedule exists", {
      employeeId: input.employeeId,
      overlapCount: strictOverlaps.length,
      overlappingScheduleIds: strictOverlaps.map((schedule) => schedule.id)
    });
  }

  const schedule = await context.dataAccess.scheduling.create(toCreateInput(input));

  await context.dataAccess.audit.append({
    action: "scheduling.schedule.assigned",
    entityType: "WorkSchedule",
    entityId: schedule.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: schedule.employeeId,
      startAt: schedule.startAt.toISOString(),
      endAt: schedule.endAt.toISOString(),
      breakMinutes: schedule.breakMinutes,
      isHoliday: schedule.isHoliday,
      notes: schedule.notes
    }
  });
  await getEventPublisher(context).publish({
    name: "scheduling.schedule.assigned.v1",
    occurredAt: new Date().toISOString(),
    entityType: "WorkSchedule",
    entityId: schedule.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: schedule.employeeId,
      startAt: schedule.startAt.toISOString(),
      endAt: schedule.endAt.toISOString(),
      breakMinutes: schedule.breakMinutes,
      isHoliday: schedule.isHoliday
    }
  });

  return schedule;
}

async function requireEditableSchedule(
  context: ServiceContext,
  scheduleId: string,
  permissionMessage: string
): Promise<WorkScheduleEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const existing = await context.dataAccess.scheduling.findById(scheduleId);
  if (!existing) {
    throw new ServiceError(404, "schedule not found");
  }

  await requireEmployeeWithinTenant(context.dataAccess, context.actor, existing.employeeId);
  await requirePermission(context, Permissions.schedulingScheduleWriteAny, permissionMessage);

  return existing;
}

export async function updateWorkSchedule(
  context: ServiceContext,
  scheduleId: string,
  input: UpdateScheduleInput
): Promise<WorkScheduleEntity> {
  const existing = await requireEditableSchedule(context, scheduleId, "schedule update requires permission");
  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, existing.employeeId);

  const startAt = input.startAt ?? existing.startAt;
  const endAt = input.endAt ?? existing.endAt;
  if (endAt <= startAt) {
    throw new ServiceError(400, "endAt must be after startAt");
  }

  const overlapping = await context.dataAccess.scheduling.listInPeriod({
    periodStart: startAt,
    periodEnd: endAt,
    organizationId: employee.organizationId ?? undefined,
    employeeId: existing.employeeId
  });
  const strictOverlaps = overlapping.filter(
    (schedule) => schedule.id !== scheduleId && schedule.startAt < endAt && schedule.endAt > startAt
  );
  if (strictOverlaps.length > 0) {
    throw new ServiceError(409, "overlapping schedule exists", {
      scheduleId,
      employeeId: existing.employeeId,
      overlapCount: strictOverlaps.length,
      overlappingScheduleIds: strictOverlaps.map((schedule) => schedule.id)
    });
  }

  const updated = await context.dataAccess.scheduling.update(scheduleId, toUpdateInput(input));

  await context.dataAccess.audit.append({
    action: "scheduling.schedule.updated",
    entityType: "WorkSchedule",
    entityId: updated.id,
    organizationId: employee.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      scheduleId: updated.id,
      employeeId: updated.employeeId,
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt.toISOString(),
      breakMinutes: updated.breakMinutes,
      isHoliday: updated.isHoliday,
      notes: updated.notes,
      changed: {
        startAt: input.startAt ? input.startAt.toISOString() : undefined,
        endAt: input.endAt ? input.endAt.toISOString() : undefined,
        breakMinutes: input.breakMinutes,
        isHoliday: input.isHoliday,
        notes: input.notes
      }
    }
  });
  await getEventPublisher(context).publish({
    name: "scheduling.schedule.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "WorkSchedule",
    entityId: updated.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      employeeId: updated.employeeId,
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt.toISOString(),
      breakMinutes: updated.breakMinutes,
      isHoliday: updated.isHoliday
    }
  });

  return updated;
}

export async function deleteWorkSchedule(
  context: ServiceContext,
  scheduleId: string
): Promise<WorkScheduleEntity> {
  const existing = await requireEditableSchedule(context, scheduleId, "schedule delete requires permission");
  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, existing.employeeId);

  const deleted = await context.dataAccess.scheduling.delete(scheduleId);

  await context.dataAccess.audit.append({
    action: "scheduling.schedule.deleted",
    entityType: "WorkSchedule",
    entityId: deleted.id,
    organizationId: employee.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      scheduleId: deleted.id,
      employeeId: deleted.employeeId,
      startAt: deleted.startAt.toISOString(),
      endAt: deleted.endAt.toISOString(),
      breakMinutes: deleted.breakMinutes,
      isHoliday: deleted.isHoliday
    }
  });
  await getEventPublisher(context).publish({
    name: "scheduling.schedule.deleted.v1",
    occurredAt: new Date().toISOString(),
    entityType: "WorkSchedule",
    entityId: deleted.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      employeeId: deleted.employeeId,
      startAt: deleted.startAt.toISOString(),
      endAt: deleted.endAt.toISOString(),
      breakMinutes: deleted.breakMinutes,
      isHoliday: deleted.isHoliday
    }
  });

  return deleted;
}

async function requireTemplateEntityWithinTenant(
  context: ServiceContext,
  templateId: string
): Promise<WorkScheduleTemplateEntity> {
  const template = await context.dataAccess.scheduling.findTemplateById(templateId);
  if (!template) {
    throw new ServiceError(404, "schedule template not found");
  }

  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && template.organizationId !== tenantScope) {
    throw new ServiceError(404, "schedule template not found");
  }

  return template;
}

export async function createWorkScheduleTemplate(
  context: ServiceContext,
  input: CreateTemplateInput
): Promise<WorkScheduleTemplateEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.schedulingScheduleWriteAny, "schedule template create requires permission");

  ensureValidTemplateMinutes(input.startMinute, input.endMinute);
  const weekdays = normalizeWeekdays(input.weekdays);
  const organizationId = requireTemplateTenantScope(context);

  const template = await context.dataAccess.scheduling.createTemplate(
    toTemplateCreateInput({ ...input, weekdays }, organizationId)
  );

  await context.dataAccess.audit.append({
    action: "scheduling.template.created",
    entityType: "WorkScheduleTemplate",
    entityId: template.id,
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      name: template.name,
      startMinute: template.startMinute,
      endMinute: template.endMinute,
      breakMinutes: template.breakMinutes,
      isHoliday: template.isHoliday,
      weekdays: template.weekdays
    }
  });
  await getEventPublisher(context).publish({
    name: "scheduling.template.created.v1",
    occurredAt: new Date().toISOString(),
    entityType: "WorkScheduleTemplate",
    entityId: template.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      organizationId: template.organizationId,
      name: template.name,
      startMinute: template.startMinute,
      endMinute: template.endMinute,
      breakMinutes: template.breakMinutes,
      isHoliday: template.isHoliday,
      weekdays: template.weekdays
    }
  });

  return template;
}

export async function listWorkScheduleTemplates(context: ServiceContext): Promise<WorkScheduleTemplateEntity[]> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const permissions = await resolveActorPermissions(context);
  const canList =
    permissions.has(Permissions.schedulingScheduleWriteAny) || permissions.has(Permissions.schedulingScheduleListAny);
  if (!canList) {
    throw new ServiceError(403, "schedule template list requires permission");
  }

  const organizationId = requireTemplateTenantScope(context);
  return await context.dataAccess.scheduling.listTemplates({ organizationId });
}

export async function assignWorkScheduleFromTemplate(
  context: ServiceContext,
  input: AssignTemplateInput
): Promise<WorkScheduleEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.schedulingScheduleWriteAny, "schedule template assign requires permission");

  const template = await requireTemplateEntityWithinTenant(context, input.templateId);
  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  if (!employee.organizationId || employee.organizationId !== template.organizationId) {
    throw new ServiceError(409, "template organization and employee organization must match");
  }

  const weekday = weekdayFromKstDate(input.date);
  if (!template.weekdays.includes(weekday)) {
    throw new ServiceError(409, "template is not active on the requested weekday", {
      templateId: template.id,
      requestedWeekday: weekday,
      templateWeekdays: template.weekdays
    });
  }

  const startAt = dateTimeFromKstDateAndMinute(input.date, template.startMinute);
  let endAt = dateTimeFromKstDateAndMinute(input.date, template.endMinute);
  if (template.endMinute <= template.startMinute) {
    endAt = new Date(endAt.getTime() + 24 * 60 * 60 * 1000);
  }

  const schedule = await createWorkSchedule(context, {
    employeeId: input.employeeId,
    startAt,
    endAt,
    breakMinutes: template.breakMinutes,
    isHoliday: template.isHoliday,
    notes: template.notes ?? undefined
  });

  await context.dataAccess.audit.append({
    action: "scheduling.template.assigned",
    entityType: "WorkScheduleTemplate",
    entityId: template.id,
    organizationId: template.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      templateId: template.id,
      scheduleId: schedule.id,
      employeeId: schedule.employeeId,
      date: input.date
    }
  });
  await getEventPublisher(context).publish({
    name: "scheduling.template.assigned.v1",
    occurredAt: new Date().toISOString(),
    entityType: "WorkScheduleTemplate",
    entityId: template.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      templateId: template.id,
      scheduleId: schedule.id,
      employeeId: schedule.employeeId,
      date: input.date
    }
  });

  return schedule;
}

export async function listWorkSchedules(
  context: ServiceContext,
  input: ListScheduleInput
): Promise<WorkScheduleEntity[]> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.employeeId) {
    await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  }

  const actor = context.actor;
  let employeeId = input.employeeId;
  const permissions = await resolveActorPermissions(context);

  if (permissions.has(Permissions.schedulingScheduleListAny)) {
    // optional employeeId filter allowed
  } else if (permissions.has(Permissions.schedulingScheduleListByEmployee)) {
    if (!employeeId) {
      throw new ServiceError(400, "employeeId is required for manager schedule list queries");
    }
  } else if (permissions.has(Permissions.schedulingScheduleListOwn)) {
    employeeId = employeeId ?? actor.id;
    if (employeeId !== actor.id) {
      throw new ServiceError(403, "employee can only list own schedules");
    }
  } else {
    throw new ServiceError(403, "schedule list requires permission");
  }

  return await context.dataAccess.scheduling.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId
  });
}

function attendanceOverlapsSchedule(
  attendance: AttendanceRecordEntity,
  schedule: WorkScheduleEntity
) {
  if (attendance.state === "REJECTED") {
    return false;
  }
  const attendanceEnd = attendance.checkOutAt ?? attendance.checkInAt;
  return attendance.checkInAt <= schedule.endAt && attendanceEnd >= schedule.startAt;
}

function indexAttendanceByEmployee(records: AttendanceRecordEntity[]) {
  const byEmployee = new Map<string, AttendanceRecordEntity[]>();
  for (const record of records) {
    const rows = byEmployee.get(record.employeeId);
    if (rows) {
      rows.push(record);
      continue;
    }
    byEmployee.set(record.employeeId, [record]);
  }
  return byEmployee;
}

export async function listScheduleAttendanceAnomalies(
  context: ServiceContext,
  input: ListScheduleAnomaliesInput
): Promise<ScheduleAttendanceAnomalyReport> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const lateThresholdMinutes = normalizeLateThresholdMinutes(input.lateThresholdMinutes);

  // Keep permission model strict by reusing each domain list service:
  // - scheduling list permissions/tenant rules
  // - attendance list permissions/tenant rules
  const schedules = await listWorkSchedules(context, {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    employeeId: input.employeeId
  });

  const oneDayMs = 24 * 60 * 60 * 1000;
  const attendancePeriodStart = new Date(input.periodStart.getTime() - oneDayMs);
  const attendancePeriodEnd = new Date(input.periodEnd.getTime() + oneDayMs);
  const attendances = await listAttendanceRecords(context, {
    periodStart: attendancePeriodStart,
    periodEnd: attendancePeriodEnd,
    employeeId: input.employeeId
  });
  const attendanceByEmployee = indexAttendanceByEmployee(attendances);

  const anomalies: ScheduleAttendanceAnomaly[] = [];
  for (const schedule of schedules) {
    const records = attendanceByEmployee.get(schedule.employeeId) ?? [];
    const overlaps = records.filter((record) => attendanceOverlapsSchedule(record, schedule));
    if (overlaps.length === 0) {
      anomalies.push({
        scheduleId: schedule.id,
        employeeId: schedule.employeeId,
        scheduleStartAt: schedule.startAt,
        scheduleEndAt: schedule.endAt,
        anomalyType: "NO_SHOW",
        lateMinutes: null,
        attendanceRecordId: null,
        checkInAt: null
      });
      continue;
    }

    const earliest = overlaps.reduce((min, current) =>
      current.checkInAt.getTime() < min.checkInAt.getTime() ? current : min
    );
    const lateMinutes = Math.floor((earliest.checkInAt.getTime() - schedule.startAt.getTime()) / 60_000);
    if (lateMinutes > lateThresholdMinutes) {
      anomalies.push({
        scheduleId: schedule.id,
        employeeId: schedule.employeeId,
        scheduleStartAt: schedule.startAt,
        scheduleEndAt: schedule.endAt,
        anomalyType: "LATE",
        lateMinutes,
        attendanceRecordId: earliest.id,
        checkInAt: earliest.checkInAt
      });
    }
  }

  anomalies.sort((a, b) => {
    const byStart = a.scheduleStartAt.getTime() - b.scheduleStartAt.getTime();
    if (byStart !== 0) {
      return byStart;
    }
    return a.scheduleId.localeCompare(b.scheduleId);
  });

  const lateCount = anomalies.filter((item) => item.anomalyType === "LATE").length;
  const noShowCount = anomalies.length - lateCount;
  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.report.generated",
    entityType: "WorkSchedule",
    organizationId: resolveTenantScope(actor) ?? undefined,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId ?? null,
      lateThresholdMinutes,
      evaluatedSchedules: schedules.length,
      anomalies: anomalies.length,
      lateCount,
      noShowCount
    }
  });

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    lateThresholdMinutes,
    counts: {
      evaluatedSchedules: schedules.length,
      anomalies: anomalies.length,
      late: lateCount,
      noShow: noShowCount
    },
    anomalies
  };
}

