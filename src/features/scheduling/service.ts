import type { Actor } from "@/lib/actor";
import { requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import type {
  AttendanceRecordEntity,
  CreateWorkScheduleTemplateInput,
  CreateWorkScheduleInput,
  DataAccess,
  EmployeeEntity,
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

type GeneratedScheduleWindow = {
  date: string;
  templateId: string;
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | undefined;
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

export type ScheduleAttendanceAnomalyCockpitReport = {
  periodStart: Date;
  periodEnd: Date;
  lateThresholdMinutes: number;
  generatedAt: string;
  counts: {
    evaluatedSchedules: number;
    anomalies: number;
    late: number;
    noShow: number;
  };
  severities: {
    minor: number;
    major: number;
    critical: number;
  };
  employees: Array<{
    employeeId: string;
    anomalies: number;
    late: number;
    noShow: number;
    severity: AnomalyEscalationSeverity;
    lastAnomalyAt: Date | null;
  }>;
  queue: ScheduleAnomalyCockpitQueueEntry[];
};

export type ScheduleAnomalyCockpitQueueEntry = {
  scheduleId: string;
  employeeId: string;
  anomalyType: ScheduleAttendanceAnomalyType;
  severity: AnomalyEscalationSeverity;
  lateMinutes: number | null;
  scheduleStartAt: Date;
  recommendedAction: string;
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

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function isSchedulingAnomalyAlertsEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED ??
      process.env.SCHEDULING_ANOMALY_ALERTS_ENABLED
  );
}

function isSchedulingAnomalyEscalationEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_SCHEDULING_ANOMALY_ESCALATION_ENABLED ??
      process.env.SCHEDULING_ANOMALY_ESCALATION_ENABLED
  );
}

function isSchedulingAnomalyTicketAutomationEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED ??
      process.env.SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED
  );
}

function buildAnomalyAlertPayload(
  input: ListScheduleAnomaliesInput,
  lateThresholdMinutes: number,
  evaluatedSchedules: number,
  anomalies: ScheduleAttendanceAnomaly[],
  lateCount: number,
  noShowCount: number
) {
  return {
    periodStart: input.periodStart.toISOString(),
    periodEnd: input.periodEnd.toISOString(),
    employeeId: input.employeeId ?? null,
    lateThresholdMinutes,
    evaluatedSchedules,
    anomalies: anomalies.length,
    lateCount,
    noShowCount,
    samples: anomalies.slice(0, 20).map((anomaly) => ({
      scheduleId: anomaly.scheduleId,
      employeeId: anomaly.employeeId,
      anomalyType: anomaly.anomalyType,
      lateMinutes: anomaly.lateMinutes
    }))
  };
}

type AnomalyEscalationSeverity = "MINOR" | "MAJOR" | "CRITICAL";

function parsePositiveIntegerEnv(raw: string | undefined, defaultValue: number, fieldName: string): number {
  if (raw === undefined) {
    return defaultValue;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ServiceError(
      500,
      `scheduling anomaly escalation policy is enabled but ${fieldName} configuration is invalid`
    );
  }
  return parsed;
}

function parseAnomalyEscalationRouting() {
  const raw =
    process.env.FLOWHR_SCHEDULING_ANOMALY_ESCALATION_POLICY ??
    process.env.SCHEDULING_ANOMALY_ESCALATION_POLICY ??
    "";
  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (entries.length === 0) {
    throw new ServiceError(
      500,
      "scheduling anomaly escalation policy is enabled but routing configuration is empty"
    );
  }

  const routing: Partial<Record<AnomalyEscalationSeverity, string>> = {};
  for (const entry of entries) {
    const [severityRaw, ownerRaw, ...extra] = entry.split(":");
    const severity = severityRaw?.trim().toUpperCase() as AnomalyEscalationSeverity;
    const owner = ownerRaw?.trim() ?? "";
    if (
      !severity ||
      (severity !== "MINOR" && severity !== "MAJOR" && severity !== "CRITICAL") ||
      !owner ||
      extra.length > 0
    ) {
      throw new ServiceError(
        500,
        "scheduling anomaly escalation policy is enabled but routing configuration is invalid"
      );
    }
    routing[severity] = owner;
  }

  if (!routing.MINOR || !routing.MAJOR || !routing.CRITICAL) {
    throw new ServiceError(
      500,
      "scheduling anomaly escalation policy is enabled but routing configuration is incomplete"
    );
  }

  return routing as Record<AnomalyEscalationSeverity, string>;
}

