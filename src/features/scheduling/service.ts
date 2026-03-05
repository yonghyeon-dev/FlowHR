import { requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  WorkScheduleTemplateEntity,
  WorkScheduleEntity
} from "@/features/shared/data-access";
import { listAttendanceRecords } from "@/features/attendance/service";
import {
  ANOMALY_INCIDENT_LIFECYCLE_AUDIT_ACTION_BY_ACTION,
  ANOMALY_INCIDENT_LIFECYCLE_STATE_BY_ACTION,
  ANOMALY_INCIDENT_PROJECTION_AUDIT_ACTIONS,
  buildScheduleAnomalyIncidentReadModelsFromAuditLogs
} from "@/features/scheduling/incident-audit-projection";
import {
  buildScheduleAttendanceAnomalyReport,
  buildScheduleAttendanceAnomalyReportAuditPayload,
  buildScheduleAttendanceAnomalySet
} from "@/features/scheduling/anomaly-report-helpers";
import {
  buildScheduleAttendanceAnomalyCockpitAuditPayload,
  buildScheduleAttendanceAnomalyCockpitProjection,
  buildScheduleAttendanceAnomalyCockpitReport
} from "@/features/scheduling/anomaly-cockpit-report-helpers";
import { buildAnomalyAttendancePeriodWindow } from "@/features/scheduling/anomaly-attendance-period-helpers";
import type {
  ScheduleAttendanceAnomalyCockpitReport,
  ScheduleAttendanceAnomalyReport
} from "@/features/scheduling/anomaly-report-helpers";
import {
  buildScheduleAnomalyIncidentAutoActionAssignIncidentCallback,
  buildScheduleAnomalyIncidentAutoActionResult,
  resolveScheduleAnomalyIncidentAutoActionNotificationMeta,
  buildScheduleAnomalyIncidentAutoActionSummaryPayload,
  executeScheduleAnomalyIncidentAutoActionAssignments,
  notifyScheduleAnomalyIncidentAutoActionExecution
} from "@/features/scheduling/anomaly-incident-auto-action-helpers";
import {
  buildScheduleAnomalyIncidentAutoActionAssignFailedAuditEntry,
  buildScheduleAnomalyIncidentAutoActionExecutedEventPublisher,
  buildScheduleAnomalyIncidentAutoActionNotificationAuditAppender,
  buildScheduleAnomalyIncidentAutoActionGeneratedAuditEntry
} from "@/features/scheduling/anomaly-incident-auto-action-audit-helpers";
import {
  buildScheduleAnomalyIncidentArchiveActionsInput,
  buildScheduleAnomalyIncidentArchiveDeleteIncidentCallback,
  buildScheduleAnomalyIncidentArchivedAuditAppender,
  buildScheduleAnomalyIncidentArchiveGeneratedAuditEntry,
  buildScheduleAnomalyIncidentArchiveCandidates,
  buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload,
  resolveScheduleAnomalyIncidentArchiveMeta,
  buildScheduleAnomalyIncidentArchiveSummaryCounts,
  buildScheduleAnomalyIncidentArchiveResult,
  executeScheduleAnomalyIncidentArchiveActions
} from "@/features/scheduling/anomaly-incident-archive-helpers";
import {
  buildScheduleAnomalyIncidentSlaQueue
} from "@/features/scheduling/anomaly-incident-queue-helpers";
import {
  buildScheduleAnomalyIncidentReplayAuditListInput,
  filterScheduleAnomalyIncidentReplayLogsByRange,
  buildScheduleAnomalyIncidentReplayOnReplayCallback,
  buildScheduleAnomalyIncidentReplayGeneratedAuditPayloadInputFromMetaAndSummary,
  buildScheduleAnomalyIncidentReplayGeneratedAuditEntry,
  buildScheduleAnomalyIncidentReplayGeneratedAuditPayload,
  buildScheduleAnomalyIncidentReplaySummaryCounts,
  buildScheduleAnomalyIncidentReplayResultSummary,
  resolveScheduleAnomalyIncidentReplayMetaFromServiceInput,
  buildScheduleAnomalyIncidentReplayResult,
  executeScheduleAnomalyIncidentReplayActions,
  selectScheduleAnomalyIncidentReplayTargets
} from "@/features/scheduling/anomaly-incident-replay-helpers";
import {
  buildRotationFairnessAdvancedSummary,
  selectRotationFairnessRecommendations
} from "@/features/scheduling/rotation-fairness-selection-helpers";
import {
  createSchedulesFromGeneratedWindows,
  ensureNoOverlapsForGeneratedWindows,
  ensureRotationTemplatesShareWeekdaySet,
  requireTemplatesWithinTenant
} from "@/features/scheduling/rotation-assignment-core-helpers";
import {
  deriveRotationBalanceGrade,
  normalizeEmployeeIds,
  normalizeRotationFairnessAdvancedConstraints,
  normalizeRotationFairnessGlobalConstraints,
  normalizeTemplateIds
} from "@/features/scheduling/rotation-fairness-core-helpers";
import {
  buildRotationBalanceReportGeneratedAuditPayload,
  buildRotationBalanceReportResult,
  buildRotationBalanceSummary
} from "@/features/scheduling/rotation-balance-report-helpers";
import {
  buildScheduleListInPeriodQueryInput,
  resolveScheduleListEmployeeFilter
} from "@/features/scheduling/schedule-list-query-helpers";
import {
  buildAnomalyIncidentLifecycleAuditPayload,
  buildAnomalyIncidentLifecycleResponse,
  buildAnomalyIncidentLifecycleUpdateResult,
  buildAnomalyIncidentSlaAuditPayload,
  buildAnomalyIncidentSlaReport,
  normalizeAnomalyIncidentLifecycleMutationInput
} from "@/features/scheduling/anomaly-incident-core-helpers";
import {
  enumerateTemplateMatchedDates,
  weekdayFromKstDate
} from "@/features/scheduling/template-date-helpers";
import {
  buildRotationWindowsForTemplates,
  buildScheduleWindowFromTemplateDate,
  buildTemplateRangeWindows,
  type GeneratedScheduleWindow
} from "@/features/scheduling/rotation-window-helpers";
import {
  buildScheduleAnomalyIncidentReconcileAuditReadInput,
  buildScheduleAnomalyIncidentReconcileGeneratedAuditPayloadInputFromMetaAndSummary,
  buildScheduleAnomalyIncidentReconcileResultInputFromMetaAndRows,
  buildScheduleAnomalyIncidentReconcileSnapshotInputFromRows,
  buildScheduleAnomalyIncidentReconcileSummary,
  buildScheduleAnomalyIncidentReconcileGeneratedAuditEntry,
  buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload,
  resolveScheduleAnomalyIncidentReconcileMeta,
  buildScheduleAnomalyIncidentReconcileResult,
  buildScheduleAnomalyIncidentReconcileSnapshot,
  selectScheduleAnomalyIncidentReconcileItems
} from "@/features/scheduling/anomaly-incident-reconcile-helpers";
import {
  normalizeRequiredIncidentId,
  requireSchedulingActor,
  resolveSchedulingEventPublisher,
  resolveSchedulingWriteActorContext,
  resolveSchedulingTenantScope
} from "@/features/scheduling/anomaly-service-context-helpers";
import {
  buildScheduleAnomalyTicketSideEffectInput,
  buildScheduleAnomalySummarySideEffectInput,
  buildScheduleAnomalySideEffectContext,
  emitAnomalyCockpitTicketRequestsIfEnabled,
  emitAnomalySummarySideEffects
} from "@/features/scheduling/anomaly-side-effect-helpers";
import {
  buildScheduleAnomalyIncidentEscalationGeneratedAuditEntry,
  buildScheduleAnomalyIncidentEscalationRequestFailedAuditEntry,
  buildScheduleAnomalyIncidentEscalationRequestFailedPayload,
  buildScheduleAnomalyIncidentEscalationRequestedAuditEntry,
  buildScheduleAnomalyIncidentEscalationRequestPayload,
  buildScheduleAnomalyIncidentEscalationResult,
  buildScheduleAnomalyIncidentEscalationSummaryPayloadInputFromMetaAndExecution,
  resolveScheduleAnomalyIncidentEscalationExecutionPreparation,
  buildScheduleAnomalyIncidentEscalationSummaryPayload,
  resolveScheduleAnomalyIncidentEscalationOptions,
  executeScheduleAnomalyIncidentEscalationRequests
} from "@/features/scheduling/anomaly-incident-escalation-helpers";
import {
  getScheduleAnomalyIncidentFromHelper,
  listScheduleAnomalyIncidentsFromHelper
} from "@/features/scheduling/anomaly-incident-query-service-helpers";
import { resolveScheduleAnomalyIncidentSlaQueryInput } from "@/features/scheduling/anomaly-incident-sla-query-helpers";
import {
  normalizeAnomalyIncidentArchiveOlderThanMinutes,
  normalizeAnomalyIncidentArchiveReason,
  normalizeAnomalyIncidentReplayIncidentIds,
  normalizeAnomalyIncidentReplayTopN,
  normalizeIncidentListTopN,
  normalizeReconcileTopN
} from "@/features/scheduling/incident-normalizers";
import {
  MAX_ANOMALY_INCIDENT_AUDIT_ROWS,
  MAX_ANOMALY_INCIDENT_HISTORY,
  getScheduleAnomalyIncidentReadModel,
  listScheduleAnomalyIncidentReadModels,
  listScheduleAnomalyIncidentReadModelsFromAudit,
  normalizeAnomalyIncidentAutoAssigneeId,
  normalizeAnomalyIncidentAutoAssignMode,
  normalizeAnomalyIncidentAutoAssignNote,
  toScheduleAnomalyIncidentUpsertInput
} from "@/features/scheduling/incident-read-model-helpers";
import {
  ensureValidPeriod,
  ensureValidTemplateMinutes,
  normalizeScheduleAnomalyCockpitWindowInput,
  normalizeScheduleAnomalyReportWindowInput,
  normalizeWeekdays,
  toCreateInput,
  toTemplateCreateInput,
  toUpdateInput
} from "@/features/scheduling/schedule-input-normalization-helpers";
import { listStrictScheduleOverlaps } from "@/features/scheduling/schedule-overlap-helpers";
import { requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";
import {
  requireEditableSchedule,
  requireTemplateEntityWithinTenant,
  requireTemplateTenantScope
} from "@/features/scheduling/service-access-guards";
import {
  evaluateBestRotationForEmployee,
  type EmployeeRotationOptimizationEvaluation
} from "@/features/scheduling/helpers/rotation-evaluation-service-helper";

import type {
  CreateScheduleInput,
  ListScheduleInput,
  ListScheduleAnomaliesInput,
  ListScheduleAnomalyCockpitInput,
  ListRotationBalanceInput,
  ListRotationFairnessInput,
  UpdateScheduleInput,
  CreateTemplateInput,
  AssignTemplateInput,
  AssignTemplateRangeInput,
  TemplateRangeAssignmentResult,
  AssignRotationInput,
  AssignRotationOptimizeInput,
  RotationAssignmentResult,
  RotationOptimizationResult,
  UpdateScheduleAnomalyIncidentLifecycleInput,
  ScheduleAnomalyIncidentLifecycleResult,
  ListScheduleAnomalyIncidentsInput,
  ListScheduleAnomalyIncidentSlaInput,
  TriggerScheduleAnomalyIncidentEscalationInput,
  ExecuteScheduleAnomalyIncidentAutoActionInput,
  ArchiveScheduleAnomalyIncidentsInput,
  ReplayScheduleAnomalyIncidentStoreInput,
  ReconcileScheduleAnomalyIncidentStoreInput,
  ScheduleAnomalyIncidentReadModel,
  ScheduleAnomalyIncidentListResult,
  ScheduleAnomalyIncidentSlaReport,
  ScheduleAnomalyIncidentEscalationResult,
  ScheduleAnomalyIncidentAutoActionResult,
  ScheduleAnomalyIncidentArchiveResult,
  ScheduleAnomalyIncidentReplayResult,
  ScheduleAnomalyIncidentReconcileResult,
  RotationBalanceReport,
  RotationFairnessEmployeeResult,
  RotationFairnessReport,
  RotationFairnessApplyResult,
  ServiceContext
} from "@/features/scheduling/helpers/service-types";

export type {
  ScheduleAnomalyCockpitQueueEntry,
  ScheduleAttendanceAnomaly,
  ScheduleAttendanceAnomalyCockpitReport,
  ScheduleAttendanceAnomalyReport,
  ScheduleAttendanceAnomalyType
} from "@/features/scheduling/anomaly-report-helpers";

export type * from "@/features/scheduling/helpers/service-types";

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
  const strictOverlaps = listStrictScheduleOverlaps({
    schedules: overlapping,
    startAt: input.startAt,
    endAt: input.endAt
  });
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
  await resolveSchedulingEventPublisher(context).publish({
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
  const strictOverlaps = listStrictScheduleOverlaps({
    schedules: overlapping,
    startAt,
    endAt,
    excludeScheduleId: scheduleId
  });
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
  await resolveSchedulingEventPublisher(context).publish({
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
  await resolveSchedulingEventPublisher(context).publish({
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
  await resolveSchedulingEventPublisher(context).publish({
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

  const { startAt, endAt } = buildScheduleWindowFromTemplateDate(template, input.date);

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
  await resolveSchedulingEventPublisher(context).publish({
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

export async function assignWorkScheduleRangeFromTemplate(
  context: ServiceContext,
  input: AssignTemplateRangeInput
): Promise<TemplateRangeAssignmentResult> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.schedulingScheduleWriteAny, "schedule template range assign requires permission");

  const template = await requireTemplateEntityWithinTenant(context, input.templateId);
  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  if (!employee.organizationId || employee.organizationId !== template.organizationId) {
    throw new ServiceError(409, "template organization and employee organization must match");
  }

  const matchedDates = enumerateTemplateMatchedDates(input.fromDate, input.toDate, template.weekdays);
  const generatedWindows = buildTemplateRangeWindows(template, matchedDates);

  await ensureNoOverlapsForGeneratedWindows({
    organizationId: employee.organizationId ?? undefined,
    employeeId: input.employeeId,
    windows: generatedWindows,
    listSchedulesInPeriod: (overlapInput) => context.dataAccess.scheduling.listInPeriod(overlapInput)
  });

  const createdScheduleIds = await createSchedulesFromGeneratedWindows({
    employeeId: input.employeeId,
    windows: generatedWindows,
    createSchedule: (scheduleInput) => createWorkSchedule(context, scheduleInput)
  });

  await context.dataAccess.audit.append({
    action: "scheduling.template.range_assigned",
    entityType: "WorkScheduleTemplate",
    entityId: template.id,
    organizationId: template.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      templateId: template.id,
      employeeId: input.employeeId,
      fromDate: input.fromDate,
      toDate: input.toDate,
      matchedDates,
      createdScheduleIds,
      createdCount: createdScheduleIds.length
    }
  });
  await resolveSchedulingEventPublisher(context).publish({
    name: "scheduling.template.range_assigned.v1",
    occurredAt: new Date().toISOString(),
    entityType: "WorkScheduleTemplate",
    entityId: template.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      templateId: template.id,
      employeeId: input.employeeId,
      fromDate: input.fromDate,
      toDate: input.toDate,
      matchedDates,
      createdScheduleIds,
      createdCount: createdScheduleIds.length
    }
  });

  return {
    templateId: template.id,
    employeeId: input.employeeId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    matchedDates,
    createdScheduleIds
  };
}

export async function assignWorkScheduleRotation(
  context: ServiceContext,
  input: AssignRotationInput
): Promise<RotationAssignmentResult> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.schedulingScheduleWriteAny, "schedule rotation assign requires permission");

  const templateIds = normalizeTemplateIds(input.templateIds);
  const templates = await requireTemplatesWithinTenant(
    templateIds,
    (templateId) => requireTemplateEntityWithinTenant(context, templateId)
  );
  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);

  for (const template of templates) {
    if (!employee.organizationId || employee.organizationId !== template.organizationId) {
      throw new ServiceError(409, "template organization and employee organization must match", {
        templateId: template.id,
        employeeId: input.employeeId
      });
    }
  }

  ensureRotationTemplatesShareWeekdaySet(templates, templateIds);

  const matchedDates = enumerateTemplateMatchedDates(input.fromDate, input.toDate, templates[0].weekdays);
  const generatedWindows = buildRotationWindowsForTemplates(templates, matchedDates);

  await ensureNoOverlapsForGeneratedWindows({
    organizationId: employee.organizationId ?? undefined,
    employeeId: input.employeeId,
    windows: generatedWindows,
    listSchedulesInPeriod: (overlapInput) => context.dataAccess.scheduling.listInPeriod(overlapInput)
  });

  const createdScheduleIds = await createSchedulesFromGeneratedWindows({
    employeeId: input.employeeId,
    windows: generatedWindows,
    createSchedule: (scheduleInput) => createWorkSchedule(context, scheduleInput)
  });

  await context.dataAccess.audit.append({
    action: "scheduling.rotation.assigned",
    entityType: "WorkSchedule",
    organizationId: employee.organizationId ?? undefined,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: input.employeeId,
      templateIds,
      fromDate: input.fromDate,
      toDate: input.toDate,
      matchedDates,
      createdScheduleIds,
      createdCount: createdScheduleIds.length
    }
  });
  await resolveSchedulingEventPublisher(context).publish({
    name: "scheduling.rotation.assigned.v1",
    occurredAt: new Date().toISOString(),
    entityType: "WorkSchedule",
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: input.employeeId,
      templateIds,
      fromDate: input.fromDate,
      toDate: input.toDate,
      matchedDates,
      createdScheduleIds,
      createdCount: createdScheduleIds.length
    }
  });

  return {
    employeeId: input.employeeId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    templateIds,
    matchedDates,
    createdScheduleIds
  };
}

export async function optimizeWorkScheduleRotation(
  context: ServiceContext,
  input: AssignRotationOptimizeInput
): Promise<RotationOptimizationResult> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule rotation optimize requires permission"
  );

  const templateIds = normalizeTemplateIds(input.templateIds);
  const templates = await requireTemplatesWithinTenant(
    templateIds,
    (templateId) => requireTemplateEntityWithinTenant(context, templateId)
  );
  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  ensureRotationTemplatesShareWeekdaySet(templates, templateIds);
  const matchedDates = enumerateTemplateMatchedDates(input.fromDate, input.toDate, templates[0].weekdays);
  const evaluation = await evaluateBestRotationForEmployee({
    employee,
    fromDate: input.fromDate,
    toDate: input.toDate,
    templates,
    matchedDates,
    advancedConstraints: undefined,
    listExistingSchedules: ({ periodStart, periodEnd, employeeId }) =>
      listWorkSchedules(context, {
        periodStart,
        periodEnd,
        employeeId
      })
  });
  const best = evaluation.best;

  let createdScheduleIds: string[] = [];
  if (input.apply) {
    const assigned = await assignWorkScheduleRotation(context, {
      employeeId: input.employeeId,
      fromDate: input.fromDate,
      toDate: input.toDate,
      templateIds: best.optimizedTemplateIds
    });
    createdScheduleIds = assigned.createdScheduleIds;
  }

  await context.dataAccess.audit.append({
    action: "scheduling.rotation.optimization.generated",
    entityType: "WorkSchedule",
    organizationId: employee.organizationId ?? undefined,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: input.employeeId,
      fromDate: input.fromDate,
      toDate: input.toDate,
      templateIds,
      optimizedTemplateIds: best.optimizedTemplateIds,
      recommendedStartOffset: best.offset,
      weekdayGap: best.weekdayGap,
      plannedMinutesGap: best.plannedMinutesGap,
      grade: best.grade,
      dryRun: !input.apply,
      createdCount: createdScheduleIds.length
    }
  });

  return {
    employeeId: input.employeeId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    dryRun: !input.apply,
    recommendedStartOffset: best.offset,
    optimizedTemplateIds: best.optimizedTemplateIds,
    matchedDates,
    score: {
      weekdayGap: best.weekdayGap,
      plannedMinutesGap: best.plannedMinutesGap,
      grade: best.grade
    },
    createdScheduleIds
  };
}

