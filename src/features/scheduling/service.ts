import type { Actor } from "@/lib/actor";
import { requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  CreateWorkScheduleTemplateInput,
  CreateWorkScheduleInput,
  DataAccess,
  EmployeeEntity,
  UpdateWorkScheduleInput,
  WorkScheduleTemplateEntity,
  WorkScheduleEntity
} from "@/features/shared/data-access";
import { listAttendanceRecords } from "@/features/attendance/service";
import {
  ANOMALY_INCIDENT_ARCHIVE_AUDIT_ACTION,
  ANOMALY_INCIDENT_LIFECYCLE_AUDIT_ACTION_BY_ACTION,
  ANOMALY_INCIDENT_LIFECYCLE_STATE_BY_ACTION,
  ANOMALY_INCIDENT_PROJECTION_AUDIT_ACTIONS,
  ANOMALY_INCIDENT_REPLAY_AUDIT_ACTION,
  buildScheduleAnomalyIncidentReadModelsFromAuditLogs
} from "@/features/scheduling/incident-audit-projection";
import {
  buildScheduleAttendanceAnomalySet
} from "@/features/scheduling/anomaly-report-helpers";
import { buildScheduleAttendanceAnomalyCockpitProjection } from "@/features/scheduling/anomaly-cockpit-report-helpers";
import type {
  ScheduleAnomalyCockpitQueueEntry,
  ScheduleAttendanceAnomaly,
  ScheduleAttendanceAnomalyCockpitReport,
  ScheduleAttendanceAnomalyReport
} from "@/features/scheduling/anomaly-report-helpers";
import {
  buildAnomalyAlertPayload,
  buildAnomalyEscalationPayload,
  buildAnomalyTicketRequestPayload,
  isSchedulingAnomalyAlertsEnabled,
  isSchedulingAnomalyEscalationEnabled,
  isSchedulingAnomalyTicketAutomationEnabled,
  parseAnomalySeverityFromEnv,
  parsePositiveIntegerRangeFromEnv,
  type AnomalyEscalationSeverity
} from "@/features/scheduling/anomaly-automation-helpers";
import {
  buildScheduleAnomalyIncidentAutoActionResult,
  buildScheduleAnomalyIncidentAutoActionSummaryPayload,
  executeScheduleAnomalyIncidentAutoActionAssignments,
  notifyScheduleAnomalyIncidentAutoActionExecution
} from "@/features/scheduling/anomaly-incident-auto-action-helpers";
import {
  buildScheduleAnomalyIncidentArchiveCandidates,
  executeScheduleAnomalyIncidentArchiveActions
} from "@/features/scheduling/anomaly-incident-archive-helpers";
import {
  buildScheduleAnomalyIncidentSlaQueue
} from "@/features/scheduling/anomaly-incident-queue-helpers";
import {
  executeScheduleAnomalyIncidentReplayActions,
  selectScheduleAnomalyIncidentReplayTargets
} from "@/features/scheduling/anomaly-incident-replay-helpers";
import {
  buildRotationFairnessAdvancedSummary,
  selectRotationFairnessRecommendations
} from "@/features/scheduling/rotation-fairness-selection-helpers";
import {
  buildRotationOffsetEvaluation,
  sortRotationOffsetEvaluations,
  type RotationOffsetEvaluation as RotationOffsetEvaluationBase
} from "@/features/scheduling/rotation-optimization-evaluation-helpers";
import {
  buildAnomalyIncidentLifecycleUpdateResult,
  buildAnomalyIncidentListAuditPayload,
  buildAnomalyIncidentSlaAuditPayload,
  buildAnomalyIncidentSlaReport,
  normalizeAnomalyIncidentLifecycleMutationInput
} from "@/features/scheduling/anomaly-incident-core-helpers";
import {
  enumerateTemplateMatchedDates,
  formatKstDateYmd,
  parseDateToKstBase,
  weekdayFromKstDate,
  weekdayFromKstDateTime
} from "@/features/scheduling/template-date-helpers";
import {
  buildRotationWindowsForTemplates,
  buildScheduleWindowFromTemplateDate,
  buildTemplateRangeWindows,
  rotateTemplatesByOffset,
  type GeneratedScheduleWindow
} from "@/features/scheduling/rotation-window-helpers";
import {
  buildScheduleAnomalyIncidentReconcileSnapshot,
  selectScheduleAnomalyIncidentReconcileItems
} from "@/features/scheduling/anomaly-incident-reconcile-helpers";
import { resolveScheduleAnomalyIncidentForActor } from "@/features/scheduling/anomaly-incident-read-helpers";
import {
  buildLatestScheduleAnomalyEscalationRequestedAtMillisByIncident,
  executeScheduleAnomalyIncidentEscalationRequests
} from "@/features/scheduling/anomaly-incident-escalation-helpers";
import { buildScheduleAnomalyIncidentListResult } from "@/features/scheduling/anomaly-incident-list-helpers";
import {
  isWithinOptionalCreatedAtRange,
  normalizeAnomalyIncidentArchiveOlderThanMinutes,
  normalizeAnomalyIncidentArchiveReason,
  normalizeAnomalyIncidentEscalationChannel,
  normalizeAnomalyIncidentEscalationCooldownMinutes,
  normalizeAnomalyIncidentReplayIncidentIds,
  normalizeAnomalyIncidentReplayTopN,
  normalizeIncidentListTopN,
  normalizeReconcileTopN,
  resolveAnomalyIncidentSlaTargetMinutes,
  resolveAnomalyIncidentWarningMinutes
} from "@/features/scheduling/incident-normalizers";
import {
  MAX_ANOMALY_INCIDENT_AUDIT_ROWS,
  MAX_ANOMALY_INCIDENT_HISTORY,
  cloneScheduleAnomalyIncidentReadModel,
  getScheduleAnomalyIncidentReadModel,
  listScheduleAnomalyIncidentReadModels,
  listScheduleAnomalyIncidentReadModelsFromAudit,
  normalizeAnomalyIncidentAutoAssigneeId,
  normalizeAnomalyIncidentAutoAssignMode,
  normalizeAnomalyIncidentAutoAssignNote,
  toScheduleAnomalyIncidentUpsertInput
} from "@/features/scheduling/incident-read-model-helpers";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

export type {
  ScheduleAnomalyCockpitQueueEntry,
  ScheduleAttendanceAnomaly,
  ScheduleAttendanceAnomalyCockpitReport,
  ScheduleAttendanceAnomalyReport,
  ScheduleAttendanceAnomalyType
} from "@/features/scheduling/anomaly-report-helpers";

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

type ListScheduleAnomalyCockpitInput = {
  periodStart: Date;
  periodEnd: Date;
  lateThresholdMinutes?: number;
  topN?: number;
  suppressAutomation?: boolean;
};

type ListRotationBalanceInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
};

