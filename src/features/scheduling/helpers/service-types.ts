import type { Actor } from "@/lib/actor";
import type { DataAccess } from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";

// Scheduling service contracts extracted to keep service.ts focused on behavior.
export type CreateScheduleInput = {
  employeeId: string;
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
};

export type ListScheduleInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
};

export type ListScheduleAnomaliesInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  lateThresholdMinutes?: number;
};

export type ListScheduleAnomalyCockpitInput = {
  periodStart: Date;
  periodEnd: Date;
  lateThresholdMinutes?: number;
  topN?: number;
  suppressAutomation?: boolean;
};

export type ListRotationBalanceInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
};

export type ListRotationFairnessInput = {
  organizationId?: string;
  fromDate: string;
  toDate: string;
  templateIds: string[];
  employeeIds?: string[];
  globalConstraints?: RotationFairnessGlobalConstraintsInput;
  advancedConstraints?: RotationFairnessAdvancedConstraintsInput;
};

export type UpdateScheduleInput = {
  startAt?: Date;
  endAt?: Date;
  breakMinutes?: number;
  isHoliday?: boolean;
  notes?: string;
};

export type CreateTemplateInput = {
  name: string;
  startMinute: number;
  endMinute: number;
  breakMinutes: number;
  isHoliday: boolean;
  weekdays: number[];
  notes?: string;
};

export type AssignTemplateInput = {
  templateId: string;
  employeeId: string;
  date: string;
};

export type AssignTemplateRangeInput = {
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

export type AssignRotationInput = {
  employeeId: string;
  fromDate: string;
  toDate: string;
  templateIds: string[];
};

export type AssignRotationOptimizeInput = {
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

export type UpdateScheduleAnomalyIncidentLifecycleInput = {
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

export type ListScheduleAnomalyIncidentSlaInput = {
  state?: ScheduleAnomalyIncidentLifecycleState;
  assigneeId?: string;
  topN?: number;
  includeResolved?: boolean;
  slaTargetMinutes?: number;
  warningMinutes?: number;
  asOf?: Date;
};

export type TriggerScheduleAnomalyIncidentEscalationInput = {
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

export type ExecuteScheduleAnomalyIncidentAutoActionInput = {
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

export type ArchiveScheduleAnomalyIncidentsInput = {
  state?: ScheduleAnomalyIncidentLifecycleState;
  assigneeId?: string;
  topN?: number;
  includeNonResolved?: boolean;
  olderThanMinutes?: number;
  asOf?: Date;
  dryRun?: boolean;
  reason?: string;
};

export type ReplayScheduleAnomalyIncidentStoreInput = {
  incidentIds?: string[];
  topN?: number;
  from?: Date;
  to?: Date;
  dryRun?: boolean;
  includeArchived?: boolean;
};

export type ReconcileScheduleAnomalyIncidentStoreInput = {
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

export type RotationFairnessGlobalConstraintsInput = {
  objective?: RotationFairnessGlobalObjective;
  maxDailyPlannedMinutesGap?: number;
};

export type RotationFairnessPreferenceRuleInput = {
  employeeId: string;
  preferredTemplateIds?: string[];
  avoidTemplateIds?: string[];
};

export type RotationFairnessAdvancedConstraintsInput = {
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

export type RotationFairnessAdvancedConstraints = {
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