function classifyAnomalyEscalationSeverity(
  anomalies: ScheduleAttendanceAnomaly[],
  lateCount: number,
  noShowCount: number
): AnomalyEscalationSeverity {
  if (noShowCount > 0) {
    return "CRITICAL";
  }
  if (lateCount >= 3 || anomalies.length >= 5) {
    return "MAJOR";
  }
  return "MINOR";
}

function anomalyEscalationSeverityWeight(severity: AnomalyEscalationSeverity) {
  if (severity === "CRITICAL") {
    return 3;
  }
  if (severity === "MAJOR") {
    return 2;
  }
  return 1;
}

function parseAnomalySeverityFromEnv(
  raw: string | undefined,
  fallback: AnomalyEscalationSeverity,
  fieldName: string,
  contextName: string
): AnomalyEscalationSeverity {
  if (raw === undefined) {
    return fallback;
  }

  const normalized = raw.trim().toUpperCase();
  if (normalized === "MINOR" || normalized === "MAJOR" || normalized === "CRITICAL") {
    return normalized;
  }

  throw new ServiceError(500, `${contextName} is enabled but ${fieldName} configuration is invalid`);
}

function parsePositiveIntegerRangeFromEnv(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
  fieldName: string,
  contextName: string
): number {
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ServiceError(500, `${contextName} is enabled but ${fieldName} configuration is invalid`);
  }
  return parsed;
}

