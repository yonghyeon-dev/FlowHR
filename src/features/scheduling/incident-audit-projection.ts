import type {
  ScheduleAnomalyIncidentHistoryEntry,
  ScheduleAnomalyIncidentLifecycleAction,
  ScheduleAnomalyIncidentLifecycleState,
  ScheduleAnomalyIncidentReadModel,
  ScheduleAnomalyIncidentResolutionCode
} from "@/features/scheduling/service";

export const ANOMALY_INCIDENT_LIFECYCLE_STATE_BY_ACTION: Record<
  ScheduleAnomalyIncidentLifecycleAction,
  ScheduleAnomalyIncidentLifecycleState
> = {
  ACKNOWLEDGE: "ACKNOWLEDGED",
  ASSIGN: "ASSIGNED",
  RESOLVE: "RESOLVED"
};

export const ANOMALY_INCIDENT_LIFECYCLE_AUDIT_ACTION_BY_ACTION: Record<
  ScheduleAnomalyIncidentLifecycleAction,
  string
> = {
  ACKNOWLEDGE: "scheduling.anomaly.incident.acknowledged",
  ASSIGN: "scheduling.anomaly.incident.assigned",
  RESOLVE: "scheduling.anomaly.incident.resolved"
};

export const ANOMALY_INCIDENT_ARCHIVE_AUDIT_ACTION = "scheduling.anomaly.incident.archived";
export const ANOMALY_INCIDENT_REPLAY_AUDIT_ACTION = "scheduling.anomaly.incident.replayed";

export const ANOMALY_INCIDENT_LIFECYCLE_ACTION_BY_AUDIT_ACTION: Record<
  string,
  ScheduleAnomalyIncidentLifecycleAction
> = {
  "scheduling.anomaly.incident.acknowledged": "ACKNOWLEDGE",
  "scheduling.anomaly.incident.assigned": "ASSIGN",
  "scheduling.anomaly.incident.resolved": "RESOLVE"
};

export const ANOMALY_INCIDENT_PROJECTION_AUDIT_ACTIONS = [
  ...Object.values(ANOMALY_INCIDENT_LIFECYCLE_AUDIT_ACTION_BY_ACTION),
  ANOMALY_INCIDENT_ARCHIVE_AUDIT_ACTION,
  ANOMALY_INCIDENT_REPLAY_AUDIT_ACTION
];

export type IncidentAuditProjectionLog = {
  action: string;
  entityId: string | null;
  organizationId: string | null;
  actorRole: string;
  actorId: string | null;
  payload: unknown;
  createdAt: Date;
};

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toIncidentLifecycleState(
  value: unknown,
  fallback: ScheduleAnomalyIncidentLifecycleState
): ScheduleAnomalyIncidentLifecycleState {
  if (value === "ACKNOWLEDGED" || value === "ASSIGNED" || value === "RESOLVED") {
    return value;
  }
  return fallback;
}

function toIncidentResolutionCode(value: unknown): ScheduleAnomalyIncidentResolutionCode | null {
  if (
    value === "FALSE_POSITIVE" ||
    value === "ATTENDANCE_CORRECTED" ||
    value === "MANUAL_CONFIRMED" ||
    value === "OTHER"
  ) {
    return value;
  }
  return null;
}

function toIncidentHistoryEntriesFromAuditPayload(
  value: unknown,
  maxHistory: number
): ScheduleAnomalyIncidentHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries: ScheduleAnomalyIncidentHistoryEntry[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const item = raw as Record<string, unknown>;
    const actionRaw = item.action;
    const action =
      actionRaw === "ACKNOWLEDGE" || actionRaw === "ASSIGN" || actionRaw === "RESOLVE"
        ? actionRaw
        : "ACKNOWLEDGE";
    const fallbackState = ANOMALY_INCIDENT_LIFECYCLE_STATE_BY_ACTION[action];
    entries.push({
      action,
      state: toIncidentLifecycleState(item.state, fallbackState),
      assigneeId: toTrimmedString(item.assigneeId),
      resolutionCode: toIncidentResolutionCode(item.resolutionCode),
      note: toTrimmedString(item.note),
      updatedAt: toTrimmedString(item.updatedAt) ?? new Date(0).toISOString(),
      updatedBy: {
        actorId: toTrimmedString(item.updatedByActorId),
        actorRole: toTrimmedString(item.updatedByActorRole) ?? "system"
      }
    });
  }
  entries.sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
  return entries.slice(-maxHistory);
}