export async function listWorkScheduleRotationFairness(
  context: ServiceContext,
  input: ListRotationFairnessInput
): Promise<RotationFairnessReport> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule rotation fairness requires permission"
  );

  const tenantScope = resolveTenantScope(actor);
  if (tenantScope && input.organizationId && input.organizationId !== tenantScope) {
    throw new ServiceError(403, "cross-tenant fairness report is not allowed");
  }

  const organizationId = tenantScope ?? input.organizationId;
  if (!organizationId) {
    throw new ServiceError(400, "organizationId is required for global fairness queries");
  }

  const templateIds = normalizeTemplateIds(input.templateIds);
  const templates = await requireTemplatesWithinTenant(
    templateIds,
    (templateId) => requireTemplateEntityWithinTenant(context, templateId)
  );
  ensureRotationTemplatesShareWeekdaySet(templates, templateIds);
  const matchedDates = enumerateTemplateMatchedDates(input.fromDate, input.toDate, templates[0].weekdays);

  const allEmployees = await context.dataAccess.employees.list({
    active: true,
    organizationId
  });
  const requestedEmployeeIds = normalizeEmployeeIds(input.employeeIds);
  let scopedEmployees = allEmployees;
  if (requestedEmployeeIds) {
    const byId = new Map(allEmployees.map((employee) => [employee.id, employee]));
    const missingEmployeeIds = requestedEmployeeIds.filter((employeeId) => !byId.has(employeeId));
    if (missingEmployeeIds.length > 0) {
      throw new ServiceError(404, "employee not found in organization scope", {
        employeeIds: missingEmployeeIds
      });
    }
    scopedEmployees = requestedEmployeeIds.map((employeeId) => byId.get(employeeId)!);
  }

  const globalConstraints = normalizeRotationFairnessGlobalConstraints(input.globalConstraints);
  const advancedConstraints = normalizeRotationFairnessAdvancedConstraints(
    input.advancedConstraints,
    scopedEmployees,
    templateIds
  );
  const evaluations: EmployeeRotationOptimizationEvaluation[] = [];
  for (const employee of scopedEmployees) {
    const evaluation = await evaluateBestRotationForEmployee({
      employee,
      fromDate: input.fromDate,
      toDate: input.toDate,
      templates,
      matchedDates,
      advancedConstraints,
      listExistingSchedules: ({ periodStart, periodEnd, employeeId }) =>
        listWorkSchedules(context, {
          periodStart,
          periodEnd,
          employeeId
        })
    });
    evaluations.push(evaluation);
  }

  const selected = selectRotationFairnessRecommendations(evaluations, matchedDates, globalConstraints);
  const results: RotationFairnessEmployeeResult[] = evaluations.map((evaluation) => {
    const recommendation = selected.selectedByEmployeeId.get(evaluation.employee.id) ?? evaluation.best;
    return {
      employeeId: evaluation.employee.id,
      recommendedStartOffset: recommendation.offset,
      optimizedTemplateIds: recommendation.optimizedTemplateIds,
      matchedDates,
      score: {
        weekdayGap: recommendation.weekdayGap,
        plannedMinutesGap: recommendation.plannedMinutesGap,
        grade: recommendation.grade
      },
      advancedScore: recommendation.advancedScore
    };
  });

  results.sort((left, right) => {
    const leftAdvancedPenalty = left.advancedScore?.totalPenalty ?? 0;
    const rightAdvancedPenalty = right.advancedScore?.totalPenalty ?? 0;
    if (leftAdvancedPenalty !== rightAdvancedPenalty) {
      return rightAdvancedPenalty - leftAdvancedPenalty;
    }
    if (left.score.plannedMinutesGap !== right.score.plannedMinutesGap) {
      return right.score.plannedMinutesGap - left.score.plannedMinutesGap;
    }
    if (left.score.weekdayGap !== right.score.weekdayGap) {
      return right.score.weekdayGap - left.score.weekdayGap;
    }
    return left.employeeId.localeCompare(right.employeeId);
  });

  const maxWeekdayGap = results.length === 0 ? 0 : Math.max(...results.map((entry) => entry.score.weekdayGap));
  const maxPlannedMinutesGap =
    results.length === 0 ? 0 : Math.max(...results.map((entry) => entry.score.plannedMinutesGap));
  const avgWeekdayGap =
    results.length === 0
      ? 0
      : Number((results.reduce((sum, entry) => sum + entry.score.weekdayGap, 0) / results.length).toFixed(2));
  const avgPlannedMinutesGap =
    results.length === 0
      ? 0
      : Number(
          (results.reduce((sum, entry) => sum + entry.score.plannedMinutesGap, 0) / results.length).toFixed(2)
        );
  const grade = deriveRotationBalanceGrade(maxWeekdayGap, maxPlannedMinutesGap);
  const advancedSummary = buildRotationFairnessAdvancedSummary(results, advancedConstraints);

  await context.dataAccess.audit.append({
    action: "scheduling.rotation.fairness.report.generated",
    entityType: "WorkSchedule",
    organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      organizationId,
      fromDate: input.fromDate,
      toDate: input.toDate,
      templateIds,
      employeeCount: results.length,
      maxWeekdayGap,
      maxPlannedMinutesGap,
      avgWeekdayGap,
      avgPlannedMinutesGap,
      grade,
      global: selected.global,
      advanced: advancedSummary,
      employeeIds: results.map((entry) => entry.employeeId)
    }
  });

  return {
    organizationId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    templateIds,
    employeeCount: results.length,
    summary: {
      maxWeekdayGap,
      maxPlannedMinutesGap,
      avgWeekdayGap,
      avgPlannedMinutesGap,
      grade
    },
    global: selected.global,
    advanced: advancedSummary,
    results
  };
}

