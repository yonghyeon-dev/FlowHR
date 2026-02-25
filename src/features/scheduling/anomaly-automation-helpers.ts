import { ServiceError } from "@/features/shared/service-error";

export type AnomalyEscalationSeverity = "MINOR" | "MAJOR" | "CRITICAL";
export type AnomalyType = "LATE" | "NO_SHOW";

export type AnomalyAlertInputWindow = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
};

export type AnomalyAlertRow = {
  scheduleId: string;
  employeeId: string;
  anomalyType: AnomalyType;
  lateMinutes: number | null;
};

export type AnomalyTicketRequestQueueEntry = {
  scheduleId: string;
  employeeId: string;
  anomalyType: AnomalyType;
  severity: AnomalyEscalationSeverity;
  lateMinutes: number | null;
  scheduleStartAt: Date;
  recommendedAction: string;
};

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

export function classifyAnomalyEscalationSeverity(
  anomalies: AnomalyAlertRow[],
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

export function anomalyEscalationSeverityWeight(severity: AnomalyEscalationSeverity) {
  if (severity === "CRITICAL") {
    return 3;
  }
  if (severity === "MAJOR") {
    return 2;
  }
  return 1;
}

export function parseAnomalySeverityFromEnv(
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

export function parsePositiveIntegerRangeFromEnv(
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

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isSchedulingAnomalyAlertsEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED ??
      process.env.SCHEDULING_ANOMALY_ALERTS_ENABLED
  );
}

export function isSchedulingAnomalyEscalationEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_SCHEDULING_ANOMALY_ESCALATION_ENABLED ??
      process.env.SCHEDULING_ANOMALY_ESCALATION_ENABLED
  );
}

export function isSchedulingAnomalyTicketAutomationEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED ??
      process.env.SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED
  );
}

export function buildAnomalyAlertPayload(
  input: AnomalyAlertInputWindow,
  lateThresholdMinutes: number,
  evaluatedSchedules: number,
  anomalies: AnomalyAlertRow[],
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

export function buildAnomalyEscalationPayload(
  input: AnomalyAlertInputWindow,
  lateThresholdMinutes: number,
  evaluatedSchedules: number,
  anomalies: AnomalyAlertRow[],
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

export function buildAnomalyTicketRequestPayload(
  input: { periodStart: Date; periodEnd: Date },
  lateThresholdMinutes: number,
  topN: number,
  queue: AnomalyTicketRequestQueueEntry[],
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