type ListRotationFairnessInput = {
  organizationId?: string;
  fromDate: string;
  toDate: string;
  templateIds: string[];
  employeeIds?: string[];
  globalConstraints?: RotationFairnessGlobalConstraintsInput;
  advancedConstraints?: RotationFairnessAdvancedConstraintsInput;
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

type AssignTemplateRangeInput = {
  templateId: string;
  employeeId: string;
  fromDate: string;
  toDate: string;
};

export type TemplateRangeAssignmentResult = {
  templateId: string;
  employeeId: string;
  fromDate: string;
  toDate: string;
  matchedDates: string[];
  createdScheduleIds: string[];
};

type AssignRotationInput = {
  employeeId: string;
  fromDate: string;
  toDate: string;
  templateIds: string[];
};

type AssignRotationOptimizeInput = {
  employeeId: string;
  fromDate: string;
  toDate: string;
  templateIds: string[];
  apply: boolean;
};

export type RotationAssignmentResult = {
  employeeId: string;
  fromDate: string;
  toDate: string;
  templateIds: string[];
  matchedDates: string[];
  createdScheduleIds: string[];
};

export type RotationOptimizationResult = {
  employeeId: string;
  fromDate: string;
  toDate: string;
  dryRun: boolean;
  recommendedStartOffset: number;
  optimizedTemplateIds: string[];
  matchedDates: string[];
  score: {
    weekdayGap: number;
    plannedMinutesGap: number;
    grade: RotationBalanceGrade;
  };
  createdScheduleIds: string[];
};

export type ScheduleAnomalyIncidentLifecycleAction = "ACKNOWLEDGE" | "ASSIGN" | "RESOLVE";
export type ScheduleAnomalyIncidentLifecycleState = "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
export type ScheduleAnomalyIncidentResolutionCode =
  | "FALSE_POSITIVE"
  | "ATTENDANCE_CORRECTED"
  | "MANUAL_CONFIRMED"
  | "OTHER";

type UpdateScheduleAnomalyIncidentLifecycleInput = {
  incidentId: string;
  action: ScheduleAnomalyIncidentLifecycleAction;
  assigneeId?: string;
  note?: string;
  resolutionCode?: ScheduleAnomalyIncidentResolutionCode;
};

export type ScheduleAnomalyIncidentLifecycleResult = {
  incidentId: string;
  action: ScheduleAnomalyIncidentLifecycleAction;
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
  resolutionCode: ScheduleAnomalyIncidentResolutionCode | null;
  note: string | null;
  updatedAt: string;
  updatedBy: {
    actorId: string | null;
    actorRole: string;
  };
};

type ListScheduleAnomalyIncidentsInput = {
  state?: ScheduleAnomalyIncidentLifecycleState;
  assigneeId?: string;
  topN?: number;
};

type ListScheduleAnomalyIncidentSlaInput = {
  state?: ScheduleAnomalyIncidentLifecycleState;
  assigneeId?: string;
  topN?: number;
  includeResolved?: boolean;
  slaTargetMinutes?: number;
  warningMinutes?: number;
  asOf?: Date;
};

type TriggerScheduleAnomalyIncidentEscalationInput = {
  state?: ScheduleAnomalyIncidentLifecycleState;
  assigneeId?: string;
  topN?: number;
  includeResolved?: boolean;
  includeWarning?: boolean;
  slaTargetMinutes?: number;
  warningMinutes?: number;
  cooldownMinutes?: number;
  asOf?: Date;
  escalationChannel?: string;
  dryRun?: boolean;
};

export type ScheduleAnomalyIncidentAutoAssignMode = "ASSIGN_IF_UNASSIGNED" | "FORCE_ASSIGN";

type ExecuteScheduleAnomalyIncidentAutoActionInput = {
  state?: ScheduleAnomalyIncidentLifecycleState;
  assigneeId?: string;
  topN?: number;
  includeResolved?: boolean;
  includeWarning?: boolean;
  slaTargetMinutes?: number;
  warningMinutes?: number;
  cooldownMinutes?: number;
  asOf?: Date;
  escalationChannel?: string;
  dryRun?: boolean;
  autoAssigneeId: string;
  autoAssignMode?: ScheduleAnomalyIncidentAutoAssignMode;
  autoAssignNote?: string;
};

type ArchiveScheduleAnomalyIncidentsInput = {
  state?: ScheduleAnomalyIncidentLifecycleState;
  assigneeId?: string;
  topN?: number;
  includeNonResolved?: boolean;
  olderThanMinutes?: number;
  asOf?: Date;
  dryRun?: boolean;
  reason?: string;
};

type ReplayScheduleAnomalyIncidentStoreInput = {
  incidentIds?: string[];
  topN?: number;
  from?: Date;
  to?: Date;
  dryRun?: boolean;
  includeArchived?: boolean;
};

type ReconcileScheduleAnomalyIncidentStoreInput = {
  topN?: number;
  includeMatching?: boolean;
};

export type ScheduleAnomalyIncidentHistoryEntry = {
  action: ScheduleAnomalyIncidentLifecycleAction;
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
  resolutionCode: ScheduleAnomalyIncidentResolutionCode | null;
  note: string | null;
  updatedAt: string;
  updatedBy: {
    actorId: string | null;
    actorRole: string;
  };
};

export type ScheduleAnomalyIncidentReadModel = {
  incidentId: string;
  organizationId: string | null;
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
  resolutionCode: ScheduleAnomalyIncidentResolutionCode | null;
  note: string | null;
  updatedAt: string;
  updatedBy: {
    actorId: string | null;
    actorRole: string;
  };
  history: ScheduleAnomalyIncidentHistoryEntry[];
};

export type ScheduleAnomalyIncidentListResult = {
  total: number;
  items: ScheduleAnomalyIncidentReadModel[];
};

export type ScheduleAnomalyIncidentSlaStatus = "HEALTHY" | "WARNING" | "BREACHED" | "RESOLVED";

export type ScheduleAnomalyIncidentSlaItem = {
  incidentId: string;
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
  updatedAt: string;
  elapsedMinutes: number;
  slaTargetMinutes: number;
  warningMinutes: number;
  status: ScheduleAnomalyIncidentSlaStatus;
  updatedBy: {
    actorId: string | null;
    actorRole: string;
  };
  historyCount: number;
};

export type ScheduleAnomalyIncidentSlaReport = {
  generatedAt: string;
  asOf: string;
  policy: {
    slaTargetMinutes: number;
    warningMinutes: number;
    includeResolved: boolean;
  };
  filters: {
    state: ScheduleAnomalyIncidentLifecycleState | null;
    assigneeId: string | null;
    topN: number;
  };
  counts: {
    total: number;
    open: number;
    healthy: number;
    warning: number;
    breached: number;
    resolved: number;
  };
  items: ScheduleAnomalyIncidentSlaItem[];
};

export type ScheduleAnomalyIncidentEscalationDecision =
  | "REQUESTED"
  | "SKIPPED_COOLDOWN"
  | "FAILED"
  | "DRY_RUN";

export type ScheduleAnomalyIncidentEscalationItem = {
  incidentId: string;
  state: ScheduleAnomalyIncidentLifecycleState;
  status: ScheduleAnomalyIncidentSlaStatus;
  elapsedMinutes: number;
  assigneeId: string | null;
  decision: ScheduleAnomalyIncidentEscalationDecision;
  reason: string | null;
};

export type ScheduleAnomalyIncidentEscalationResult = {
  requestedAt: string;
  dryRun: boolean;
  policy: {
    slaTargetMinutes: number;
    warningMinutes: number;
    includeResolved: boolean;
    includeWarning: boolean;
    cooldownMinutes: number;
    escalationChannel: string;
  };
  counts: {
    candidates: number;
    requested: number;
    skippedCooldown: number;
    failed: number;
  };
  items: ScheduleAnomalyIncidentEscalationItem[];
};

export type ScheduleAnomalyIncidentAutoActionDecision =
  | "ASSIGNED"
  | "SKIPPED_ESCALATION"
  | "SKIPPED_ALREADY_ASSIGNED"
  | "SKIPPED_SAME_ASSIGNEE"
  | "FAILED"
  | "DRY_RUN";

export type ScheduleAnomalyIncidentAutoActionItem = {
  incidentId: string;
  state: ScheduleAnomalyIncidentLifecycleState;
  status: ScheduleAnomalyIncidentSlaStatus;
  escalationDecision: ScheduleAnomalyIncidentEscalationDecision;
  previousAssigneeId: string | null;
  assignedAssigneeId: string | null;
  decision: ScheduleAnomalyIncidentAutoActionDecision;
  reason: string | null;
};

export type ScheduleAnomalyIncidentAutoActionResult = {
  executedAt: string;
  dryRun: boolean;
  policy: {
    slaTargetMinutes: number;
    warningMinutes: number;
    includeResolved: boolean;
    includeWarning: boolean;
    cooldownMinutes: number;
    escalationChannel: string;
    autoAssigneeId: string;
    autoAssignMode: ScheduleAnomalyIncidentAutoAssignMode;
    autoAssignNote: string | null;
  };
  counts: {
    candidates: number;
    escalated: number;
    assigned: number;
    skippedEscalation: number;
    skippedAssigned: number;
    failed: number;
    dryRun: number;
  };
  items: ScheduleAnomalyIncidentAutoActionItem[];
};

export type ScheduleAnomalyIncidentArchiveDecision =
  | "ARCHIVED"
  | "DRY_RUN"
  | "FAILED";

export type ScheduleAnomalyIncidentArchiveItem = {
  incidentId: string;
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
  updatedAt: string;
  decision: ScheduleAnomalyIncidentArchiveDecision;
  reason: string | null;
};

export type ScheduleAnomalyIncidentArchiveResult = {
  archivedAt: string;
  dryRun: boolean;
  policy: {
    olderThanMinutes: number;
    includeNonResolved: boolean;
    reason: string | null;
  };
  filters: {
    state: ScheduleAnomalyIncidentLifecycleState | null;
    assigneeId: string | null;
    topN: number;
  };
  counts: {
    total: number;
    eligible: number;
    candidates: number;
    archived: number;
    dryRun: number;
    skippedState: number;
    skippedRecent: number;
    failed: number;
  };
  items: ScheduleAnomalyIncidentArchiveItem[];
};

export type ScheduleAnomalyIncidentReplayDecision =
  | "REPLAYED"
  | "DRY_RUN"
  | "NOT_FOUND"
  | "FAILED";

export type ScheduleAnomalyIncidentReplayItem = {
  incidentId: string;
  state: ScheduleAnomalyIncidentLifecycleState | null;
  historyCount: number;
  decision: ScheduleAnomalyIncidentReplayDecision;
  reason: string | null;
};

export type ScheduleAnomalyIncidentReplayResult = {
  replayedAt: string;
  dryRun: boolean;
  policy: {
    includeArchived: boolean;
    from: string | null;
    to: string | null;
  };
  filters: {
    topN: number;
    incidentIds: string[] | null;
  };
  counts: {
    requested: number;
    replayed: number;
    dryRun: number;
    notFound: number;
    failed: number;
  };
  items: ScheduleAnomalyIncidentReplayItem[];
};

export type ScheduleAnomalyIncidentReconcileStatus =
  | "MATCH"
  | "STORE_MISSING"
  | "ORPHANED_STORE"
  | "FIELD_MISMATCH";

export type ScheduleAnomalyIncidentReconcileItem = {
  incidentId: string;
  status: ScheduleAnomalyIncidentReconcileStatus;
  fields: string[];
  storeState: ScheduleAnomalyIncidentLifecycleState | null;
  auditState: ScheduleAnomalyIncidentLifecycleState | null;
  storeHistoryCount: number;
  auditHistoryCount: number;
};

export type ScheduleAnomalyIncidentReconcileResult = {
  reconciledAt: string;
  filters: {
    topN: number;
    includeMatching: boolean;
  };
  counts: {
    total: number;
    match: number;
    storeMissing: number;
    orphanedStore: number;
    fieldMismatch: number;
  };
  items: ScheduleAnomalyIncidentReconcileItem[];
};

export type RotationBalanceGrade = "BALANCED" | "MODERATE" | "IMBALANCED";
export type RotationFairnessGlobalObjective = "MINIMIZE_DAILY_PLANNED_MINUTES_GAP";

type RotationFairnessGlobalConstraintsInput = {
  objective?: RotationFairnessGlobalObjective;
  maxDailyPlannedMinutesGap?: number;
};

type RotationFairnessPreferenceRuleInput = {
  employeeId: string;
  preferredTemplateIds?: string[];
  avoidTemplateIds?: string[];
};

type RotationFairnessAdvancedConstraintsInput = {
  preference?: {
    weight?: number;
    rules: RotationFairnessPreferenceRuleInput[];
  };
  laborLaw?: {
    weight?: number;
    minRestMinutesBetweenShifts?: number;
    maxConsecutiveWorkDays?: number;
  };
};

type RotationFairnessAdvancedConstraints = {
  preference:
    | {
        weight: number;
        rulesByEmployeeId: Map<
          string,
          {
            preferredTemplateIds: Set<string>;
            avoidTemplateIds: Set<string>;
          }
        >;
      }
    | null;
  laborLaw:
    | {
        weight: number;
        minRestMinutesBetweenShifts: number | null;
        maxConsecutiveWorkDays: number | null;
      }
    | null;
};

export type RotationFairnessAdvancedScore = {
  preferencePenalty: number;
  laborLawPenalty: number;
  totalPenalty: number;
  preferenceMismatchCount: number;
  avoidTemplateViolationCount: number;
  minRestViolationCount: number;
  maxConsecutiveWorkDayViolationCount: number;
};

export type RotationFairnessAdvancedSummary = {
  enabled: boolean;
  preferenceWeight: number | null;
  laborLawWeight: number | null;
  totalPreferencePenalty: number;
  totalLaborLawPenalty: number;
  totalPenalty: number;
  totalPreferenceMismatchCount: number;
  totalAvoidTemplateViolationCount: number;
  totalMinRestViolationCount: number;
  totalMaxConsecutiveWorkDayViolationCount: number;
};

export type RotationFairnessGlobalSummary = {
  objective: RotationFairnessGlobalObjective;
  dailyPlannedMinutesGap: number;
  maxDailyPlannedMinutesGap: number | null;
  thresholdBreached: boolean;
  dailyPlannedMinutes: Array<{
    date: string;
    plannedMinutes: number;
  }>;
};

export type RotationBalanceReport = {
  periodStart: Date;
  periodEnd: Date;
  employeeId: string | null;
  counts: {
    schedules: number;
    activeWeekdays: number;
    weekdayGap: number;
    plannedMinutesGap: number;
    grade: RotationBalanceGrade;
  };
  weekdays: Array<{
    weekday: number;
    scheduleCount: number;
    plannedMinutes: number;
  }>;
  recommendations: string[];
};

export type RotationFairnessEmployeeResult = {
  employeeId: string;
  recommendedStartOffset: number;
  optimizedTemplateIds: string[];
  matchedDates: string[];
  score: {
    weekdayGap: number;
    plannedMinutesGap: number;
    grade: RotationBalanceGrade;
  };
  advancedScore: RotationFairnessAdvancedScore | null;
};

export type RotationFairnessReport = {
  organizationId: string;
  fromDate: string;
  toDate: string;
  templateIds: string[];
  employeeCount: number;
  summary: {
    maxWeekdayGap: number;
    maxPlannedMinutesGap: number;
    avgWeekdayGap: number;
    avgPlannedMinutesGap: number;
    grade: RotationBalanceGrade;
  };
  global: RotationFairnessGlobalSummary | null;
  advanced: RotationFairnessAdvancedSummary | null;
  results: RotationFairnessEmployeeResult[];
};

export type RotationFairnessApplyResult = {
  organizationId: string;
  fromDate: string;
  toDate: string;
  templateIds: string[];
  employeeCount: number;
  appliedEmployeeCount: number;
  summary: RotationFairnessReport["summary"];
  global: RotationFairnessGlobalSummary | null;
  advanced: RotationFairnessAdvancedSummary | null;
  assignments: Array<{
    employeeId: string;
    createdScheduleIds: string[];
  }>;
  totals: {
    createdSchedules: number;
  };
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

function normalizeTopN(value: number | undefined) {
  const normalized = value ?? 20;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 200) {
    throw new ServiceError(400, "topN must be an integer in range 1..200");
  }
  return normalized;
}

async function emitAnomalyAlertIfEnabled(
  context: ServiceContext,
  actor: Actor,
  input: ListScheduleAnomaliesInput,
  lateThresholdMinutes: number,
  evaluatedSchedules: number,
  anomalies: ScheduleAttendanceAnomaly[],
  lateCount: number,
  noShowCount: number
) {
  if (!isSchedulingAnomalyAlertsEnabled() || anomalies.length === 0) {
    return;
  }

  const payload = buildAnomalyAlertPayload(
    input,
    lateThresholdMinutes,
    evaluatedSchedules,
    anomalies,
    lateCount,
    noShowCount
  );

  try {
    await getEventPublisher(context).publish({
      name: "scheduling.anomaly.detected.v1",
      occurredAt: new Date().toISOString(),
      entityType: "WorkSchedule",
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });

    await context.dataAccess.audit.append({
      action: "scheduling.anomaly.alert.triggered",
      entityType: "WorkSchedule",
      organizationId: resolveTenantScope(actor) ?? undefined,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
  } catch (error) {
    try {
      await context.dataAccess.audit.append({
        action: "scheduling.anomaly.alert.failed",
        entityType: "WorkSchedule",
        organizationId: resolveTenantScope(actor) ?? undefined,
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          ...payload,
          error: error instanceof Error ? error.message : "unknown error"
        }
      });
    } catch {
      // Non-blocking path: do not fail anomaly report API on alert side-effects.
    }
  }
}

async function emitAnomalyEscalationIfEnabled(
  context: ServiceContext,
  actor: Actor,
  input: ListScheduleAnomaliesInput,
  lateThresholdMinutes: number,
  evaluatedSchedules: number,
  anomalies: ScheduleAttendanceAnomaly[],
  lateCount: number,
  noShowCount: number
) {
  if (!isSchedulingAnomalyEscalationEnabled() || anomalies.length === 0) {
    return;
  }

  const payload = buildAnomalyEscalationPayload(
    input,
    lateThresholdMinutes,
    evaluatedSchedules,
    anomalies,
    lateCount,
    noShowCount
  );

  try {
    await getEventPublisher(context).publish({
      name: "scheduling.anomaly.escalated.v1",
      occurredAt: new Date().toISOString(),
      entityType: "WorkSchedule",
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });

    await context.dataAccess.audit.append({
      action: "scheduling.anomaly.escalation.triggered",
      entityType: "WorkSchedule",
      organizationId: resolveTenantScope(actor) ?? undefined,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
  } catch (error) {
    try {
      await context.dataAccess.audit.append({
        action: "scheduling.anomaly.escalation.failed",
        entityType: "WorkSchedule",
        organizationId: resolveTenantScope(actor) ?? undefined,
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          ...payload,
          error: error instanceof Error ? error.message : "unknown error"
        }
      });
    } catch {
      // Non-blocking path: do not fail anomaly report API on escalation side-effects.
    }
  }
}

async function emitAnomalyCockpitTicketRequestsIfEnabled(
  context: ServiceContext,
  actor: Actor,
  input: ListScheduleAnomalyCockpitInput,
  lateThresholdMinutes: number,
  topN: number,
  queue: ScheduleAnomalyCockpitQueueEntry[]
) {
  if (!isSchedulingAnomalyTicketAutomationEnabled() || queue.length === 0) {
    return;
  }

  const contextName = "scheduling anomaly ticket automation";
  const tenantScope = resolveTenantScope(actor) ?? undefined;
  try {
    const minSeverity = parseAnomalySeverityFromEnv(
      process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY ??
        process.env.SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY,
      "CRITICAL",
      "FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY",
      contextName
    );
    const maxPerRun = parsePositiveIntegerRangeFromEnv(
      process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN ??
        process.env.SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN,
      20,
      1,
      200,
      "FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN",
      contextName
    );
    const payload = buildAnomalyTicketRequestPayload(
      input,
      lateThresholdMinutes,
      topN,
      queue,
      minSeverity,
      maxPerRun
    );
    if (payload.requestedCount === 0) {
      return;
    }

    await getEventPublisher(context).publish({
      name: "scheduling.anomaly.ticket.requested.v1",
      occurredAt: new Date().toISOString(),
      entityType: "WorkSchedule",
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });

    await context.dataAccess.audit.append({
      action: "scheduling.anomaly.ticket.requested",
      entityType: "WorkSchedule",
      organizationId: tenantScope,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
  } catch (error) {
    try {
      await context.dataAccess.audit.append({
        action: "scheduling.anomaly.ticket.request.failed",
        entityType: "WorkSchedule",
        organizationId: tenantScope,
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          periodStart: input.periodStart.toISOString(),
          periodEnd: input.periodEnd.toISOString(),
          lateThresholdMinutes,
          topN,
          error: error instanceof Error ? error.message : "unknown error"
        }
      });
    } catch {
      // Non-blocking path: do not fail anomaly cockpit API on ticket side-effects.
    }
  }
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

function plannedMinutesForSchedule(schedule: WorkScheduleEntity) {
  const durationMinutes = Math.floor((schedule.endAt.getTime() - schedule.startAt.getTime()) / 60_000);
  return Math.max(0, durationMinutes - schedule.breakMinutes);
}

function plannedMinutesForGeneratedWindow(window: GeneratedScheduleWindow) {
  const durationMinutes = Math.floor((window.endAt.getTime() - window.startAt.getTime()) / 60_000);
  return Math.max(0, durationMinutes - window.breakMinutes);
}

function deriveRotationBalanceGrade(weekdayGap: number, plannedMinutesGap: number): RotationBalanceGrade {
  if (weekdayGap <= 1 && plannedMinutesGap <= 240) {
    return "BALANCED";
  }
  if (weekdayGap <= 2 && plannedMinutesGap <= 480) {
    return "MODERATE";
  }
  return "IMBALANCED";
}


function normalizeTemplateIds(templateIds: string[]) {
  const trimmed = templateIds.map((value) => value.trim()).filter((value) => value.length > 0);
  if (trimmed.length < 2) {
    throw new ServiceError(400, "templateIds must include at least two template ids for rotation");
  }
  if (trimmed.length > 14) {
    throw new ServiceError(400, "templateIds must not exceed 14 entries");
  }
  const unique = new Set(trimmed);
  if (unique.size !== trimmed.length) {
    throw new ServiceError(400, "templateIds must not contain duplicates");
  }
  return trimmed;
}

function normalizeEmployeeIds(employeeIds: string[] | undefined) {
  if (!employeeIds) {
    return undefined;
  }
  const trimmed = employeeIds.map((value) => value.trim()).filter((value) => value.length > 0);
  if (trimmed.length === 0) {
    throw new ServiceError(400, "employeeIds must include at least one employee id when provided");
  }
  if (trimmed.length > 200) {
    throw new ServiceError(400, "employeeIds must not exceed 200 entries");
  }
  const unique = new Set(trimmed);
  if (unique.size !== trimmed.length) {
    throw new ServiceError(400, "employeeIds must not contain duplicates");
  }
  return trimmed;
}

function normalizeRotationFairnessGlobalConstraints(
  globalConstraints: RotationFairnessGlobalConstraintsInput | undefined
):
  | {
      objective: RotationFairnessGlobalObjective;
      maxDailyPlannedMinutesGap: number | null;
    }
  | undefined {
  if (!globalConstraints) {
    return undefined;
  }

  const objective = globalConstraints.objective ?? "MINIMIZE_DAILY_PLANNED_MINUTES_GAP";
  if (objective !== "MINIMIZE_DAILY_PLANNED_MINUTES_GAP") {
    throw new ServiceError(400, "unsupported global fairness objective");
  }

  let maxDailyPlannedMinutesGap: number | null = null;
  if (globalConstraints.maxDailyPlannedMinutesGap !== undefined) {
    const value = globalConstraints.maxDailyPlannedMinutesGap;
    if (!Number.isInteger(value) || value < 0 || value > 100_000) {
      throw new ServiceError(400, "maxDailyPlannedMinutesGap must be integer in range 0..100000");
    }
    maxDailyPlannedMinutesGap = value;
  }

  return {
    objective,
    maxDailyPlannedMinutesGap
  };
}

function normalizeRotationFairnessWeight(value: number | undefined, fieldName: string) {
  const normalized = value ?? 0;
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 100) {
    throw new ServiceError(400, `${fieldName} must be integer in range 0..100`);
  }
  return normalized;
}

function normalizeRotationFairnessAdvancedConstraints(
  advancedConstraints: RotationFairnessAdvancedConstraintsInput | undefined,
  scopedEmployees: EmployeeEntity[],
  templateIds: string[]
): RotationFairnessAdvancedConstraints | undefined {
  if (!advancedConstraints) {
    return undefined;
  }

  const scopedEmployeeIds = new Set(scopedEmployees.map((employee) => employee.id));
  const templateIdSet = new Set(templateIds);

  let preference:
    | {
        weight: number;
        rulesByEmployeeId: Map<
          string,
          {
            preferredTemplateIds: Set<string>;
            avoidTemplateIds: Set<string>;
          }
        >;
      }
    | null = null;

  if (advancedConstraints.preference) {
    const weight = normalizeRotationFairnessWeight(
      advancedConstraints.preference.weight,
      "advancedConstraints.preference.weight"
    );
    const rulesByEmployeeId = new Map<
      string,
      {
        preferredTemplateIds: Set<string>;
        avoidTemplateIds: Set<string>;
      }
    >();

    for (const rule of advancedConstraints.preference.rules) {
      if (!scopedEmployeeIds.has(rule.employeeId)) {
        throw new ServiceError(404, "employee not found in organization scope", {
          employeeIds: [rule.employeeId]
        });
      }
      if (rulesByEmployeeId.has(rule.employeeId)) {
        throw new ServiceError(400, "advanced preference rules must not contain duplicate employeeId");
      }

      const preferredTemplateIds = new Set((rule.preferredTemplateIds ?? []).map((value) => value.trim()));
      const avoidTemplateIds = new Set((rule.avoidTemplateIds ?? []).map((value) => value.trim()));

      if (preferredTemplateIds.size === 0 && avoidTemplateIds.size === 0) {
        throw new ServiceError(
          400,
          "advanced preference rule must include preferredTemplateIds or avoidTemplateIds"
        );
      }

      const unknownTemplateIds = [
        ...preferredTemplateIds,
        ...avoidTemplateIds
      ].filter((templateId) => !templateIdSet.has(templateId));
      if (unknownTemplateIds.length > 0) {
        throw new ServiceError(404, "template not found in fairness templateIds scope", {
          templateIds: unknownTemplateIds
        });
      }

      const overlapTemplateIds = [...preferredTemplateIds].filter((templateId) => avoidTemplateIds.has(templateId));
      if (overlapTemplateIds.length > 0) {
        throw new ServiceError(400, "preferredTemplateIds and avoidTemplateIds must not overlap", {
          templateIds: overlapTemplateIds
        });
      }

      rulesByEmployeeId.set(rule.employeeId, {
        preferredTemplateIds,
        avoidTemplateIds
      });
    }

    preference = {
      weight,
      rulesByEmployeeId
    };
  }

  let laborLaw:
    | {
        weight: number;
        minRestMinutesBetweenShifts: number | null;
        maxConsecutiveWorkDays: number | null;
      }
    | null = null;

  if (advancedConstraints.laborLaw) {
    const weight = normalizeRotationFairnessWeight(
      advancedConstraints.laborLaw.weight,
      "advancedConstraints.laborLaw.weight"
    );
    const minRestMinutesBetweenShifts = advancedConstraints.laborLaw.minRestMinutesBetweenShifts ?? null;
    const maxConsecutiveWorkDays = advancedConstraints.laborLaw.maxConsecutiveWorkDays ?? null;

    if (minRestMinutesBetweenShifts === null && maxConsecutiveWorkDays === null) {
      throw new ServiceError(
        400,
        "advancedConstraints.laborLaw must include minRestMinutesBetweenShifts or maxConsecutiveWorkDays"
      );
    }

    laborLaw = {
      weight,
      minRestMinutesBetweenShifts,
      maxConsecutiveWorkDays
    };
  }

  if (!preference && !laborLaw) {
    return undefined;
  }

  return {
    preference,
    laborLaw
  };
}

function countMaxConsecutiveWorkDayViolations(
  workDates: string[],
  maxConsecutiveWorkDays: number
) {
  if (workDates.length === 0) {
    return 0;
  }

  const sorted = [...workDates].sort((left, right) => left.localeCompare(right));
  let violations = 0;
  let streak = 1;
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = parseDateToKstBase(sorted[index - 1]);
    const current = parseDateToKstBase(sorted[index]);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / oneDayMs);

    if (diffDays === 1) {
      streak += 1;
      continue;
    }

    if (streak > maxConsecutiveWorkDays) {
      violations += streak - maxConsecutiveWorkDays;
    }
    streak = 1;
  }

  if (streak > maxConsecutiveWorkDays) {
    violations += streak - maxConsecutiveWorkDays;
  }

  return violations;
}

function evaluateRotationFairnessAdvancedScore(
  employeeId: string,
  option: {
    optimizedTemplateIds: string[];
    generatedWindows: GeneratedScheduleWindow[];
  },
  existingSchedules: WorkScheduleEntity[],
  advancedConstraints: RotationFairnessAdvancedConstraints | undefined
): RotationFairnessAdvancedScore | null {
  if (!advancedConstraints) {
    return null;
  }

  let preferenceMismatchCount = 0;
  let avoidTemplateViolationCount = 0;
  let minRestViolationCount = 0;
  let maxConsecutiveWorkDayViolationCount = 0;

  if (advancedConstraints.preference) {
    const rule = advancedConstraints.preference.rulesByEmployeeId.get(employeeId);
    if (rule) {
      for (let index = 0; index < option.generatedWindows.length; index += 1) {
        const templateId = option.optimizedTemplateIds[index % option.optimizedTemplateIds.length];
        if (
          rule.preferredTemplateIds.size > 0 &&
          !rule.preferredTemplateIds.has(templateId)
        ) {
          preferenceMismatchCount += 1;
        }
        if (rule.avoidTemplateIds.has(templateId)) {
          avoidTemplateViolationCount += 1;
        }
      }
    }
  }

  if (advancedConstraints.laborLaw) {
    const minRest = advancedConstraints.laborLaw.minRestMinutesBetweenShifts;
    const maxConsecutive = advancedConstraints.laborLaw.maxConsecutiveWorkDays;

    const windows = [
      ...existingSchedules.map((schedule) => ({
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        isHoliday: schedule.isHoliday,
        plannedMinutes: plannedMinutesForSchedule(schedule)
      })),
      ...option.generatedWindows.map((window) => ({
        startAt: window.startAt,
        endAt: window.endAt,
        isHoliday: window.isHoliday,
        plannedMinutes: plannedMinutesForGeneratedWindow(window)
      }))
    ].sort((left, right) => {
      const leftStart = left.startAt.getTime();
      const rightStart = right.startAt.getTime();
      if (leftStart !== rightStart) {
        return leftStart - rightStart;
      }
      return left.endAt.getTime() - right.endAt.getTime();
    });

    if (minRest !== null) {
      for (let index = 1; index < windows.length; index += 1) {
        const previous = windows[index - 1];
        const current = windows[index];
        const restMinutes = Math.floor((current.startAt.getTime() - previous.endAt.getTime()) / 60_000);
        if (restMinutes < minRest) {
          minRestViolationCount += 1;
        }
      }
    }

    if (maxConsecutive !== null) {
      const workDates = Array.from(
        new Set(
          windows
            .filter((window) => !window.isHoliday && window.plannedMinutes > 0)
            .map((window) => formatKstDateYmd(window.startAt))
        )
      );
      maxConsecutiveWorkDayViolationCount = countMaxConsecutiveWorkDayViolations(workDates, maxConsecutive);
    }
  }

  const preferencePenaltyUnits = preferenceMismatchCount + avoidTemplateViolationCount * 2;
  const laborLawPenaltyUnits = minRestViolationCount + maxConsecutiveWorkDayViolationCount;
  const preferencePenalty =
    (advancedConstraints.preference?.weight ?? 0) * preferencePenaltyUnits;
  const laborLawPenalty = (advancedConstraints.laborLaw?.weight ?? 0) * laborLawPenaltyUnits;
  const totalPenalty = preferencePenalty + laborLawPenalty;

  return {
    preferencePenalty,
    laborLawPenalty,
    totalPenalty,
    preferenceMismatchCount,
    avoidTemplateViolationCount,
    minRestViolationCount,
    maxConsecutiveWorkDayViolationCount
  };
}

type RotationOffsetEvaluation = RotationOffsetEvaluationBase<RotationFairnessAdvancedScore>;

type EmployeeRotationOptimizationEvaluation = {
  employee: EmployeeEntity;
  options: RotationOffsetEvaluation[];
  best: RotationOffsetEvaluation;
};

async function requireTemplatesWithinTenant(context: ServiceContext, templateIds: string[]) {
  const rows: WorkScheduleTemplateEntity[] = [];
  for (const templateId of templateIds) {
    const template = await requireTemplateEntityWithinTenant(context, templateId);
    rows.push(template);
  }
  return rows;
}

function weekdaySetKey(weekdays: number[]) {
  return normalizeWeekdays(weekdays).join(",");
}

function ensureRotationTemplatesShareWeekdaySet(
  templates: WorkScheduleTemplateEntity[],
  templateIds: string[]
) {
  const baseWeekdayKey = weekdaySetKey(templates[0].weekdays);
  for (const template of templates) {
    if (weekdaySetKey(template.weekdays) !== baseWeekdayKey) {
      throw new ServiceError(409, "all rotation templates must share same weekday set", {
        templateIds
      });
    }
  }
}

async function evaluateBestRotationForEmployee(
  context: ServiceContext,
  input: {
    employee: EmployeeEntity;
    fromDate: string;
    toDate: string;
    templates: WorkScheduleTemplateEntity[];
    matchedDates: string[];
    advancedConstraints: RotationFairnessAdvancedConstraints | undefined;
  }
): Promise<EmployeeRotationOptimizationEvaluation> {
  for (const template of input.templates) {
    if (!input.employee.organizationId || input.employee.organizationId !== template.organizationId) {
      throw new ServiceError(409, "template organization and employee organization must match", {
        templateId: template.id,
        employeeId: input.employee.id
      });
    }
  }

  const periodStart = parseDateToKstBase(input.fromDate);
  const periodEnd = new Date(parseDateToKstBase(input.toDate).getTime() + 24 * 60 * 60 * 1000);
  const existingSchedules = await listWorkSchedules(context, {
    periodStart,
    periodEnd,
    employeeId: input.employee.id
  });

  const evaluations = input.templates.map((_, offset) =>
    buildRotationOffsetEvaluation({
      existingSchedules,
      templates: input.templates,
      matchedDates: input.matchedDates,
      offset,
      employeeId: input.employee.id,
      advancedConstraints: input.advancedConstraints,
      rotateTemplatesByOffset,
      buildRotationWindowsForTemplates,
      weekdayFromDateTime: weekdayFromKstDateTime,
      plannedMinutesForSchedule,
      plannedMinutesForGeneratedWindow,
      evaluateAdvancedScore: (evaluationInput) =>
        evaluateRotationFairnessAdvancedScore(
          evaluationInput.employeeId,
          {
            optimizedTemplateIds: evaluationInput.optimizedTemplateIds,
            generatedWindows: evaluationInput.generatedWindows
          },
          evaluationInput.existingSchedules,
          evaluationInput.advancedConstraints
        ),
      deriveRotationBalanceGrade
    })
  );
  const rankedEvaluations = sortRotationOffsetEvaluations(evaluations);

  return {
    employee: input.employee,
    options: rankedEvaluations,
    best: rankedEvaluations[0]
  };
}

async function ensureNoOverlapsForGeneratedWindows(
  context: ServiceContext,
  organizationId: string | undefined,
  employeeId: string,
  windows: GeneratedScheduleWindow[]
) {
  if (windows.length === 0) {
    throw new ServiceError(400, "no schedules generated from requested range");
  }

  const firstStart = windows.reduce((min, row) =>
    row.startAt.getTime() < min.getTime() ? row.startAt : min
  , windows[0].startAt);
  const lastEnd = windows.reduce((max, row) =>
    row.endAt.getTime() > max.getTime() ? row.endAt : max
  , windows[0].endAt);
  const existing = await context.dataAccess.scheduling.listInPeriod({
    periodStart: firstStart,
    periodEnd: lastEnd,
    organizationId,
    employeeId
  });

  for (const candidate of windows) {
    const overlaps = existing.filter(
      (current) => current.startAt < candidate.endAt && current.endAt > candidate.startAt
    );
    if (overlaps.length > 0) {
      throw new ServiceError(409, "overlapping schedule exists", {
        employeeId,
        templateId: candidate.templateId,
        date: candidate.date,
        overlapCount: overlaps.length,
        overlappingScheduleIds: overlaps.map((schedule) => schedule.id)
      });
    }
  }

  for (let index = 0; index < windows.length; index += 1) {
    for (let next = index + 1; next < windows.length; next += 1) {
      const left = windows[index];
      const right = windows[next];
      if (left.startAt < right.endAt && left.endAt > right.startAt) {
        throw new ServiceError(409, "generated schedules overlap within requested range", {
          employeeId,
          leftDate: left.date,
          leftTemplateId: left.templateId,
          rightDate: right.date,
          rightTemplateId: right.templateId
        });
      }
    }
  }
}

async function createSchedulesFromGeneratedWindows(
  context: ServiceContext,
  employeeId: string,
  windows: GeneratedScheduleWindow[]
) {
  const createdScheduleIds: string[] = [];
  for (const candidate of windows) {
    const created = await createWorkSchedule(context, {
      employeeId,
      startAt: candidate.startAt,
      endAt: candidate.endAt,
      breakMinutes: candidate.breakMinutes,
      isHoliday: candidate.isHoliday,
      notes: candidate.notes
    });
    createdScheduleIds.push(created.id);
  }
  return createdScheduleIds;
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

  await ensureNoOverlapsForGeneratedWindows(
    context,
    employee.organizationId ?? undefined,
    input.employeeId,
    generatedWindows
  );

  const createdScheduleIds = await createSchedulesFromGeneratedWindows(
    context,
    input.employeeId,
    generatedWindows
  );

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
  await getEventPublisher(context).publish({
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
  const templates = await requireTemplatesWithinTenant(context, templateIds);
  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);

  for (const template of templates) {
    if (!employee.organizationId || employee.organizationId !== template.organizationId) {
      throw new ServiceError(409, "template organization and employee organization must match", {
        templateId: template.id,
        employeeId: input.employeeId
      });
    }
  }

  const baseWeekdayKey = weekdaySetKey(templates[0].weekdays);
  for (const template of templates) {
    if (weekdaySetKey(template.weekdays) !== baseWeekdayKey) {
      throw new ServiceError(409, "all rotation templates must share same weekday set", {
        templateIds
      });
    }
  }

  const matchedDates = enumerateTemplateMatchedDates(input.fromDate, input.toDate, templates[0].weekdays);
  const generatedWindows = buildRotationWindowsForTemplates(templates, matchedDates);

  await ensureNoOverlapsForGeneratedWindows(
    context,
    employee.organizationId ?? undefined,
    input.employeeId,
    generatedWindows
  );

  const createdScheduleIds = await createSchedulesFromGeneratedWindows(
    context,
    input.employeeId,
    generatedWindows
  );

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
  await getEventPublisher(context).publish({
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
  const templates = await requireTemplatesWithinTenant(context, templateIds);
  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  ensureRotationTemplatesShareWeekdaySet(templates, templateIds);
  const matchedDates = enumerateTemplateMatchedDates(input.fromDate, input.toDate, templates[0].weekdays);
  const evaluation = await evaluateBestRotationForEmployee(context, {
    employee,
    fromDate: input.fromDate,
    toDate: input.toDate,
    templates,
    matchedDates,
    advancedConstraints: undefined
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
  const templates = await requireTemplatesWithinTenant(context, templateIds);
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
    const evaluation = await evaluateBestRotationForEmployee(context, {
      employee,
      fromDate: input.fromDate,
      toDate: input.toDate,
      templates,
      matchedDates,
      advancedConstraints
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
    const templates = await requireTemplatesWithinTenant(context, recommendation.optimizedTemplateIds);
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
    await ensureNoOverlapsForGeneratedWindows(context, plan.organizationId, plan.employeeId, plan.windows);
  }

  const assignments: Array<{ employeeId: string; createdScheduleIds: string[] }> = [];
  for (const plan of assignmentPlans) {
    const createdScheduleIds = await createSchedulesFromGeneratedWindows(
      context,
      plan.employeeId,
      plan.windows
    );

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

    await getEventPublisher(context).publish({
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

export async function listWorkScheduleRotationBalance(
  context: ServiceContext,
  input: ListRotationBalanceInput
): Promise<RotationBalanceReport> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const schedules = await listWorkSchedules(context, {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    employeeId: input.employeeId
  });

  const buckets = new Map<number, { weekday: number; scheduleCount: number; plannedMinutes: number }>();
  for (let weekday = 1; weekday <= 7; weekday += 1) {
    buckets.set(weekday, {
      weekday,
      scheduleCount: 0,
      plannedMinutes: 0
    });
  }

  for (const schedule of schedules) {
    const weekday = weekdayFromKstDateTime(schedule.startAt);
    const bucket = buckets.get(weekday);
    if (!bucket) {
      continue;
    }
    bucket.scheduleCount += 1;
    bucket.plannedMinutes += plannedMinutesForSchedule(schedule);
  }

  const weekdays = Array.from(buckets.values()).sort((a, b) => a.weekday - b.weekday);
  const activeWeekdays = weekdays.filter((bucket) => bucket.scheduleCount > 0);
  const weekdayGap =
    activeWeekdays.length === 0
      ? 0
      : Math.max(...activeWeekdays.map((bucket) => bucket.scheduleCount)) -
        Math.min(...activeWeekdays.map((bucket) => bucket.scheduleCount));
  const plannedMinutesGap =
    activeWeekdays.length === 0
      ? 0
      : Math.max(...activeWeekdays.map((bucket) => bucket.plannedMinutes)) -
        Math.min(...activeWeekdays.map((bucket) => bucket.plannedMinutes));
  const grade = deriveRotationBalanceGrade(weekdayGap, plannedMinutesGap);

  const recommendations: string[] = [];
  if (schedules.length === 0) {
    recommendations.push("조회 범위에 회전 일정이 없습니다.");
  } else if (grade === "BALANCED") {
    recommendations.push("현재 범위에서 회전 부하가 균형적입니다.");
  } else {
    if (weekdayGap > 1) {
      recommendations.push("요일별 배치 편차가 큽니다. 회전 템플릿 순서를 조정하세요.");
    }
    if (plannedMinutesGap > 480) {
      recommendations.push("요일별 계획 근로시간 편차가 큽니다. 템플릿 근무시간 또는 휴게시간을 조정하세요.");
    }
    if (activeWeekdays.length < 3) {
      recommendations.push("활성 요일이 적어 편중 위험이 큽니다. 회전 적용 요일을 확장하세요.");
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("현재 회전 밸런스는 허용 범위입니다.");
  }

  await context.dataAccess.audit.append({
    action: "scheduling.rotation.balance.report.generated",
    entityType: "WorkSchedule",
    organizationId: resolveTenantScope(actor) ?? undefined,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId ?? null,
      schedules: schedules.length,
      activeWeekdays: activeWeekdays.length,
      weekdayGap,
      plannedMinutesGap,
      grade,
      recommendations
    }
  });

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    employeeId: input.employeeId ?? null,
    counts: {
      schedules: schedules.length,
      activeWeekdays: activeWeekdays.length,
      weekdayGap,
      plannedMinutesGap,
      grade
    },
    weekdays,
    recommendations
  };
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
  const { anomalies, lateCount, noShowCount } = buildScheduleAttendanceAnomalySet(
    schedules,
    attendances,
    lateThresholdMinutes
  );
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

  await emitAnomalyAlertIfEnabled(
    context,
    actor,
    input,
    lateThresholdMinutes,
    schedules.length,
    anomalies,
    lateCount,
    noShowCount
  );

  await emitAnomalyEscalationIfEnabled(
    context,
    actor,
    input,
    lateThresholdMinutes,
    schedules.length,
    anomalies,
    lateCount,
    noShowCount
  );

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

export async function updateScheduleAnomalyIncidentLifecycle(
  context: ServiceContext,
  input: UpdateScheduleAnomalyIncidentLifecycleInput
): Promise<ScheduleAnomalyIncidentLifecycleResult> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule anomaly incident lifecycle requires permission"
  );

  const incidentId = input.incidentId.trim();
  if (!incidentId) {
    throw new ServiceError(400, "incidentId is required");
  }
  const normalizedMutationInput = normalizeAnomalyIncidentLifecycleMutationInput({
    action: input.action,
    assigneeId: input.assigneeId,
    resolutionCode: input.resolutionCode,
    note: input.note
  });
  const updatedAt = new Date().toISOString();
  const tenantScope = resolveTenantScope(actor) ?? undefined;
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

  const payload = {
    ...lifecycleUpdate.payload,
    incidentId
  };

  await context.dataAccess.audit.append({
    action: ANOMALY_INCIDENT_LIFECYCLE_AUDIT_ACTION_BY_ACTION[input.action],
    entityType: "WorkSchedule",
    entityId: incidentId,
    organizationId: organizationId ?? undefined,
    actorRole: actor.role,
    actorId: actor.id,
    payload
  });

  await getEventPublisher(context).publish({
    name: "scheduling.anomaly.incident.updated.v1",
    occurredAt: updatedAt,
    entityType: "WorkSchedule",
    entityId: incidentId,
    actorRole: actor.role,
    actorId: actor.id,
    payload
  });
  return {
    incidentId,
    action: lifecycleUpdate.historyEntry.action,
    state: lifecycleUpdate.historyEntry.state,
    assigneeId: lifecycleUpdate.historyEntry.assigneeId,
    resolutionCode: lifecycleUpdate.historyEntry.resolutionCode,
    note: lifecycleUpdate.historyEntry.note,
    updatedAt: lifecycleUpdate.historyEntry.updatedAt,
    updatedBy: {
      actorId: lifecycleUpdate.historyEntry.updatedBy.actorId,
      actorRole: lifecycleUpdate.historyEntry.updatedBy.actorRole
    }
  };
}

export async function listScheduleAnomalyIncidents(
  context: ServiceContext,
  input: ListScheduleAnomalyIncidentsInput
): Promise<ScheduleAnomalyIncidentListResult> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule anomaly incident list requires permission"
  );

  const topN = normalizeIncidentListTopN(input.topN);
  const tenantScope = resolveTenantScope(actor);
  const assigneeId = input.assigneeId?.trim();

  const readModels = await listScheduleAnomalyIncidentReadModels(context.dataAccess, {
    organizationId: tenantScope ?? undefined
  });
  const { total, items } = buildScheduleAnomalyIncidentListResult({
    readModels,
    topN,
    state: input.state,
    assigneeId
  });

  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.listed",
    entityType: "WorkSchedule",
    organizationId: tenantScope ?? undefined,
    actorRole: actor.role,
    actorId: actor.id,
    payload: buildAnomalyIncidentListAuditPayload({
      state: input.state,
      assigneeId: assigneeId ?? null,
      topN,
      total,
      returned: items.length
    })
  });

  return {
    total,
    items
  };
}

export async function listScheduleAnomalyIncidentSla(
  context: ServiceContext,
  input: ListScheduleAnomalyIncidentSlaInput
): Promise<ScheduleAnomalyIncidentSlaReport> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule anomaly incident SLA requires permission"
  );

  const topN = normalizeIncidentListTopN(input.topN);
  const tenantScope = resolveTenantScope(actor);
  const assigneeId = input.assigneeId?.trim();
  const includeResolved = input.includeResolved ?? false;
  const slaTargetMinutes = resolveAnomalyIncidentSlaTargetMinutes(input.slaTargetMinutes);
  const warningMinutes = resolveAnomalyIncidentWarningMinutes(
    input.warningMinutes,
    slaTargetMinutes
  );
  const asOf = input.asOf ?? new Date();
  const asOfMillis = asOf.getTime();

  const readModels = await listScheduleAnomalyIncidentReadModels(context.dataAccess, {
    organizationId: tenantScope ?? undefined
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
    organizationId: tenantScope ?? undefined,
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
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule anomaly incident escalation requires permission"
  );

  const includeResolved = input.includeResolved ?? false;
  const includeWarning = input.includeWarning ?? false;
  const dryRun = input.dryRun ?? false;
  const cooldownMinutes = normalizeAnomalyIncidentEscalationCooldownMinutes(input.cooldownMinutes);
  const escalationChannel = normalizeAnomalyIncidentEscalationChannel(input.escalationChannel);
  const asOf = input.asOf ?? new Date();
  const tenantScope = resolveTenantScope(actor);

  const slaReport = await listScheduleAnomalyIncidentSla(context, {
    state: input.state,
    assigneeId: input.assigneeId,
    topN: input.topN,
    includeResolved,
    slaTargetMinutes: input.slaTargetMinutes,
    warningMinutes: input.warningMinutes,
    asOf
  });

  const candidates = slaReport.items.filter(
    (item) => item.status === "BREACHED" || (includeWarning && item.status === "WARNING")
  );
  const cooldownWindowStartMillis = asOf.getTime() - cooldownMinutes * 60_000;
  const storedIncidents = await context.dataAccess.scheduling.listIncidents({
    organizationId: tenantScope ?? undefined
  });
  const latestRequestedAtMillisByIncident =
    buildLatestScheduleAnomalyEscalationRequestedAtMillisByIncident(storedIncidents);

  const { requested, skippedCooldown, failed, items } =
    await executeScheduleAnomalyIncidentEscalationRequests({
      candidates,
      dryRun,
      cooldownWindowStartMillis,
      cooldownMinutes,
      latestRequestedAtMillisByIncident,
      requestEscalation: async ({ candidate, requestedAt }) => {
        const payload = {
          incidentId: candidate.incidentId,
          state: candidate.state,
          status: candidate.status,
          elapsedMinutes: candidate.elapsedMinutes,
          assigneeId: candidate.assigneeId,
          slaTargetMinutes: candidate.slaTargetMinutes,
          warningMinutes: candidate.warningMinutes,
          cooldownMinutes,
          escalationChannel,
          requestedAt
        };

        await getEventPublisher(context).publish({
          name: "scheduling.anomaly.incident.escalation.requested.v1",
          occurredAt: requestedAt,
          entityType: "WorkSchedule",
          entityId: candidate.incidentId,
          actorRole: actor.role,
          actorId: actor.id,
          payload
        });

        await context.dataAccess.audit.append({
          action: "scheduling.anomaly.incident.escalation.requested",
          entityType: "WorkSchedule",
          entityId: candidate.incidentId,
          organizationId: tenantScope ?? undefined,
          actorRole: actor.role,
          actorId: actor.id,
          payload
        });

        await context.dataAccess.scheduling.markIncidentEscalationRequested({
          incidentId: candidate.incidentId,
          organizationId: tenantScope ?? undefined,
          requestedAt
        });
      },
      onRequestFailed: async ({ candidate, error }) => {
        await context.dataAccess.audit.append({
          action: "scheduling.anomaly.incident.escalation.request.failed",
          entityType: "WorkSchedule",
          entityId: candidate.incidentId,
          organizationId: tenantScope ?? undefined,
          actorRole: actor.role,
          actorId: actor.id,
          payload: {
            incidentId: candidate.incidentId,
            status: candidate.status,
            elapsedMinutes: candidate.elapsedMinutes,
            cooldownMinutes,
            escalationChannel,
            error
          }
        });
      }
    });

  const requestedAt = new Date().toISOString();
  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.escalation.generated",
    entityType: "WorkSchedule",
    organizationId: tenantScope ?? undefined,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      requestedAt,
      dryRun,
      includeResolved,
      includeWarning,
      cooldownMinutes,
      escalationChannel,
      state: input.state ?? null,
      assigneeId: input.assigneeId?.trim() ?? null,
      topN: input.topN ?? 50,
      candidates: candidates.length,
      requested,
      skippedCooldown,
      failed
    }
  });

  return {
    requestedAt,
    dryRun,
    policy: {
      slaTargetMinutes: slaReport.policy.slaTargetMinutes,
      warningMinutes: slaReport.policy.warningMinutes,
      includeResolved,
      includeWarning,
      cooldownMinutes,
      escalationChannel
    },
    counts: {
      candidates: candidates.length,
      requested,
      skippedCooldown,
      failed
    },
    items
  };
}

export async function executeScheduleAnomalyIncidentAutoAction(
  context: ServiceContext,
  input: ExecuteScheduleAnomalyIncidentAutoActionInput
): Promise<ScheduleAnomalyIncidentAutoActionResult> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule anomaly incident auto action requires permission"
  );

  const autoAssigneeId = normalizeAnomalyIncidentAutoAssigneeId(input.autoAssigneeId);
  const autoAssignMode = normalizeAnomalyIncidentAutoAssignMode(input.autoAssignMode);
  const autoAssignNote = normalizeAnomalyIncidentAutoAssignNote(input.autoAssignNote);
  const tenantScope = resolveTenantScope(actor) ?? undefined;

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

  const assignmentSummary = await executeScheduleAnomalyIncidentAutoActionAssignments({
    escalationItems: escalation.items,
    escalationDryRun: escalation.dryRun,
    autoAssigneeId,
    autoAssignMode,
    assignIncident: async ({ incidentId }) => {
      const updated = await updateScheduleAnomalyIncidentLifecycle(context, {
        incidentId,
        action: "ASSIGN",
        assigneeId: autoAssigneeId,
        note: autoAssignNote ?? undefined
      });
      return { state: updated.state, assigneeId: updated.assigneeId };
    },
    onAssignFailed: async ({ incidentId, previousAssigneeId, escalationDecision, error }) => {
      await context.dataAccess.audit.append({
        action: "scheduling.anomaly.incident.auto_action.assign.failed",
        entityType: "WorkSchedule",
        entityId: incidentId,
        organizationId: tenantScope,
        actorRole: actor.role,
        actorId: actor.id,
        payload: {
          incidentId,
          previousAssigneeId,
          autoAssigneeId,
          autoAssignMode,
          escalationDecision,
          error
        }
      });
    }
  });
  const { assigned, skippedEscalation, skippedAssigned, failed, dryRun, items, escalated } =
    assignmentSummary;

  const executedAt = new Date().toISOString();
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

  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.auto_action.generated",
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    payload: summaryPayload
  });

  await notifyScheduleAnomalyIncidentAutoActionExecution({
    dryRun: escalation.dryRun,
    executedAt,
    candidates: escalation.counts.candidates,
    escalated,
    assigned,
    failed,
    summaryPayload,
    items,
    publishExecuted: async (payload) => {
      await getEventPublisher(context).publish({
        name: "scheduling.anomaly.incident.auto_action.executed.v1",
        occurredAt: executedAt,
        entityType: "WorkSchedule",
        actorRole: actor.role,
        actorId: actor.id,
        payload
      });
    },
    appendAudit: async ({ action, payload }) => {
      await context.dataAccess.audit.append({
        action,
        entityType: "WorkSchedule",
        organizationId: tenantScope,
        actorRole: actor.role,
        actorId: actor.id,
        payload
      });
    }
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
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
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
  const tenantScope = resolveTenantScope(actor) ?? undefined;

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

  const { archived, dryRunCount, failed, items } =
    await executeScheduleAnomalyIncidentArchiveActions({
      candidates,
      dryRun,
      deleteIncident: async ({ incidentId }) =>
        context.dataAccess.scheduling.deleteIncident({
          incidentId,
          organizationId: tenantScope
        }),
      onArchived: async ({ candidate, archivedAt }) => {
        await context.dataAccess.audit.append({
          action: ANOMALY_INCIDENT_ARCHIVE_AUDIT_ACTION,
          entityType: "WorkSchedule",
          entityId: candidate.incidentId,
          organizationId: candidate.organizationId ?? tenantScope ?? undefined,
          actorRole: actor.role,
          actorId: actor.id,
          payload: {
            incidentId: candidate.incidentId,
            state: candidate.state,
            assigneeId: candidate.assigneeId,
            updatedAt: candidate.updatedAt,
            archivedAt,
            asOf: asOfIso,
            olderThanMinutes,
            reason: archiveReason
          }
        });
      }
    });

  const archivedAt = new Date().toISOString();
  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.archive.generated",
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      archivedAt,
      dryRun,
      asOf: asOfIso,
      olderThanMinutes,
      includeNonResolved,
      state: stateFilter ?? null,
      assigneeId: assigneeFilter ?? null,
      topN,
      reason: archiveReason,
      total: incidents.length,
      eligible: eligible.length,
      candidates: candidates.length,
      archived,
      dryRunCount,
      skippedState,
      skippedRecent,
      failed
    }
  });

  return {
    archivedAt,
    dryRun,
    policy: {
      olderThanMinutes,
      includeNonResolved,
      reason: archiveReason
    },
    filters: {
      state: stateFilter ?? null,
      assigneeId: assigneeFilter ?? null,
      topN
    },
    counts: {
      total: incidents.length,
      eligible: eligible.length,
      candidates: candidates.length,
      archived,
      dryRun: dryRunCount,
      skippedState,
      skippedRecent,
      failed
    },
    items
  };
}