export async function applyWorkScheduleRotationFairness(
  context: ServiceContext,
  input: ListRotationFairnessInput
): Promise<RotationFairnessApplyResult> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const report = await listWorkScheduleRotationFairness(context, input);
  if (report.global?.thresholdBreached) {
    throw new ServiceError(409, "global fairness constraint threshold exceeded", {
      objective: report.global.objective,
      dailyPlannedMinutesGap: report.global.dailyPlannedMinutesGap,
      maxDailyPlannedMinutesGap: report.global.maxDailyPlannedMinutesGap
    });
  }

  const assignmentPlans: Array<{
    employeeId: string;
    organizationId: string | undefined;
    templateIds: string[];
    matchedDates: string[];
    windows: GeneratedScheduleWindow[];
  }> = [];

  for (const recommendation of report.results) {
    const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, recommendation.employeeId);
    const templates = await requireTemplatesWithinTenant(
      recommendation.optimizedTemplateIds,
      (templateId) => requireTemplateEntityWithinTenant(context, templateId)
    );
    for (const template of templates) {
      if (!employee.organizationId || employee.organizationId !== template.organizationId) {
        throw new ServiceError(409, "template organization and employee organization must match", {
          templateId: template.id,
          employeeId: recommendation.employeeId
        });
      }
    }
    assignmentPlans.push({
      employeeId: recommendation.employeeId,
      organizationId: employee.organizationId ?? undefined,
      templateIds: recommendation.optimizedTemplateIds,
      matchedDates: recommendation.matchedDates,
      windows: buildRotationWindowsForTemplates(templates, recommendation.matchedDates)
    });
  }

  // Preflight all employees before writing any schedule to reduce partial-apply risk.
  for (const plan of assignmentPlans) {
    await ensureNoOverlapsForGeneratedWindows({
      organizationId: plan.organizationId,
      employeeId: plan.employeeId,
      windows: plan.windows,
      listSchedulesInPeriod: (overlapInput) => context.dataAccess.scheduling.listInPeriod(overlapInput)
    });
  }

  const assignments: Array<{ employeeId: string; createdScheduleIds: string[] }> = [];
  for (const plan of assignmentPlans) {
    const createdScheduleIds = await createSchedulesFromGeneratedWindows({
      employeeId: plan.employeeId,
      windows: plan.windows,
      createSchedule: (scheduleInput) => createWorkSchedule(context, scheduleInput)
    });

    await context.dataAccess.audit.append({
      action: "scheduling.rotation.assigned",
      entityType: "WorkSchedule",
      organizationId: plan.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        employeeId: plan.employeeId,
        templateIds: plan.templateIds,
        fromDate: input.fromDate,
        toDate: input.toDate,
        matchedDates: plan.matchedDates,
        createdScheduleIds,
        createdCount: createdScheduleIds.length
      }
    });

    await resolveSchedulingEventPublisher(context).publish({
      name: "scheduling.rotation.assigned.v1",
      occurredAt: new Date().toISOString(),
      entityType: "WorkSchedule",
      actorRole: actor.role,
      actorId: actor.id,
      payload: {
        employeeId: plan.employeeId,
        templateIds: plan.templateIds,
        fromDate: input.fromDate,
        toDate: input.toDate,
        matchedDates: plan.matchedDates,
        createdScheduleIds,
        createdCount: createdScheduleIds.length
      }
    });

    assignments.push({
      employeeId: plan.employeeId,
      createdScheduleIds
    });
  }

  const createdSchedules = assignments.reduce((sum, assignment) => sum + assignment.createdScheduleIds.length, 0);

  await context.dataAccess.audit.append({
    action: "scheduling.rotation.fairness.applied",
    entityType: "WorkSchedule",
    organizationId: report.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      organizationId: report.organizationId,
      fromDate: report.fromDate,
      toDate: report.toDate,
      templateIds: report.templateIds,
      employeeCount: report.employeeCount,
      appliedEmployeeCount: assignments.length,
      createdSchedules,
      global: report.global,
      advanced: report.advanced,
      employeeIds: assignments.map((assignment) => assignment.employeeId)
    }
  });

  return {
    organizationId: report.organizationId,
    fromDate: report.fromDate,
    toDate: report.toDate,
    templateIds: report.templateIds,
    employeeCount: report.employeeCount,
    appliedEmployeeCount: assignments.length,
    summary: report.summary,
    global: report.global,
    advanced: report.advanced,
    assignments,
    totals: {
      createdSchedules
    }
  };
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
  const permissions = await resolveActorPermissions(context);
  const employeeId = resolveScheduleListEmployeeFilter({
    requestedEmployeeId: input.employeeId,
    actorId: actor.id,
    permissions
  });

  return await context.dataAccess.scheduling.listInPeriod(
    buildScheduleListInPeriodQueryInput({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      tenantScope,
      employeeId
    })
  );
}