function buildAnomalyEscalationPayload(
  input: ListScheduleAnomaliesInput,
  lateThresholdMinutes: number,
  evaluatedSchedules: number,
  anomalies: ScheduleAttendanceAnomaly[],
  lateCount: number,
  noShowCount: number
) {
  const severity = classifyAnomalyEscalationSeverity(anomalies, lateCount, noShowCount);
  const routing = parseAnomalyEscalationRouting();
  const retryMaxAttempts = parsePositiveIntegerEnv(
    process.env.FLOWHR_SCHEDULING_ANOMALY_ESCALATION_RETRY_MAX,
    3,
    "FLOWHR_SCHEDULING_ANOMALY_ESCALATION_RETRY_MAX"
  );
  const retryBackoffSeconds = parsePositiveIntegerEnv(
    process.env.FLOWHR_SCHEDULING_ANOMALY_ESCALATION_RETRY_BACKOFF_SECONDS,
    60,
    "FLOWHR_SCHEDULING_ANOMALY_ESCALATION_RETRY_BACKOFF_SECONDS"
  );

  return {
    ...buildAnomalyAlertPayload(
      input,
      lateThresholdMinutes,
      evaluatedSchedules,
      anomalies,
      lateCount,
      noShowCount
    ),
    escalation: {
      severity,
      owner: routing[severity],
      retry: {
        maxAttempts: retryMaxAttempts,
        backoffSeconds: retryBackoffSeconds
      }
    }
  };
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

function buildAnomalyTicketRequestPayload(
  input: ListScheduleAnomalyCockpitInput,
  lateThresholdMinutes: number,
  topN: number,
  queue: ScheduleAnomalyCockpitQueueEntry[],
  minSeverity: AnomalyEscalationSeverity,
  maxPerRun: number
) {
  const minSeverityWeight = anomalyEscalationSeverityWeight(minSeverity);
  const tickets = queue
    .filter((entry) => anomalyEscalationSeverityWeight(entry.severity) >= minSeverityWeight)
    .slice(0, maxPerRun)
    .map((entry) => ({
      scheduleId: entry.scheduleId,
      employeeId: entry.employeeId,
      anomalyType: entry.anomalyType,
      severity: entry.severity,
      lateMinutes: entry.lateMinutes,
      scheduleStartAt: entry.scheduleStartAt.toISOString(),
      recommendedAction: entry.recommendedAction
    }));

  return {
    periodStart: input.periodStart.toISOString(),
    periodEnd: input.periodEnd.toISOString(),
    lateThresholdMinutes,
    topN,
    minSeverity,
    maxPerRun,
    requestedCount: tickets.length,
    tickets
  };
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

function weekdayFromKstDateTime(dateTime: Date) {
  const shiftedToKst = new Date(dateTime.getTime() + 9 * 60 * 60 * 1000);
  const weekdayJs = shiftedToKst.getUTCDay();
  return weekdayJs === 0 ? 7 : weekdayJs;
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

function dateTimeFromKstDateAndMinute(dateYmd: string, minute: number) {
  const base = parseDateToKstBase(dateYmd);
  return new Date(base.getTime() + minute * 60_000);
}

function formatKstDateYmd(base: Date) {
  const shifted = new Date(base.getTime() + 9 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

const MAX_TEMPLATE_ASSIGNMENT_RANGE_DAYS = 62;

function enumerateDateRange(fromDate: string, toDate: string, maxDays: number = MAX_TEMPLATE_ASSIGNMENT_RANGE_DAYS) {
  const start = parseDateToKstBase(fromDate);
  const end = parseDateToKstBase(toDate);
  if (end < start) {
    throw new ServiceError(400, "toDate must be on or after fromDate");
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.floor((end.getTime() - start.getTime()) / oneDayMs) + 1;
  if (totalDays > maxDays) {
    throw new ServiceError(400, `date range too large; maximum is ${maxDays} days`);
  }

  const dates: string[] = [];
  for (let index = 0; index < totalDays; index += 1) {
    const current = new Date(start.getTime() + index * oneDayMs);
    dates.push(formatKstDateYmd(current));
  }

  return dates;
}

function enumerateTemplateMatchedDates(fromDate: string, toDate: string, weekdays: number[]) {
  const dates = enumerateDateRange(fromDate, toDate);
  const matched = dates.filter((dateYmd) => weekdays.includes(weekdayFromKstDate(dateYmd)));
  if (matched.length === 0) {
    throw new ServiceError(400, "no dates in range match template weekdays");
  }
  return matched;
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

type RotationOffsetEvaluation = {
  offset: number;
  optimizedTemplateIds: string[];
  weekdayGap: number;
  plannedMinutesGap: number;
  grade: RotationBalanceGrade;
  generatedWindows: GeneratedScheduleWindow[];
  dailyPlannedMinutes: Array<{
    date: string;
    plannedMinutes: number;
  }>;
  advancedScore: RotationFairnessAdvancedScore | null;
};

type EmployeeRotationOptimizationEvaluation = {
  employee: EmployeeEntity;
  options: RotationOffsetEvaluation[];
  best: RotationOffsetEvaluation;
};

function rotateTemplatesByOffset(
  templates: WorkScheduleTemplateEntity[],
  offset: number
): WorkScheduleTemplateEntity[] {
  if (templates.length === 0) {
    return [];
  }
  const normalizedOffset = ((offset % templates.length) + templates.length) % templates.length;
  if (normalizedOffset === 0) {
    return [...templates];
  }
  return [...templates.slice(normalizedOffset), ...templates.slice(0, normalizedOffset)];
}

function buildRotationWindowsForTemplates(
  templates: WorkScheduleTemplateEntity[],
  matchedDates: string[]
) {
  return matchedDates.map((date, index) => {
    const template = templates[index % templates.length];
    const window = buildScheduleWindowFromTemplateDate(template, date);
    return {
      date,
      templateId: template.id,
      startAt: window.startAt,
      endAt: window.endAt,
      breakMinutes: template.breakMinutes,
      isHoliday: template.isHoliday,
      notes: template.notes ?? undefined
    } satisfies GeneratedScheduleWindow;
  });
}

function evaluateRotationOffset(
  existingSchedules: WorkScheduleEntity[],
  templates: WorkScheduleTemplateEntity[],
  matchedDates: string[],
  offset: number,
  employeeId: string,
  advancedConstraints: RotationFairnessAdvancedConstraints | undefined
): RotationOffsetEvaluation {
  const rotated = rotateTemplatesByOffset(templates, offset);
  const generatedWindows = buildRotationWindowsForTemplates(rotated, matchedDates);

  const weekdayCounts = new Array<number>(8).fill(0);
  const weekdayMinutes = new Array<number>(8).fill(0);

  for (const schedule of existingSchedules) {
    const weekday = weekdayFromKstDateTime(schedule.startAt);
    weekdayCounts[weekday] += 1;
    weekdayMinutes[weekday] += plannedMinutesForSchedule(schedule);
  }
  for (const window of generatedWindows) {
    const weekday = weekdayFromKstDateTime(window.startAt);
    const plannedMinutes = plannedMinutesForGeneratedWindow(window);
    weekdayCounts[weekday] += 1;
    weekdayMinutes[weekday] += plannedMinutes;
  }

  const activeWeekdays = [1, 2, 3, 4, 5, 6, 7].filter((weekday) => weekdayCounts[weekday] > 0);
  const weekdayGap =
    activeWeekdays.length === 0
      ? 0
      : Math.max(...activeWeekdays.map((weekday) => weekdayCounts[weekday])) -
        Math.min(...activeWeekdays.map((weekday) => weekdayCounts[weekday]));
  const plannedMinutesGap =
    activeWeekdays.length === 0
      ? 0
      : Math.max(...activeWeekdays.map((weekday) => weekdayMinutes[weekday])) -
        Math.min(...activeWeekdays.map((weekday) => weekdayMinutes[weekday]));
  const dailyPlannedMinutes = generatedWindows.map((window) => ({
    date: window.date,
    plannedMinutes: plannedMinutesForGeneratedWindow(window)
  }));
  const advancedScore = evaluateRotationFairnessAdvancedScore(
    employeeId,
    {
      optimizedTemplateIds: rotated.map((template) => template.id),
      generatedWindows
    },
    existingSchedules,
    advancedConstraints
  );

  return {
    offset,
    optimizedTemplateIds: rotated.map((template) => template.id),
    weekdayGap,
    plannedMinutesGap,
    grade: deriveRotationBalanceGrade(weekdayGap, plannedMinutesGap),
    generatedWindows,
    dailyPlannedMinutes,
    advancedScore
  };
}

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
    evaluateRotationOffset(
      existingSchedules,
      input.templates,
      input.matchedDates,
      offset,
      input.employee.id,
      input.advancedConstraints
    )
  );
  evaluations.sort((left, right) => {
    const leftAdvancedPenalty = left.advancedScore?.totalPenalty ?? 0;
    const rightAdvancedPenalty = right.advancedScore?.totalPenalty ?? 0;
    if (leftAdvancedPenalty !== rightAdvancedPenalty) {
      return leftAdvancedPenalty - rightAdvancedPenalty;
    }
    if (left.plannedMinutesGap !== right.plannedMinutesGap) {
      return left.plannedMinutesGap - right.plannedMinutesGap;
    }
    if (left.weekdayGap !== right.weekdayGap) {
      return left.weekdayGap - right.weekdayGap;
    }
    return left.offset - right.offset;
  });

  return {
    employee: input.employee,
    options: evaluations,
    best: evaluations[0]
  };
}

function addDailyPlannedMinutes(
  totals: Map<string, number>,
  entries: Array<{ date: string; plannedMinutes: number }>
) {
  for (const entry of entries) {
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.plannedMinutes);
  }
}

function calculateDailyPlannedMinutesGap(totals: Map<string, number>, matchedDates: string[]) {
  if (matchedDates.length === 0) {
    return 0;
  }
  const values = matchedDates.map((date) => totals.get(date) ?? 0);
  return Math.max(...values) - Math.min(...values);
}

function buildRotationFairnessGlobalSummary(
  globalConstraints: {
    objective: RotationFairnessGlobalObjective;
    maxDailyPlannedMinutesGap: number | null;
  },
  totals: Map<string, number>,
  matchedDates: string[]
): RotationFairnessGlobalSummary {
  const dailyPlannedMinutes = matchedDates.map((date) => ({
    date,
    plannedMinutes: totals.get(date) ?? 0
  }));
  const dailyPlannedMinutesGap = calculateDailyPlannedMinutesGap(totals, matchedDates);
  const maxDailyPlannedMinutesGap = globalConstraints.maxDailyPlannedMinutesGap;
  const thresholdBreached =
    maxDailyPlannedMinutesGap !== null && dailyPlannedMinutesGap > maxDailyPlannedMinutesGap;

  return {
    objective: globalConstraints.objective,
    dailyPlannedMinutesGap,
    maxDailyPlannedMinutesGap,
    thresholdBreached,
    dailyPlannedMinutes
  };
}

function selectRotationFairnessRecommendations(
  evaluations: EmployeeRotationOptimizationEvaluation[],
  matchedDates: string[],
  globalConstraints:
    | {
        objective: RotationFairnessGlobalObjective;
        maxDailyPlannedMinutesGap: number | null;
      }
    | undefined
): {
  selectedByEmployeeId: Map<string, RotationOffsetEvaluation>;
  global: RotationFairnessGlobalSummary | null;
} {
  const selectedByEmployeeId = new Map<string, RotationOffsetEvaluation>();
  if (!globalConstraints) {
    for (const evaluation of evaluations) {
      selectedByEmployeeId.set(evaluation.employee.id, evaluation.best);
    }
    return {
      selectedByEmployeeId,
      global: null
    };
  }

  const ordered = [...evaluations].sort((left, right) => left.employee.id.localeCompare(right.employee.id));
  const totals = new Map<string, number>();

  for (const evaluation of ordered) {
    let bestOption = evaluation.options[0];
    let bestGap = Number.POSITIVE_INFINITY;
    let bestLocalPenalty = Number.POSITIVE_INFINITY;

    for (const option of evaluation.options) {
      const candidateTotals = new Map(totals);
      addDailyPlannedMinutes(candidateTotals, option.dailyPlannedMinutes);
      const gap = calculateDailyPlannedMinutesGap(candidateTotals, matchedDates);
      const localPenalty = option.plannedMinutesGap * 10 + option.weekdayGap + (option.advancedScore?.totalPenalty ?? 0);

      if (gap < bestGap) {
        bestOption = option;
        bestGap = gap;
        bestLocalPenalty = localPenalty;
        continue;
      }

      if (gap === bestGap && localPenalty < bestLocalPenalty) {
        bestOption = option;
        bestLocalPenalty = localPenalty;
        continue;
      }

      if (gap === bestGap && localPenalty === bestLocalPenalty && option.offset < bestOption.offset) {
        bestOption = option;
      }
    }

    selectedByEmployeeId.set(evaluation.employee.id, bestOption);
    addDailyPlannedMinutes(totals, bestOption.dailyPlannedMinutes);
  }

  return {
    selectedByEmployeeId,
    global: buildRotationFairnessGlobalSummary(globalConstraints, totals, matchedDates)
  };
}

function buildRotationFairnessAdvancedSummary(
  results: RotationFairnessEmployeeResult[],
  advancedConstraints: RotationFairnessAdvancedConstraints | undefined
): RotationFairnessAdvancedSummary | null {
  if (!advancedConstraints) {
    return null;
  }

  const totals = {
    totalPreferencePenalty: 0,
    totalLaborLawPenalty: 0,
    totalPenalty: 0,
    totalPreferenceMismatchCount: 0,
    totalAvoidTemplateViolationCount: 0,
    totalMinRestViolationCount: 0,
    totalMaxConsecutiveWorkDayViolationCount: 0
  };

  for (const result of results) {
    const advancedScore = result.advancedScore;
    if (!advancedScore) {
      continue;
    }
    totals.totalPreferencePenalty += advancedScore.preferencePenalty;
    totals.totalLaborLawPenalty += advancedScore.laborLawPenalty;
    totals.totalPenalty += advancedScore.totalPenalty;
    totals.totalPreferenceMismatchCount += advancedScore.preferenceMismatchCount;
    totals.totalAvoidTemplateViolationCount += advancedScore.avoidTemplateViolationCount;
    totals.totalMinRestViolationCount += advancedScore.minRestViolationCount;
    totals.totalMaxConsecutiveWorkDayViolationCount += advancedScore.maxConsecutiveWorkDayViolationCount;
  }

  return {
    enabled: true,
    preferenceWeight: advancedConstraints.preference?.weight ?? null,
    laborLawWeight: advancedConstraints.laborLaw?.weight ?? null,
    ...totals
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

function buildScheduleWindowFromTemplateDate(template: WorkScheduleTemplateEntity, dateYmd: string) {
  const startAt = dateTimeFromKstDateAndMinute(dateYmd, template.startMinute);
  let endAt = dateTimeFromKstDateAndMinute(dateYmd, template.endMinute);
  if (template.endMinute <= template.startMinute) {
    endAt = new Date(endAt.getTime() + 24 * 60 * 60 * 1000);
  }
  return { startAt, endAt };
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
  const generatedWindows: GeneratedScheduleWindow[] = matchedDates.map((date) => {
    const window = buildScheduleWindowFromTemplateDate(template, date);
    return {
      date,
      templateId: template.id,
      startAt: window.startAt,
      endAt: window.endAt,
      breakMinutes: template.breakMinutes,
      isHoliday: template.isHoliday,
      notes: template.notes ?? undefined
    };
  });

  await ensureNoOverlapsForGeneratedWindows(
    context,
    employee.organizationId ?? undefined,
    input.employeeId,
    generatedWindows
  );

  const createdScheduleIds: string[] = [];
  for (const candidate of generatedWindows) {
    const created = await createWorkSchedule(context, {
      employeeId: input.employeeId,
      startAt: candidate.startAt,
      endAt: candidate.endAt,
      breakMinutes: candidate.breakMinutes,
      isHoliday: candidate.isHoliday,
      notes: candidate.notes
    });
    createdScheduleIds.push(created.id);
  }

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
  const generatedWindows: GeneratedScheduleWindow[] = matchedDates.map((date, index) => {
    const template = templates[index % templates.length];
    const window = buildScheduleWindowFromTemplateDate(template, date);
    return {
      date,
      templateId: template.id,
      startAt: window.startAt,
      endAt: window.endAt,
      breakMinutes: template.breakMinutes,
      isHoliday: template.isHoliday,
      notes: template.notes ?? undefined
    };
  });

  await ensureNoOverlapsForGeneratedWindows(
    context,
    employee.organizationId ?? undefined,
    input.employeeId,
    generatedWindows
  );

  const createdScheduleIds: string[] = [];
  for (const candidate of generatedWindows) {
    const created = await createWorkSchedule(context, {
      employeeId: input.employeeId,
      startAt: candidate.startAt,
      endAt: candidate.endAt,
      breakMinutes: candidate.breakMinutes,
      isHoliday: candidate.isHoliday,
      notes: candidate.notes
    });
    createdScheduleIds.push(created.id);
  }

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
    recommendations.push("조회 범위에 회전 스케줄이 없습니다.");
  } else if (grade === "BALANCED") {
    recommendations.push("현재 범위에서 회전 부하가 균형적입니다.");
  } else {
    if (weekdayGap > 1) {
      recommendations.push("요일별 배치 편차가 큽니다. 회전 템플릿 순서를 재조정하세요.");
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

function buildScheduleAttendanceAnomalySet(
  schedules: WorkScheduleEntity[],
  attendances: AttendanceRecordEntity[],
  lateThresholdMinutes: number
) {
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
  return {
    anomalies,
    lateCount,
    noShowCount
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

function anomalyCockpitRecommendedAction(anomaly: ScheduleAttendanceAnomaly) {
  if (anomaly.anomalyType === "NO_SHOW") {
    return "출근 확인 및 사유 수집";
  }
  if (anomaly.lateMinutes !== null && anomaly.lateMinutes >= 30) {
    return "지각 원인 확인 및 즉시 에스컬레이션 검토";
  }
  return "지각 사유 확인 및 재발 방지 조치";
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

  const { anomalies, lateCount, noShowCount } = buildScheduleAttendanceAnomalySet(
    schedules,
    attendances,
    lateThresholdMinutes
  );

  const anomaliesByEmployee = new Map<string, ScheduleAttendanceAnomaly[]>();
  for (const anomaly of anomalies) {
    const rows = anomaliesByEmployee.get(anomaly.employeeId);
    if (rows) {
      rows.push(anomaly);
      continue;
    }
    anomaliesByEmployee.set(anomaly.employeeId, [anomaly]);
  }

  const employees = Array.from(anomaliesByEmployee.entries()).map(([employeeId, rows]) => {
    const late = rows.filter((row) => row.anomalyType === "LATE").length;
    const noShow = rows.length - late;
    const lastAnomalyAt =
      rows.length === 0
        ? null
        : rows.reduce((max, row) =>
            row.scheduleStartAt.getTime() > max.getTime() ? row.scheduleStartAt : max
          , rows[0].scheduleStartAt);
    const severity = classifyAnomalyEscalationSeverity(rows, late, noShow);
    return {
      employeeId,
      anomalies: rows.length,
      late,
      noShow,
      severity,
      lastAnomalyAt
    };
  });

  employees.sort((left, right) => {
    const bySeverity =
      anomalyEscalationSeverityWeight(right.severity) - anomalyEscalationSeverityWeight(left.severity);
    if (bySeverity !== 0) {
      return bySeverity;
    }
    if (left.anomalies !== right.anomalies) {
      return right.anomalies - left.anomalies;
    }
    return left.employeeId.localeCompare(right.employeeId);
  });

  const severityByEmployee = new Map(employees.map((employee) => [employee.employeeId, employee.severity]));
  const queue: ScheduleAnomalyCockpitQueueEntry[] = anomalies
    .map((anomaly) => ({
      scheduleId: anomaly.scheduleId,
      employeeId: anomaly.employeeId,
      anomalyType: anomaly.anomalyType,
      severity: severityByEmployee.get(anomaly.employeeId) ?? "MINOR",
      lateMinutes: anomaly.lateMinutes,
      scheduleStartAt: anomaly.scheduleStartAt,
      recommendedAction: anomalyCockpitRecommendedAction(anomaly)
    }))
    .sort((left, right) => {
      const bySeverity =
        anomalyEscalationSeverityWeight(right.severity) - anomalyEscalationSeverityWeight(left.severity);
      if (bySeverity !== 0) {
        return bySeverity;
      }
      const byStart = left.scheduleStartAt.getTime() - right.scheduleStartAt.getTime();
      if (byStart !== 0) {
        return byStart;
      }
      return left.scheduleId.localeCompare(right.scheduleId);
    })
    .slice(0, topN);

  const severities = {
    minor: employees.filter((employee) => employee.severity === "MINOR").length,
    major: employees.filter((employee) => employee.severity === "MAJOR").length,
    critical: employees.filter((employee) => employee.severity === "CRITICAL").length
  };
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