export async function replayScheduleAnomalyIncidentStore(
  context: ServiceContext,
  input: ReplayScheduleAnomalyIncidentStoreInput
): Promise<ScheduleAnomalyIncidentReplayResult> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule anomaly incident replay requires permission"
  );

  const topN = normalizeAnomalyIncidentReplayTopN(input.topN);
  const normalizedIncidentIds = normalizeAnomalyIncidentReplayIncidentIds(input.incidentIds);
  if (input.from && input.to && input.to < input.from) {
    throw new ServiceError(400, "to must be greater than or equal to from");
  }

  const dryRun = input.dryRun ?? false;
  const includeArchived = input.includeArchived ?? false;
  const tenantScope = resolveTenantScope(actor) ?? undefined;

  const logs = await context.dataAccess.audit.list({
    actions: ANOMALY_INCIDENT_PROJECTION_AUDIT_ACTIONS,
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    limit: MAX_ANOMALY_INCIDENT_AUDIT_ROWS
  });
  const logsInRange = logs.filter((entry) =>
    isWithinOptionalCreatedAtRange(entry.createdAt, {
      from: input.from,
      to: input.to
    })
  );
  const replayModels = buildScheduleAnomalyIncidentReadModelsFromAuditLogs(logsInRange, {
    applyArchiveActions: !includeArchived
  });

  const { replayModelById, selectedIncidentIds } = selectScheduleAnomalyIncidentReplayTargets({
    replayModels,
    incidentIds: normalizedIncidentIds,
    topN
  });

  const { replayed, dryRunCount, notFound, failed, items } =
    await executeScheduleAnomalyIncidentReplayActions({
      selectedIncidentIds,
      replayModelById,
      dryRun,
      onReplay: async ({ incidentId, replayModel }) => {
        const existing = await context.dataAccess.scheduling.findIncidentByIncidentId(incidentId);
        await context.dataAccess.scheduling.upsertIncident({
          ...toScheduleAnomalyIncidentUpsertInput(replayModel),
          lastEscalationRequestedAt: existing?.lastEscalationRequestedAt ?? null
        });
        await context.dataAccess.audit.append({
          action: ANOMALY_INCIDENT_REPLAY_AUDIT_ACTION,
          entityType: "WorkSchedule",
          entityId: incidentId,
          organizationId: replayModel.organizationId ?? tenantScope ?? undefined,
          actorRole: actor.role,
          actorId: actor.id,
          payload: {
            incidentId,
            state: replayModel.state,
            assigneeId: replayModel.assigneeId,
            resolutionCode: replayModel.resolutionCode,
            note: replayModel.note,
            updatedAt: replayModel.updatedAt,
            updatedByActorId: replayModel.updatedBy.actorId,
            updatedByActorRole: replayModel.updatedBy.actorRole,
            history: replayModel.history.map((entry) => ({
              action: entry.action,
              state: entry.state,
              assigneeId: entry.assigneeId,
              resolutionCode: entry.resolutionCode,
              note: entry.note,
              updatedAt: entry.updatedAt,
              updatedByActorId: entry.updatedBy.actorId,
              updatedByActorRole: entry.updatedBy.actorRole
            })),
            includeArchived,
            replayedAt: new Date().toISOString()
          }
        });
      }
    });

  const replayedAt = new Date().toISOString();
  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.replay.generated",
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      replayedAt,
      dryRun,
      includeArchived,
      from: input.from?.toISOString() ?? null,
      to: input.to?.toISOString() ?? null,
      topN,
      incidentIds: normalizedIncidentIds ?? null,
      requested: selectedIncidentIds.length,
      replayed,
      dryRunCount,
      notFound,
      failed
    }
  });

  return {
    replayedAt,
    dryRun,
    policy: {
      includeArchived,
      from: input.from?.toISOString() ?? null,
      to: input.to?.toISOString() ?? null
    },
    filters: {
      topN,
      incidentIds: normalizedIncidentIds
    },
    counts: {
      requested: selectedIncidentIds.length,
      replayed,
      dryRun: dryRunCount,
      notFound,
      failed
    },
    items
  };
}