export async function listWorkScheduleRotationBalance(
  context: ServiceContext,
  input: ListRotationBalanceInput
): Promise<RotationBalanceReport> {
  const actor = requireSchedulingActor(context);

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const schedules = await listWorkSchedules(context, {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    employeeId: input.employeeId
  });

  const {
    weekdays,
    activeWeekdaysCount,
    weekdayGap,
    plannedMinutesGap,
    grade,
    recommendations
  } = buildRotationBalanceSummary({ schedules });

  await context.dataAccess.audit.append({
    action: "scheduling.rotation.balance.report.generated",
    entityType: "WorkSchedule",
    organizationId: resolveTenantScope(actor) ?? undefined,
    actorRole: actor.role,
    actorId: actor.id,
    payload: buildRotationBalanceReportGeneratedAuditPayload({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      employeeId: input.employeeId,
      schedules: schedules.length,
      activeWeekdaysCount,
      weekdayGap,
      plannedMinutesGap,
      grade,
      recommendations
    })
  });

  return buildRotationBalanceReportResult({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    employeeId: input.employeeId,
    schedules: schedules.length,
    activeWeekdaysCount,
    weekdayGap,
    plannedMinutesGap,
    grade,
    weekdays,
    recommendations
  });
}

export async function listScheduleAttendanceAnomalies(
  context: ServiceContext,
  input: ListScheduleAnomaliesInput
): Promise<ScheduleAttendanceAnomalyReport> {
  const actor = requireSchedulingActor(context);
  const tenantScope = resolveSchedulingTenantScope(actor);

  const normalizedWindow = normalizeScheduleAnomalyReportWindowInput({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    lateThresholdMinutes: input.lateThresholdMinutes
  });
  const lateThresholdMinutes = normalizedWindow.lateThresholdMinutes;

  // Keep permission model strict by reusing each domain list service:
  // - scheduling list permissions/tenant rules
  // - attendance list permissions/tenant rules
  const schedules = await listWorkSchedules(context, {
    periodStart: normalizedWindow.periodStart,
    periodEnd: normalizedWindow.periodEnd,
    employeeId: input.employeeId
  });

  const attendancePeriod = buildAnomalyAttendancePeriodWindow({
    periodStart: normalizedWindow.periodStart,
    periodEnd: normalizedWindow.periodEnd
  });
  const attendances = await listAttendanceRecords(context, {
    periodStart: attendancePeriod.periodStart,
    periodEnd: attendancePeriod.periodEnd,
    employeeId: input.employeeId
  });
  const { anomalies, lateCount, noShowCount } = buildScheduleAttendanceAnomalySet(
    schedules,
    attendances,
    lateThresholdMinutes
  );
  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.report.generated",
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    payload: buildScheduleAttendanceAnomalyReportAuditPayload({
      periodStartIso: input.periodStart.toISOString(),
      periodEndIso: input.periodEnd.toISOString(),
      employeeId: input.employeeId,
      lateThresholdMinutes,
      evaluatedSchedules: schedules.length,
      anomalies: anomalies.length,
      lateCount,
      noShowCount
    })
  });

  const eventPublisher = resolveSchedulingEventPublisher(context);
  const sideEffectContext = buildScheduleAnomalySideEffectContext({
    actor: { id: actor.id, role: actor.role },
    tenantScope,
    dataAccess: context.dataAccess,
    publish: eventPublisher.publish.bind(eventPublisher)
  });
  const summarySideEffectInput = buildScheduleAnomalySummarySideEffectInput({
    window: normalizedWindow,
    lateThresholdMinutes,
    evaluatedSchedules: schedules.length,
    anomalies,
    lateCount,
    noShowCount
  });
  await emitAnomalySummarySideEffects(sideEffectContext, summarySideEffectInput);

  return buildScheduleAttendanceAnomalyReport({
    periodStart: normalizedWindow.periodStart,
    periodEnd: normalizedWindow.periodEnd,
    lateThresholdMinutes,
    evaluatedSchedules: schedules.length,
    anomalies,
    lateCount,
    noShowCount
  });
}

