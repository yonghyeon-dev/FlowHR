import { ServiceError } from "@/features/shared/service-error";

const DEFAULT_ANOMALY_INCIDENT_SLA_TARGET_MINUTES = 60;
const DEFAULT_ANOMALY_INCIDENT_ESCALATION_COOLDOWN_MINUTES = 60;
const DEFAULT_ANOMALY_INCIDENT_ESCALATION_CHANNEL = "ops-oncall";
const DEFAULT_ANOMALY_INCIDENT_ARCHIVE_OLDER_THAN_MINUTES = 60 * 24 * 90;

export function normalizeIncidentListTopN(value: number | undefined) {
  const normalized = value ?? 50;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 200) {
    throw new ServiceError(400, "topN must be an integer in range 1..200");
  }
  return normalized;
}

function parseAnomalyIncidentSlaMinutesEnvValue(
  raw: string | undefined,
  fieldName: string
): number | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10080) {
    throw new ServiceError(500, `${fieldName} configuration is invalid`);
  }
  return parsed;
}

export function resolveAnomalyIncidentSlaTargetMinutes(overrideValue: number | undefined) {
  if (overrideValue !== undefined) {
    return overrideValue;
  }

  const parsed = parseAnomalyIncidentSlaMinutesEnvValue(
    process.env.FLOWHR_SCHEDULING_ANOMALY_INCIDENT_SLA_MINUTES ??
      process.env.SCHEDULING_ANOMALY_INCIDENT_SLA_MINUTES,
    "FLOWHR_SCHEDULING_ANOMALY_INCIDENT_SLA_MINUTES"
  );
  return parsed ?? DEFAULT_ANOMALY_INCIDENT_SLA_TARGET_MINUTES;
}

export function resolveAnomalyIncidentWarningMinutes(
  overrideValue: number | undefined,
  slaTargetMinutes: number
) {
  const normalized =
    overrideValue ??
    parseAnomalyIncidentSlaMinutesEnvValue(
      process.env.FLOWHR_SCHEDULING_ANOMALY_INCIDENT_WARNING_MINUTES ??
        process.env.SCHEDULING_ANOMALY_INCIDENT_WARNING_MINUTES,
      "FLOWHR_SCHEDULING_ANOMALY_INCIDENT_WARNING_MINUTES"
    ) ??
    Math.max(0, Math.floor(slaTargetMinutes / 2));

  if (normalized >= slaTargetMinutes) {
    throw new ServiceError(
      overrideValue !== undefined ? 400 : 500,
      "warningMinutes must be less than slaTargetMinutes"
    );
  }
  return normalized;
}

export function normalizeAnomalyIncidentEscalationCooldownMinutes(value: number | undefined) {
  const normalized = value ?? DEFAULT_ANOMALY_INCIDENT_ESCALATION_COOLDOWN_MINUTES;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 10080) {
    throw new ServiceError(400, "cooldownMinutes must be an integer in range 1..10080");
  }
  return normalized;
}

export function normalizeAnomalyIncidentEscalationChannel(value: string | undefined) {
  const normalized = (value ?? DEFAULT_ANOMALY_INCIDENT_ESCALATION_CHANNEL).trim();
  if (!normalized) {
    throw new ServiceError(400, "escalationChannel is required");
  }
  if (normalized.length > 100) {
    throw new ServiceError(400, "escalationChannel must be 100 characters or fewer");
  }
  return normalized;
}

export function normalizeAnomalyIncidentArchiveOlderThanMinutes(value: number | undefined) {
  const normalized = value ?? DEFAULT_ANOMALY_INCIDENT_ARCHIVE_OLDER_THAN_MINUTES;
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 5256000) {
    throw new ServiceError(400, "olderThanMinutes must be an integer in range 0..5256000");
  }
  return normalized;
}

export function normalizeAnomalyIncidentArchiveReason(value: string | undefined) {
  if (value === undefined) {
    return null;
  }
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > 500) {
    throw new ServiceError(400, "reason must be 500 characters or fewer");
  }
  return normalized;
}

export function normalizeAnomalyIncidentReplayTopN(value: number | undefined) {
  const normalized = value ?? 50;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 200) {
    throw new ServiceError(400, "topN must be an integer in range 1..200");
  }
  return normalized;
}

export function normalizeAnomalyIncidentReplayIncidentIds(value: string[] | undefined) {
  if (!value) {
    return null;
  }
  const normalized = Array.from(
    new Set(
      value
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
  if (normalized.length === 0) {
    return null;
  }
  if (normalized.length > 200) {
    throw new ServiceError(400, "incidentIds must contain at most 200 ids");
  }
  return normalized;
}

export function normalizeReconcileTopN(value: number | undefined) {
  const normalized = value ?? 100;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 500) {
    throw new ServiceError(400, "topN must be an integer in range 1..500");
  }
  return normalized;
}

export function parseIsoTimestampToMillis(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

export function isWithinOptionalCreatedAtRange(
  value: Date,
  input: { from?: Date; to?: Date }
) {
  if (input.from && value < input.from) {
    return false;
  }
  if (input.to && value > input.to) {
    return false;
  }
  return true;
}