export async function reconcileScheduleAnomalyIncidentStore(
  context: ServiceContext,
  input: ReconcileScheduleAnomalyIncidentStoreInput
): Promise<ScheduleAnomalyIncidentReconcileResult> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule anomaly incident reconciliation requires permission"
  );

  const topN = normalizeReconcileTopN(input.topN);
  const includeMatching = input.includeMatching ?? false;
  const tenantScope = resolveTenantScope(actor) ?? undefined;

  const storeRows = await context.dataAccess.scheduling.listIncidents({
    organizationId: tenantScope
  });
  const auditRows = await listScheduleAnomalyIncidentReadModelsFromAudit(
    context.dataAccess.audit,
    {
      organizationId: tenantScope,
      applyArchiveActions: true
    }
  );

  const { compared, counts } = buildScheduleAnomalyIncidentReconcileSnapshot({
    storeRows,
    auditRows
  });

  const reconciledAt = new Date().toISOString();
  const items = selectScheduleAnomalyIncidentReconcileItems(compared, {
    includeMatching,
    topN
  });

  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.reconciliation.generated",
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      reconciledAt,
      topN,
      includeMatching,
      compared: compared.length,
      returned: items.length,
      counts
    }
  });

  return {
    reconciledAt,
    filters: {
      topN,
      includeMatching
    },
    counts,
    items
  };
}