export async function updateScheduleAnomalyIncidentLifecycle(
  context: ServiceContext,
  input: UpdateScheduleAnomalyIncidentLifecycleInput
): Promise<ScheduleAnomalyIncidentLifecycleResult> {
  const { actor, tenantScope } = await resolveSchedulingWriteActorContext(
    context,
    "schedule anomaly incident lifecycle requires permission"
  );

  const incidentId = normalizeRequiredIncidentId(input.incidentId);
  const normalizedMutationInput = normalizeAnomalyIncidentLifecycleMutationInput({
    action: input.action,
    assigneeId: input.assigneeId,
    resolutionCode: input.resolutionCode,
    note: input.note
  });
  const updatedAt = new Date().toISOString();
  const existing = await getScheduleAnomalyIncidentReadModel(context.dataAccess, incidentId);
  if (
    existing &&
    tenantScope &&
    existing.organizationId &&
    existing.organizationId !== tenantScope
  ) {
    throw new ServiceError(404, "anomaly incident not found");
  }

  const existingStore = await context.dataAccess.scheduling.findIncidentByIncidentId(incidentId);
  const organizationId = tenantScope ?? existing?.organizationId ?? null;
  const lifecycleUpdate = buildAnomalyIncidentLifecycleUpdateResult({
    action: input.action,
    stateByAction: ANOMALY_INCIDENT_LIFECYCLE_STATE_BY_ACTION,
    existing: existing
      ? {
          assigneeId: existing.assigneeId,
          resolutionCode: existing.resolutionCode,
          note: existing.note,
          history: existing.history
        }
      : null,
    normalizedAssigneeId: normalizedMutationInput.assigneeId,
    normalizedResolutionCode: normalizedMutationInput.resolutionCode,
    normalizedNote: normalizedMutationInput.note,
    actorId: actor.id ?? null,
    actorRole: actor.role,
    updatedAt,
    maxHistory: MAX_ANOMALY_INCIDENT_HISTORY
  });

  await context.dataAccess.scheduling.upsertIncident({
    ...toScheduleAnomalyIncidentUpsertInput({
      incidentId,
      organizationId,
      state: lifecycleUpdate.state,
      assigneeId: lifecycleUpdate.assigneeId,
      resolutionCode: lifecycleUpdate.resolutionCode,
      note: lifecycleUpdate.note,
      updatedAt,
      updatedBy: {
        actorId: actor.id ?? null,
        actorRole: actor.role
      },
      history: lifecycleUpdate.history
    }),
    lastEscalationRequestedAt: existingStore?.lastEscalationRequestedAt ?? null
  });

  const payload = buildAnomalyIncidentLifecycleAuditPayload({
    incidentId,
    payload: lifecycleUpdate.payload
  });

  await context.dataAccess.audit.append({
    action: ANOMALY_INCIDENT_LIFECYCLE_AUDIT_ACTION_BY_ACTION[input.action],
    entityType: "WorkSchedule",
    entityId: incidentId,
    organizationId: organizationId ?? undefined,
    actorRole: actor.role,
    actorId: actor.id,
    payload
  });

  await resolveSchedulingEventPublisher(context).publish({
    name: "scheduling.anomaly.incident.updated.v1",
    occurredAt: updatedAt,
    entityType: "WorkSchedule",
    entityId: incidentId,
    actorRole: actor.role,
    actorId: actor.id,
    payload
  });
  return buildAnomalyIncidentLifecycleResponse(incidentId, lifecycleUpdate.historyEntry);
}

