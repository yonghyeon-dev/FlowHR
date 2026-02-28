import type { Actor } from "@/lib/actor";
import { requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  DataAccess,
  EmployeeEntity,
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
  buildScheduleAnomalyIncidentAutoActionResult,
  buildScheduleAnomalyIncidentAutoActionSummaryPayload,
  executeScheduleAnomalyIncidentAutoActionAssignments,
  notifyScheduleAnomalyIncidentAutoActionExecution
} from "@/features/scheduling/anomaly-incident-auto-action-helpers";
import {
  buildScheduleAnomalyIncidentAutoActionAssignFailedAuditEntry,
  buildScheduleAnomalyIncidentAutoActionExecutionAuditEntry,
  buildScheduleAnomalyIncidentAutoActionGeneratedAuditEntry
} from "@/features/scheduling/anomaly-incident-auto-action-audit-helpers";
import {
  buildScheduleAnomalyIncidentArchiveAuditPayload,
  buildScheduleAnomalyIncidentArchiveCandidates,
  buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload,
  buildScheduleAnomalyIncidentArchiveResult,
  executeScheduleAnomalyIncidentArchiveActions
} from "@/features/scheduling/anomaly-incident-archive-helpers";
import {
  buildScheduleAnomalyIncidentSlaQueue
} from "@/features/scheduling/anomaly-incident-queue-helpers";
import {
  buildScheduleAnomalyIncidentReplayAuditPayload,
  buildScheduleAnomalyIncidentReplayGeneratedAuditPayload,
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
  evaluateRotationFairnessAdvancedScore,
  normalizeEmployeeIds,
  normalizeRotationFairnessAdvancedConstraints,
  normalizeRotationFairnessGlobalConstraints,
  normalizeTemplateIds,
  plannedMinutesForGeneratedWindow,
  plannedMinutesForSchedule
} from "@/features/scheduling/rotation-fairness-core-helpers";
import {
  buildRotationBalanceReportGeneratedAuditPayload,
  buildRotationBalanceSummary
} from "@/features/scheduling/rotation-balance-report-helpers";
import {
  buildRotationOffsetEvaluation,
  sortRotationOffsetEvaluations
} from "@/features/scheduling/rotation-optimization-evaluation-helpers";
import {
  evaluateEmployeeRotationOptimization,
  type EmployeeRotationOptimizationEvaluation as EmployeeRotationOptimizationEvaluationBase
} from "@/features/scheduling/rotation-employee-optimization-helpers";
import { resolveScheduleListEmployeeFilter } from "@/features/scheduling/schedule-list-query-helpers";
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
  buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload,
  buildScheduleAnomalyIncidentReconcileResult,
  buildScheduleAnomalyIncidentReconcileSnapshot,
  selectScheduleAnomalyIncidentReconcileItems
} from "@/features/scheduling/anomaly-incident-reconcile-helpers";
import {
  requireSchedulingActor,
  requireSchedulingWriteActor,
  resolveSchedulingEventPublisher,
  resolveSchedulingTenantScope
} from "@/features/scheduling/anomaly-service-context-helpers";
import {
  buildScheduleAnomalySideEffectContext,
  emitAnomalyCockpitTicketRequestsIfEnabled,
  emitAnomalySummarySideEffects
} from "@/features/scheduling/anomaly-side-effect-helpers";
import {
  buildScheduleAnomalyIncidentEscalationRequestFailedPayload,
  buildScheduleAnomalyIncidentEscalationRequestPayload,
  buildScheduleAnomalyIncidentEscalationResult,
  buildScheduleAnomalyIncidentEscalationSummaryPayload,
  buildLatestScheduleAnomalyEscalationRequestedAtMillisByIncident,
  executeScheduleAnomalyIncidentEscalationRequests
} from "@/features/scheduling/anomaly-incident-escalation-helpers";
import {
  getScheduleAnomalyIncidentFromHelper,
  listScheduleAnomalyIncidentsFromHelper
} from "@/features/scheduling/anomaly-incident-query-service-helpers";
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
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
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