export async function getScheduleAnomalyIncident(
  context: ServiceContext,
  incidentId: string
): Promise<ScheduleAnomalyIncidentReadModel> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule anomaly incident read requires permission"
  );

  const tenantScope = resolveTenantScope(actor);
  const incident = await resolveScheduleAnomalyIncidentForActor({
    dataAccess: context.dataAccess,
    incidentId,
    tenantScope
  });

  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.read",
    entityType: "WorkSchedule",
    entityId: incident.incidentId,
    organizationId: incident.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      incidentId: incident.incidentId,
      state: incident.state,
      assigneeId: incident.assigneeId,
      historyCount: incident.history.length
    }
  });

  return cloneScheduleAnomalyIncidentReadModel(incident);
}

export async function listScheduleAttendanceAnomalyCockpit(
  context: ServiceContext,
  input: ListScheduleAnomalyCockpitInput
): Promise<ScheduleAttendanceAnomalyCockpitReport> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requirePermission(
    context,
    Permissions.schedulingScheduleWriteAny,
    "schedule anomaly cockpit requires permission"
  );

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const lateThresholdMinutes = normalizeLateThresholdMinutes(input.lateThresholdMinutes);
  const topN = normalizeTopN(input.topN);
  const tenantScope = resolveTenantScope(actor);

  const schedules = await context.dataAccess.scheduling.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined
  });

  const oneDayMs = 24 * 60 * 60 * 1000;
  const attendancePeriodStart = new Date(input.periodStart.getTime() - oneDayMs);
  const attendancePeriodEnd = new Date(input.periodEnd.getTime() + oneDayMs);
  const attendances = await context.dataAccess.attendance.listInPeriod({
    periodStart: attendancePeriodStart,
    periodEnd: attendancePeriodEnd,
    organizationId: tenantScope ?? undefined
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
    organizationId: tenantScope ?? undefined,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      lateThresholdMinutes,
      topN,
      evaluatedSchedules: schedules.length,
      anomalies: anomalies.length,
      lateCount,
      noShowCount,
      employeeCount: employees.length,
      severities,
      generatedAt
    }
  });

  if (!input.suppressAutomation) {
    await emitAnomalyCockpitTicketRequestsIfEnabled(
      context,
      actor,
      input,
      lateThresholdMinutes,
      topN,
      queue
    );
  }

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    lateThresholdMinutes,
    generatedAt,
    counts: {
      evaluatedSchedules: schedules.length,
      anomalies: anomalies.length,
      late: lateCount,
      noShow: noShowCount
    },
    severities,
    employees,
    queue
  };
}