export async function listScheduleAnomalyIncidents(
  context: ServiceContext,
  input: ListScheduleAnomalyIncidentsInput
): Promise<ScheduleAnomalyIncidentListResult> {
  return listScheduleAnomalyIncidentsFromHelper(context, input);
}

export async function listScheduleAnomalyIncidentSla(
  context: ServiceContext,
  input: ListScheduleAnomalyIncidentSlaInput
): Promise<ScheduleAnomalyIncidentSlaReport> {
  const { actor, tenantScope } = await resolveSchedulingWriteActorContext(
    context,
    "schedule anomaly incident SLA requires permission"
  );

  const { topN, assigneeId, includeResolved, slaTargetMinutes, warningMinutes, asOf, asOfMillis } =
    resolveScheduleAnomalyIncidentSlaQueryInput(input);

  const readModels = await listScheduleAnomalyIncidentReadModels(context.dataAccess, {
    organizationId: tenantScope
  });

  const { matched, counts } = buildScheduleAnomalyIncidentSlaQueue({
    readModels,
    state: input.state,
    assigneeId,
    includeResolved,
    slaTargetMinutes,
    warningMinutes,
    asOfMillis
  });

  const items = matched.slice(0, topN);

  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.sla.generated",
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    payload: buildAnomalyIncidentSlaAuditPayload({
      asOfIso: asOf.toISOString(),
      state: input.state,
      assigneeId: assigneeId ?? null,
      topN,
      includeResolved,
      slaTargetMinutes,
      warningMinutes,
      counts,
      returned: items.length
    })
  });

  return buildAnomalyIncidentSlaReport({
    generatedAt: new Date().toISOString(),
    asOfIso: asOf.toISOString(),
    state: input.state,
    assigneeId: assigneeId ?? null,
    topN,
    includeResolved,
    slaTargetMinutes,
    warningMinutes,
    counts,
    items
  });
}

export async function triggerScheduleAnomalyIncidentEscalation(
  context: ServiceContext,
  input: TriggerScheduleAnomalyIncidentEscalationInput
): Promise<ScheduleAnomalyIncidentEscalationResult> {
  const { actor, tenantScope } = await resolveSchedulingWriteActorContext(
    context,
    "schedule anomaly incident escalation requires permission"
  );

  const { includeResolved, includeWarning, dryRun, cooldownMinutes, escalationChannel, asOf } =
    resolveScheduleAnomalyIncidentEscalationOptions(input);

  const slaReport = await listScheduleAnomalyIncidentSla(context, {
    state: input.state,
    assigneeId: input.assigneeId,
    topN: input.topN,
    includeResolved,
    slaTargetMinutes: input.slaTargetMinutes,
    warningMinutes: input.warningMinutes,
    asOf
  });

  const storedIncidents = await context.dataAccess.scheduling.listIncidents({
    organizationId: tenantScope
  });
  const {
    candidates,
    candidateCount,
    cooldownWindowStartMillis,
    latestRequestedAtMillisByIncident
  } = resolveScheduleAnomalyIncidentEscalationExecutionPreparation({
    items: slaReport.items,
    includeWarning,
    asOf,
    cooldownMinutes,
    storedIncidents
  });

  const executionSummary = await executeScheduleAnomalyIncidentEscalationRequests({
    candidates,
    dryRun,
    cooldownWindowStartMillis,
    cooldownMinutes,
    latestRequestedAtMillisByIncident,
    requestEscalation: async ({ candidate, requestedAt }) => {
      const payload = buildScheduleAnomalyIncidentEscalationRequestPayload({
        candidate,
        cooldownMinutes,
        escalationChannel,
        requestedAt
      });

      await resolveSchedulingEventPublisher(context).publish({
        name: "scheduling.anomaly.incident.escalation.requested.v1",
        occurredAt: requestedAt,
        entityType: "WorkSchedule",
        entityId: candidate.incidentId,
        actorRole: actor.role,
        actorId: actor.id,
        payload
      });

      await context.dataAccess.audit.append(
        buildScheduleAnomalyIncidentEscalationRequestedAuditEntry({
          organizationId: tenantScope,
          actorRole: actor.role,
          actorId: actor.id,
          payload
        })
      );

      await context.dataAccess.scheduling.markIncidentEscalationRequested({
        incidentId: candidate.incidentId,
        organizationId: tenantScope,
        requestedAt
      });
    },
    onRequestFailed: async ({ candidate, error }) => {
      await context.dataAccess.audit.append(
        buildScheduleAnomalyIncidentEscalationRequestFailedAuditEntry({
          organizationId: tenantScope,
          actorRole: actor.role,
          actorId: actor.id,
          payload: buildScheduleAnomalyIncidentEscalationRequestFailedPayload({
            candidate,
            cooldownMinutes,
            escalationChannel,
            error
          })
        })
      );
    }
  });
  const { requested, skippedCooldown, failed, items } = executionSummary;

  const requestedAt = new Date().toISOString();
  const escalationSummaryPayloadInput =
    buildScheduleAnomalyIncidentEscalationSummaryPayloadInputFromMetaAndExecution({
      escalationMeta: {
        requestedAt,
        dryRun,
        includeResolved,
        includeWarning,
        cooldownMinutes,
        escalationChannel,
        state: input.state,
        assigneeId: input.assigneeId,
        topN: input.topN,
        candidates: candidateCount
      },
      executionSummary
    });
  await context.dataAccess.audit.append(
    buildScheduleAnomalyIncidentEscalationGeneratedAuditEntry({
      organizationId: tenantScope,
      actorRole: actor.role,
      actorId: actor.id,
      payload: buildScheduleAnomalyIncidentEscalationSummaryPayload(escalationSummaryPayloadInput)
    })
  );

  return buildScheduleAnomalyIncidentEscalationResult({
    requestedAt,
    dryRun,
    slaTargetMinutes: slaReport.policy.slaTargetMinutes,
    warningMinutes: slaReport.policy.warningMinutes,
    includeResolved,
    includeWarning,
    cooldownMinutes,
    escalationChannel,
    candidates: candidateCount,
    executionSummary
  });
}