export type ListScheduleAnomalyIncidentsInput = {
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

export type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

function requireTemplateTenantScope(context: ServiceContext) {
  const tenantScope = resolveTenantScope(context.actor);
  if (!tenantScope) {
    throw new ServiceError(400, "template operations require tenant organization scope");
  }
  return tenantScope;
}

type EmployeeRotationOptimizationEvaluation =
  EmployeeRotationOptimizationEvaluationBase<RotationFairnessAdvancedScore>;

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
  return evaluateEmployeeRotationOptimization({
    employee: input.employee,
    fromDate: input.fromDate,
    toDate: input.toDate,
    templates: input.templates,
    matchedDates: input.matchedDates,
    advancedConstraints: input.advancedConstraints,
    listExistingSchedules: ({ periodStart, periodEnd, employeeId }) =>
      listWorkSchedules(context, {
        periodStart,
        periodEnd,
        employeeId
      }),
    buildRotationOffsetEvaluation: (evaluationInput) =>
      buildRotationOffsetEvaluation({
        existingSchedules: evaluationInput.existingSchedules,
        templates: evaluationInput.templates,
        matchedDates: evaluationInput.matchedDates,
        offset: evaluationInput.offset,
        employeeId: evaluationInput.employeeId,
        advancedConstraints: evaluationInput.advancedConstraints,
        rotateTemplatesByOffset,
        buildRotationWindowsForTemplates,
        weekdayFromDateTime: weekdayFromKstDateTime,
        plannedMinutesForSchedule,
        plannedMinutesForGeneratedWindow,
        evaluateAdvancedScore: (advancedEvaluationInput) =>
          evaluateRotationFairnessAdvancedScore(
            advancedEvaluationInput.employeeId,
            {
              optimizedTemplateIds: advancedEvaluationInput.optimizedTemplateIds,
              generatedWindows: advancedEvaluationInput.generatedWindows
            },
            advancedEvaluationInput.existingSchedules,
            advancedEvaluationInput.advancedConstraints
          ),
        deriveRotationBalanceGrade
      }),
    sortRotationOffsetEvaluations
  });
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

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    employeeId: input.employeeId ?? null,
    counts: {
      schedules: schedules.length,
      activeWeekdays: activeWeekdaysCount,
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
    periodStart: input.periodStart,
    periodEnd: input.periodEnd
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
  await emitAnomalySummarySideEffects(sideEffectContext, {
    window: normalizedWindow,
    lateThresholdMinutes,
    evaluatedSchedules: schedules.length,
    anomalies,
    lateCount,
    noShowCount
  });

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
  const actor = await requireSchedulingWriteActor(
    context,
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
  const tenantScope = resolveSchedulingTenantScope(actor);
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
  const actor = await requireSchedulingWriteActor(
    context,
    "schedule anomaly incident SLA requires permission"
  );

  const topN = normalizeIncidentListTopN(input.topN);
  const tenantScope = resolveSchedulingTenantScope(actor);
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
  const actor = await requireSchedulingWriteActor(
    context,
    "schedule anomaly incident escalation requires permission"
  );

  const includeResolved = input.includeResolved ?? false;
  const includeWarning = input.includeWarning ?? false;
  const dryRun = input.dryRun ?? false;
  const cooldownMinutes = normalizeAnomalyIncidentEscalationCooldownMinutes(input.cooldownMinutes);
  const escalationChannel = normalizeAnomalyIncidentEscalationChannel(input.escalationChannel);
  const asOf = input.asOf ?? new Date();
  const tenantScope = resolveSchedulingTenantScope(actor);

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
    organizationId: tenantScope
  });
  const latestRequestedAtMillisByIncident =
    buildLatestScheduleAnomalyEscalationRequestedAtMillisByIncident(storedIncidents);

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

      await context.dataAccess.audit.append({
        action: "scheduling.anomaly.incident.escalation.requested",
        entityType: "WorkSchedule",
        entityId: candidate.incidentId,
        organizationId: tenantScope,
        actorRole: actor.role,
        actorId: actor.id,
        payload
      });

      await context.dataAccess.scheduling.markIncidentEscalationRequested({
        incidentId: candidate.incidentId,
        organizationId: tenantScope,
        requestedAt
      });
    },
    onRequestFailed: async ({ candidate, error }) => {
      await context.dataAccess.audit.append({
        action: "scheduling.anomaly.incident.escalation.request.failed",
        entityType: "WorkSchedule",
        entityId: candidate.incidentId,
        organizationId: tenantScope,
        actorRole: actor.role,
        actorId: actor.id,
        payload: buildScheduleAnomalyIncidentEscalationRequestFailedPayload({
          candidate,
          cooldownMinutes,
          escalationChannel,
          error
        })
      });
    }
  });
  const { requested, skippedCooldown, failed, items } = executionSummary;

  const requestedAt = new Date().toISOString();
  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.escalation.generated",
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    payload: buildScheduleAnomalyIncidentEscalationSummaryPayload({
      requestedAt,
      dryRun,
      includeResolved,
      includeWarning,
      cooldownMinutes,
      escalationChannel,
      state: input.state,
      assigneeId: input.assigneeId,
      topN: input.topN,
      candidates: candidates.length,
      executionSummary
    })
  });

  return buildScheduleAnomalyIncidentEscalationResult({
    requestedAt,
    dryRun,
    slaTargetMinutes: slaReport.policy.slaTargetMinutes,
    warningMinutes: slaReport.policy.warningMinutes,
    includeResolved,
    includeWarning,
    cooldownMinutes,
    escalationChannel,
    candidates: candidates.length,
    executionSummary
  });
}