export function buildScheduleAnomalyIncidentReadModelsFromAuditLogs(
  logs: IncidentAuditProjectionLog[],
  options?: {
    applyArchiveActions?: boolean;
    maxHistory?: number;
  }
): ScheduleAnomalyIncidentReadModel[] {
  const applyArchiveActions = options?.applyArchiveActions ?? true;
  const maxHistory = options?.maxHistory ?? 50;
  const byIncidentId = new Map<string, ScheduleAnomalyIncidentReadModel>();

  for (const row of logs) {
    const payload =
      row.payload && typeof row.payload === "object"
        ? (row.payload as Record<string, unknown>)
        : {};
    const incidentId = toTrimmedString(row.entityId) ?? toTrimmedString(payload.incidentId);
    if (!incidentId) {
      continue;
    }

    if (applyArchiveActions && row.action === ANOMALY_INCIDENT_ARCHIVE_AUDIT_ACTION) {
      byIncidentId.delete(incidentId);
      continue;
    }

    if (row.action === ANOMALY_INCIDENT_REPLAY_AUDIT_ACTION) {
      const existing = byIncidentId.get(incidentId);
      const fallbackState = existing?.state ?? "ACKNOWLEDGED";
      const state = toIncidentLifecycleState(payload.state, fallbackState);
      const assigneeId = toTrimmedString(payload.assigneeId);
      const resolutionCode = toIncidentResolutionCode(payload.resolutionCode);
      const note = toTrimmedString(payload.note);
      const updatedAt = toTrimmedString(payload.updatedAt) ?? row.createdAt.toISOString();
      const history = toIncidentHistoryEntriesFromAuditPayload(payload.history, maxHistory);
      const fallbackHistoryEntry: ScheduleAnomalyIncidentHistoryEntry = {
        action: "ACKNOWLEDGE",
        state,
        assigneeId,
        resolutionCode,
        note,
        updatedAt,
        updatedBy: {
          actorId: row.actorId ?? null,
          actorRole: row.actorRole
        }
      };
      const resolvedHistory =
        history.length > 0
          ? history
          : [...(existing?.history ?? []), fallbackHistoryEntry].slice(-maxHistory);

      byIncidentId.set(incidentId, {
        incidentId,
        organizationId: existing?.organizationId ?? row.organizationId ?? null,
        state,
        assigneeId,
        resolutionCode,
        note,
        updatedAt,
        updatedBy: {
          actorId: toTrimmedString(payload.updatedByActorId) ?? row.actorId ?? null,
          actorRole: toTrimmedString(payload.updatedByActorRole) ?? row.actorRole
        },
        history: resolvedHistory
      });
      continue;
    }

    const lifecycleAction = ANOMALY_INCIDENT_LIFECYCLE_ACTION_BY_AUDIT_ACTION[row.action];
    if (!lifecycleAction) {
      continue;
    }

    const fallbackState = ANOMALY_INCIDENT_LIFECYCLE_STATE_BY_ACTION[lifecycleAction];
    const state = toIncidentLifecycleState(payload.state, fallbackState);
    const assigneeId = toTrimmedString(payload.assigneeId);
    const resolutionCode = toIncidentResolutionCode(payload.resolutionCode);
    const note = toTrimmedString(payload.note);
    const updatedAt = toTrimmedString(payload.updatedAt) ?? row.createdAt.toISOString();

    const historyEntry: ScheduleAnomalyIncidentHistoryEntry = {
      action: lifecycleAction,
      state,
      assigneeId,
      resolutionCode,
      note,
      updatedAt,
      updatedBy: {
        actorId: row.actorId ?? null,
        actorRole: row.actorRole
      }
    };

    const existing = byIncidentId.get(incidentId);
    const history = [...(existing?.history ?? []), historyEntry].slice(-maxHistory);
    const organizationId = existing?.organizationId ?? row.organizationId ?? null;

    byIncidentId.set(incidentId, {
      incidentId,
      organizationId,
      state: historyEntry.state,
      assigneeId: historyEntry.assigneeId,
      resolutionCode: historyEntry.resolutionCode,
      note: historyEntry.note,
      updatedAt: historyEntry.updatedAt,
      updatedBy: { ...historyEntry.updatedBy },
      history
    });
  }

  return Array.from(byIncidentId.values());
}