export async function executeScheduleAnomalyIncidentAutoAction(
  context: ServiceContext,
  input: ExecuteScheduleAnomalyIncidentAutoActionInput
): Promise<ScheduleAnomalyIncidentAutoActionResult> {
  const { actor, tenantScope } = await resolveSchedulingWriteActorContext(
    context,
    "schedule anomaly incident auto action requires permission"
  );

  const autoAssigneeId = normalizeAnomalyIncidentAutoAssigneeId(input.autoAssigneeId);
  const autoAssignMode = normalizeAnomalyIncidentAutoAssignMode(input.autoAssignMode);
  const autoAssignNote = normalizeAnomalyIncidentAutoAssignNote(input.autoAssignNote);

  const escalation = await triggerScheduleAnomalyIncidentEscalation(context, {
    state: input.state,
    assigneeId: input.assigneeId,
    topN: input.topN,
    includeResolved: input.includeResolved,
    includeWarning: input.includeWarning,
    slaTargetMinutes: input.slaTargetMinutes,
    warningMinutes: input.warningMinutes,
    cooldownMinutes: input.cooldownMinutes,
    asOf: input.asOf,
    escalationChannel: input.escalationChannel,
    dryRun: input.dryRun
  });
  const assignAutoActionIncident =
    buildScheduleAnomalyIncidentAutoActionAssignIncidentCallback({
      autoAssigneeId,
      autoAssignNote,
      updateLifecycle: async ({ incidentId, assigneeId, note }) => {
        const updated = await updateScheduleAnomalyIncidentLifecycle(context, {
          incidentId,
          action: "ASSIGN",
          assigneeId,
          note
        });
        return { state: updated.state, assigneeId: updated.assigneeId };
      }
    });

  const assignmentSummary = await executeScheduleAnomalyIncidentAutoActionAssignments({
    escalationItems: escalation.items,
    escalationDryRun: escalation.dryRun,
    autoAssigneeId,
    autoAssignMode,
    assignIncident: assignAutoActionIncident,
    onAssignFailed: async ({ incidentId, previousAssigneeId, escalationDecision, error }) => {
      await context.dataAccess.audit.append(
        buildScheduleAnomalyIncidentAutoActionAssignFailedAuditEntry({
          incidentId,
          previousAssigneeId,
          autoAssigneeId,
          autoAssignMode,
          escalationDecision,
          error,
          organizationId: tenantScope,
          actorRole: actor.role,
          actorId: actor.id ?? undefined
        })
      );
    }
  });
  const { assigned, skippedEscalation, skippedAssigned, failed, dryRun, items, escalated } =
    assignmentSummary;

  const executedAt = new Date().toISOString();
  const autoActionNotificationMeta = resolveScheduleAnomalyIncidentAutoActionNotificationMeta({
    dryRun: escalation.dryRun,
    executedAt,
    candidates: escalation.counts.candidates,
    escalated,
    assigned,
    failed
  });
  const summaryPayload = buildScheduleAnomalyIncidentAutoActionSummaryPayload({
    executedAt,
    state: input.state,
    assigneeId: input.assigneeId,
    topN: input.topN,
    escalation,
    autoAssigneeId,
    autoAssignMode,
    autoAssignNote,
    assignmentSummary
  });
  await context.dataAccess.audit.append(
    buildScheduleAnomalyIncidentAutoActionGeneratedAuditEntry({
      organizationId: tenantScope,
      actorRole: actor.role,
      actorId: actor.id ?? undefined,
      payload: summaryPayload
    })
  );

  await notifyScheduleAnomalyIncidentAutoActionExecution({
    ...autoActionNotificationMeta,
    summaryPayload,
    items,
    publishExecuted: buildScheduleAnomalyIncidentAutoActionExecutedEventPublisher({
      occurredAt: executedAt,
      actorRole: actor.role,
      actorId: actor.id,
      publishEvent: async (event) => {
        await resolveSchedulingEventPublisher(context).publish(event);
      }
    }),
    appendAudit: buildScheduleAnomalyIncidentAutoActionNotificationAuditAppender({
      organizationId: tenantScope,
      actorRole: actor.role,
      actorId: actor.id ?? undefined,
      appendAuditEntry: async (entry) => {
        await context.dataAccess.audit.append(entry);
      }
    })
  });

  return buildScheduleAnomalyIncidentAutoActionResult({
    executedAt,
    escalation,
    autoAssigneeId,
    autoAssignMode,
    autoAssignNote,
    assignmentSummary,
    items
  });
}

export async function archiveScheduleAnomalyIncidents(
  context: ServiceContext,
  input: ArchiveScheduleAnomalyIncidentsInput
): Promise<ScheduleAnomalyIncidentArchiveResult> {
  const { actor, tenantScope } = await resolveSchedulingWriteActorContext(
    context,
    "schedule anomaly incident archive requires permission"
  );

  const topN = normalizeIncidentListTopN(input.topN);
  const includeNonResolved = input.includeNonResolved ?? false;
  const olderThanMinutes = normalizeAnomalyIncidentArchiveOlderThanMinutes(input.olderThanMinutes);
  const archiveReason = normalizeAnomalyIncidentArchiveReason(input.reason);
  const dryRun = input.dryRun ?? false;
  const asOf = input.asOf ?? new Date();
  const asOfIso = asOf.toISOString();
  const cutoffMillis = asOf.getTime() - olderThanMinutes * 60_000;

  const stateFilter = input.state;
  const assigneeFilter = input.assigneeId?.trim() || undefined;

  const incidents = await context.dataAccess.scheduling.listIncidents({
    organizationId: tenantScope,
    state: stateFilter,
    assigneeId: assigneeFilter
  });

  const { eligible, candidates, skippedState, skippedRecent } =
    buildScheduleAnomalyIncidentArchiveCandidates({
      incidents,
      includeNonResolved,
      cutoffMillis,
      topN
    });
  const appendArchivedAudit = buildScheduleAnomalyIncidentArchivedAuditAppender({
    asOfIso,
    olderThanMinutes,
    archiveReason,
    fallbackOrganizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    appendAuditEntry: (entry) => context.dataAccess.audit.append(entry)
  });
  const deleteArchivedIncident = buildScheduleAnomalyIncidentArchiveDeleteIncidentCallback({
    organizationId: tenantScope,
    deleteIncident: (deleteInput) => context.dataAccess.scheduling.deleteIncident(deleteInput)
  });
  const archiveActionsInput = buildScheduleAnomalyIncidentArchiveActionsInput({
    candidates,
    dryRun,
    deleteIncident: deleteArchivedIncident,
    onArchived: appendArchivedAudit
  });

  const { archived, dryRunCount, failed, items } =
    await executeScheduleAnomalyIncidentArchiveActions(archiveActionsInput);

  const archivedAt = new Date().toISOString();
  const archiveMeta = resolveScheduleAnomalyIncidentArchiveMeta({
    archivedAt,
    dryRun,
    asOfIso,
    olderThanMinutes,
    includeNonResolved,
    stateFilter,
    assigneeFilter,
    topN,
    archiveReason,
    total: incidents.length,
    eligible: eligible.length,
    candidates: candidates.length
  });
  const archiveSummary = buildScheduleAnomalyIncidentArchiveSummaryCounts({
    archived,
    dryRunCount,
    failed
  });
  await context.dataAccess.audit.append(
    buildScheduleAnomalyIncidentArchiveGeneratedAuditEntry({
      organizationId: tenantScope,
      actorRole: actor.role,
      actorId: actor.id,
      payload: buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload({
        ...archiveMeta,
        summary: archiveSummary,
        skippedState,
        skippedRecent
      })
    })
  );
  return buildScheduleAnomalyIncidentArchiveResult({
    ...archiveMeta,
    summary: { ...archiveSummary, items },
    skippedState,
    skippedRecent
  });
}