export async function executeScheduleAnomalyIncidentAutoAction(
  context: ServiceContext,
  input: ExecuteScheduleAnomalyIncidentAutoActionInput
): Promise<ScheduleAnomalyIncidentAutoActionResult> {
  const actor = await requireSchedulingWriteActor(
    context,
    "schedule anomaly incident auto action requires permission"
  );

  const autoAssigneeId = normalizeAnomalyIncidentAutoAssigneeId(input.autoAssigneeId);
  const autoAssignMode = normalizeAnomalyIncidentAutoAssignMode(input.autoAssignMode);
  const autoAssignNote = normalizeAnomalyIncidentAutoAssignNote(input.autoAssignNote);
  const tenantScope = resolveSchedulingTenantScope(actor);

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
    dryRun: escalation.dryRun,
    executedAt,
    candidates: escalation.counts.candidates,
    escalated,
    assigned,
    failed,
    summaryPayload,
    items,
    publishExecuted: async (payload) => {
      await resolveSchedulingEventPublisher(context).publish({
        name: "scheduling.anomaly.incident.auto_action.executed.v1",
        occurredAt: executedAt,
        entityType: "WorkSchedule",
        actorRole: actor.role,
        actorId: actor.id,
        payload
      });
    },
    appendAudit: async ({ action, payload }) => {
      await context.dataAccess.audit.append(
        buildScheduleAnomalyIncidentAutoActionExecutionAuditEntry({
          action,
          organizationId: tenantScope,
          actorRole: actor.role,
          actorId: actor.id ?? undefined,
          payload
        })
      );
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
  const actor = await requireSchedulingWriteActor(
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
  const tenantScope = resolveSchedulingTenantScope(actor);

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
          organizationId: candidate.organizationId ?? tenantScope,
          actorRole: actor.role,
          actorId: actor.id,
          payload: buildScheduleAnomalyIncidentArchiveAuditPayload({
            candidate,
            archivedAt,
            asOfIso,
            olderThanMinutes,
            archiveReason
          })
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
    payload: buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload({
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
      candidates: candidates.length,
      summary: { archived, dryRunCount, failed },
      skippedState,
      skippedRecent
    })
  });
  return buildScheduleAnomalyIncidentArchiveResult({
    archivedAt,
    dryRun,
    olderThanMinutes,
    includeNonResolved,
    archiveReason,
    stateFilter,
    assigneeFilter,
    topN,
    total: incidents.length,
    eligible: eligible.length,
    candidates: candidates.length,
    summary: { archived, dryRunCount, failed, items },
    skippedState,
    skippedRecent
  });
}

export async function replayScheduleAnomalyIncidentStore(
  context: ServiceContext,
  input: ReplayScheduleAnomalyIncidentStoreInput
): Promise<ScheduleAnomalyIncidentReplayResult> {
  const actor = await requireSchedulingWriteActor(
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
  const tenantScope = resolveSchedulingTenantScope(actor);

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
        const replayedAt = new Date().toISOString();
        await context.dataAccess.audit.append({
          action: ANOMALY_INCIDENT_REPLAY_AUDIT_ACTION,
          entityType: "WorkSchedule",
          entityId: incidentId,
          organizationId: replayModel.organizationId ?? tenantScope,
          actorRole: actor.role,
          actorId: actor.id,
          payload: buildScheduleAnomalyIncidentReplayAuditPayload({
            incidentId,
            replayModel,
            includeArchived,
            replayedAt
          })
        });
      }
    });

  const replayedAt = new Date().toISOString();
  const fromIso = input.from?.toISOString() ?? null;
  const toIso = input.to?.toISOString() ?? null;
  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.replay.generated",
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    payload: buildScheduleAnomalyIncidentReplayGeneratedAuditPayload({
      replayedAt,
      dryRun,
      includeArchived,
      fromIso,
      toIso,
      topN,
      incidentIds: normalizedIncidentIds,
      requested: selectedIncidentIds.length,
      summary: { replayed, dryRunCount, notFound, failed }
    })
  });

  return buildScheduleAnomalyIncidentReplayResult({
    replayedAt,
    dryRun,
    includeArchived,
    fromIso,
    toIso,
    topN,
    incidentIds: normalizedIncidentIds,
    requested: selectedIncidentIds.length,
    summary: { replayed, dryRunCount, notFound, failed, items }
  });
}

export async function reconcileScheduleAnomalyIncidentStore(
  context: ServiceContext,
  input: ReconcileScheduleAnomalyIncidentStoreInput
): Promise<ScheduleAnomalyIncidentReconcileResult> {
  const actor = await requireSchedulingWriteActor(
    context,
    "schedule anomaly incident reconciliation requires permission"
  );

  const topN = normalizeReconcileTopN(input.topN);
  const includeMatching = input.includeMatching ?? false;
  const tenantScope = resolveSchedulingTenantScope(actor);

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
    payload: buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload({
      reconciledAt,
      topN,
      includeMatching,
      compared: compared.length,
      returned: items.length,
      counts
    })
  });
  return buildScheduleAnomalyIncidentReconcileResult({
    reconciledAt,
    topN,
    includeMatching,
    counts,
    items
  });
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
  const actor = await requireSchedulingWriteActor(
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
  const tenantScope = resolveSchedulingTenantScope(actor);

  const schedules = await context.dataAccess.scheduling.listInPeriod({
    periodStart: normalizedWindow.periodStart,
    periodEnd: normalizedWindow.periodEnd,
    organizationId: tenantScope
  });

  const attendancePeriod = buildAnomalyAttendancePeriodWindow({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd
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
    await emitAnomalyCockpitTicketRequestsIfEnabled(
      sideEffectContext,
      {
        window: normalizedWindow,
        lateThresholdMinutes,
        topN,
        queue
      }
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