export async function replayScheduleAnomalyIncidentStore(
  context: ServiceContext,
  input: ReplayScheduleAnomalyIncidentStoreInput
): Promise<ScheduleAnomalyIncidentReplayResult> {
  const { actor, tenantScope } = await resolveSchedulingWriteActorContext(
    context,
    "schedule anomaly incident replay requires permission"
  );

  const topN = normalizeAnomalyIncidentReplayTopN(input.topN);
  const normalizedIncidentIds = normalizeAnomalyIncidentReplayIncidentIds(input.incidentIds);
  if (input.from && input.to && input.to < input.from) {
    throw new ServiceError(400, "to must be greater than or equal to from");
  }

  const dryRun = input.dryRun ?? false;
  const includeArchived = input.includeArchived ?? false;

  const logs = await context.dataAccess.audit.list(
    buildScheduleAnomalyIncidentReplayAuditListInput({
      actions: ANOMALY_INCIDENT_PROJECTION_AUDIT_ACTIONS,
      organizationId: tenantScope,
      limit: MAX_ANOMALY_INCIDENT_AUDIT_ROWS
    })
  );
  const logsInRange = filterScheduleAnomalyIncidentReplayLogsByRange({
    logs,
    from: input.from,
    to: input.to
  });
  const replayModels = buildScheduleAnomalyIncidentReadModelsFromAuditLogs(logsInRange, {
    applyArchiveActions: !includeArchived
  });

  const { replayModelById, selectedIncidentIds } = selectScheduleAnomalyIncidentReplayTargets({
    replayModels,
    incidentIds: normalizedIncidentIds,
    topN
  });
  const replayOnReplay = buildScheduleAnomalyIncidentReplayOnReplayCallback({
    includeArchived,
    fallbackOrganizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    findIncidentByIncidentId: (incidentId) =>
      context.dataAccess.scheduling.findIncidentByIncidentId(incidentId),
    upsertIncident: async (upsertInput) => {
      await context.dataAccess.scheduling.upsertIncident(upsertInput);
    },
    appendAuditEntry: (entry) => context.dataAccess.audit.append(entry),
    toUpsertInput: toScheduleAnomalyIncidentUpsertInput
  });

  const { replayed, dryRunCount, notFound, failed, items } =
    await executeScheduleAnomalyIncidentReplayActions({
      selectedIncidentIds,
      replayModelById,
      dryRun,
      onReplay: replayOnReplay
    });

  const replayMeta = resolveScheduleAnomalyIncidentReplayMetaFromServiceInput({
    dryRun,
    includeArchived,
    from: input.from,
    to: input.to,
    topN,
    incidentIds: normalizedIncidentIds,
    selectedIncidentIds
  });
  const replaySummary = buildScheduleAnomalyIncidentReplaySummaryCounts({
    replayed,
    dryRunCount,
    notFound,
    failed
  });
  const replayGeneratedAuditPayloadInput =
    buildScheduleAnomalyIncidentReplayGeneratedAuditPayloadInputFromMetaAndSummary({
      replayMeta,
      replaySummary
    });
  await context.dataAccess.audit.append(
    buildScheduleAnomalyIncidentReplayGeneratedAuditEntry({
      organizationId: tenantScope,
      actorRole: actor.role,
      actorId: actor.id,
      payload: buildScheduleAnomalyIncidentReplayGeneratedAuditPayload(
        replayGeneratedAuditPayloadInput
      )
    })
  );

  return buildScheduleAnomalyIncidentReplayResult({
    ...replayMeta,
    summary: buildScheduleAnomalyIncidentReplayResultSummary({
      replaySummary,
      items
    })
  });
}

export async function reconcileScheduleAnomalyIncidentStore(
  context: ServiceContext,
  input: ReconcileScheduleAnomalyIncidentStoreInput
): Promise<ScheduleAnomalyIncidentReconcileResult> {
  const { actor, tenantScope } = await resolveSchedulingWriteActorContext(
    context,
    "schedule anomaly incident reconciliation requires permission"
  );

  const topN = normalizeReconcileTopN(input.topN);
  const includeMatching = input.includeMatching ?? false;

  const storeRows = await context.dataAccess.scheduling.listIncidents({
    organizationId: tenantScope
  });
  const auditRows = await listScheduleAnomalyIncidentReadModelsFromAudit(
    context.dataAccess.audit,
    buildScheduleAnomalyIncidentReconcileAuditReadInput({
      organizationId: tenantScope
    })
  );

  const { compared, counts } = buildScheduleAnomalyIncidentReconcileSnapshot(
    buildScheduleAnomalyIncidentReconcileSnapshotInputFromRows({
      storeRows,
      auditRows
    })
  );

  const reconciledAt = new Date().toISOString();
  const reconcileMeta = resolveScheduleAnomalyIncidentReconcileMeta({
    reconciledAt,
    topN,
    includeMatching
  });
  const items = selectScheduleAnomalyIncidentReconcileItems(compared, {
    includeMatching,
    topN
  });
  const reconcileSummary = buildScheduleAnomalyIncidentReconcileSummary({
    compared: compared.length,
    returned: items.length,
    counts
  });
  const reconcileGeneratedAuditPayloadInput =
    buildScheduleAnomalyIncidentReconcileGeneratedAuditPayloadInputFromMetaAndSummary({
      reconcileMeta,
      reconcileSummary
    });

  await context.dataAccess.audit.append(
    buildScheduleAnomalyIncidentReconcileGeneratedAuditEntry({
      organizationId: tenantScope,
      actorRole: actor.role,
      actorId: actor.id,
      payload: buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload(
        reconcileGeneratedAuditPayloadInput
      )
    })
  );
  return buildScheduleAnomalyIncidentReconcileResult(
    buildScheduleAnomalyIncidentReconcileResultInputFromMetaAndRows({
      reconcileMeta,
      counts,
      items
    })
  );
}

export async function getScheduleAnomalyIncident(
  context: ServiceContext,
  incidentId: string
): Promise<ScheduleAnomalyIncidentReadModel> {
  return getScheduleAnomalyIncidentFromHelper(context, incidentId);
}

export async function listScheduleAttendanceAnomalyCockpit(
  context: ServiceContext,
  input: ListScheduleAnomalyCockpitInput
): Promise<ScheduleAttendanceAnomalyCockpitReport> {
  const { actor, tenantScope } = await resolveSchedulingWriteActorContext(
    context,
    "schedule anomaly cockpit requires permission"
  );

  const normalizedWindow = normalizeScheduleAnomalyCockpitWindowInput({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    lateThresholdMinutes: input.lateThresholdMinutes,
    topN: input.topN
  });
  const lateThresholdMinutes = normalizedWindow.lateThresholdMinutes;
  const topN = normalizedWindow.topN;

  const schedules = await context.dataAccess.scheduling.listInPeriod({
    periodStart: normalizedWindow.periodStart,
    periodEnd: normalizedWindow.periodEnd,
    organizationId: tenantScope
  });

  const attendancePeriod = buildAnomalyAttendancePeriodWindow({
    periodStart: normalizedWindow.periodStart,
    periodEnd: normalizedWindow.periodEnd
  });
  const attendances = await context.dataAccess.attendance.listInPeriod({
    periodStart: attendancePeriod.periodStart,
    periodEnd: attendancePeriod.periodEnd,
    organizationId: tenantScope
  });

  const { anomalies, lateCount, noShowCount, employees, queue, severities } =
    buildScheduleAttendanceAnomalyCockpitProjection(
      schedules,
      attendances,
      lateThresholdMinutes,
      topN
    );
  const generatedAt = new Date().toISOString();

  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.cockpit.generated",
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    payload: buildScheduleAttendanceAnomalyCockpitAuditPayload({
      periodStartIso: input.periodStart.toISOString(),
      periodEndIso: input.periodEnd.toISOString(),
      lateThresholdMinutes,
      topN,
      evaluatedSchedules: schedules.length,
      anomalies: anomalies.length,
      lateCount,
      noShowCount,
      employeeCount: employees.length,
      severities,
      generatedAt
    })
  });

  if (!input.suppressAutomation) {
    const eventPublisher = resolveSchedulingEventPublisher(context);
    const sideEffectContext = buildScheduleAnomalySideEffectContext({
      actor: { id: actor.id, role: actor.role },
      tenantScope,
      dataAccess: context.dataAccess,
      publish: eventPublisher.publish.bind(eventPublisher)
    });
    const ticketSideEffectInput = buildScheduleAnomalyTicketSideEffectInput({
      window: normalizedWindow,
      lateThresholdMinutes,
      topN,
      queue
    });
    await emitAnomalyCockpitTicketRequestsIfEnabled(
      sideEffectContext,
      ticketSideEffectInput
    );
  }

  return buildScheduleAttendanceAnomalyCockpitReport({
    periodStart: normalizedWindow.periodStart,
    periodEnd: normalizedWindow.periodEnd,
    lateThresholdMinutes,
    generatedAt,
    evaluatedSchedules: schedules.length,
    anomalies,
    lateCount,
    noShowCount,
    severities,
    employees,
    queue
  });
}


