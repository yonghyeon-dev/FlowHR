import type {
  DataAccess,
  ScheduleAnomalyIncidentEntity,
  ScheduleAnomalyIncidentHistoryEntryEntity,
  ScheduleAnomalyIncidentLifecycleAction,
  ScheduleAnomalyIncidentLifecycleState,
  ScheduleAnomalyIncidentResolutionCode,
  UpsertScheduleAnomalyIncidentInput
} from "@/features/shared/data-access";
import {
  ANOMALY_INCIDENT_PROJECTION_AUDIT_ACTIONS,
  buildScheduleAnomalyIncidentReadModelsFromAuditLogs
} from "@/features/scheduling/incident-audit-projection";
import { ServiceError } from "@/features/shared/service-error";

type ScheduleAnomalyIncidentAutoAssignMode = "ASSIGN_IF_UNASSIGNED" | "FORCE_ASSIGN";
type ScheduleAnomalyIncidentSlaStatus = "HEALTHY" | "WARNING" | "BREACHED" | "RESOLVED";

type ScheduleAnomalyIncidentHistoryEntryLike = {
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

type ScheduleAnomalyIncidentReadModelLike = {
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
  history: ScheduleAnomalyIncidentHistoryEntryLike[];
};

const DEFAULT_ANOMALY_INCIDENT_AUTO_ASSIGN_MODE: ScheduleAnomalyIncidentAutoAssignMode =
  "ASSIGN_IF_UNASSIGNED";

export const MAX_ANOMALY_INCIDENT_HISTORY = 50;
export const MAX_ANOMALY_INCIDENT_AUDIT_ROWS = 5000;

export function normalizeAnomalyIncidentAutoAssigneeId(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new ServiceError(400, "autoAssigneeId is required");
  }
  if (normalized.length > 100) {
    throw new ServiceError(400, "autoAssigneeId must be 100 characters or fewer");
  }
  return normalized;
}

export function normalizeAnomalyIncidentAutoAssignMode(
  value: ScheduleAnomalyIncidentAutoAssignMode | undefined
) {
  return value ?? DEFAULT_ANOMALY_INCIDENT_AUTO_ASSIGN_MODE;
}

export function normalizeAnomalyIncidentAutoAssignNote(value: string | undefined) {
  if (value === undefined) {
    return null;
  }
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > 500) {
    throw new ServiceError(400, "autoAssignNote must be 500 characters or fewer");
  }
  return normalized;
}

export function toSlaStatusWeight(status: ScheduleAnomalyIncidentSlaStatus) {
  if (status === "BREACHED") {
    return 4;
  }
  if (status === "WARNING") {
    return 3;
  }
  if (status === "HEALTHY") {
    return 2;
  }
  return 1;
}

export function cloneScheduleAnomalyIncidentReadModel<T extends ScheduleAnomalyIncidentReadModelLike>(
  item: T
): T {
  return {
    ...item,
    updatedBy: { ...item.updatedBy },
    history: item.history.map((entry) => ({
      ...entry,
      updatedBy: { ...entry.updatedBy }
    }))
  };
}

function toIncidentHistoryEntity(
  entry: ScheduleAnomalyIncidentHistoryEntryLike
): ScheduleAnomalyIncidentHistoryEntryEntity {
  return {
    action: entry.action,
    state: entry.state,
    assigneeId: entry.assigneeId,
    resolutionCode: entry.resolutionCode,
    note: entry.note,
    updatedAt: entry.updatedAt,
    updatedByActorId: entry.updatedBy.actorId,
    updatedByActorRole: entry.updatedBy.actorRole
  };
}

function fromIncidentHistoryEntity(
  entry: ScheduleAnomalyIncidentHistoryEntryEntity
): ScheduleAnomalyIncidentHistoryEntryLike {
  return {
    action: entry.action,
    state: entry.state,
    assigneeId: entry.assigneeId,
    resolutionCode: entry.resolutionCode,
    note: entry.note,
    updatedAt: entry.updatedAt,
    updatedBy: {
      actorId: entry.updatedByActorId,
      actorRole: entry.updatedByActorRole
    }
  };
}

export function toScheduleAnomalyIncidentReadModelFromEntity(
  entity: ScheduleAnomalyIncidentEntity
): ScheduleAnomalyIncidentReadModelLike {
  return {
    incidentId: entity.incidentId,
    organizationId: entity.organizationId,
    state: entity.state,
    assigneeId: entity.assigneeId,
    resolutionCode: entity.resolutionCode,
    note: entity.note,
    updatedAt: entity.updatedAt,
    updatedBy: {
      actorId: entity.updatedByActorId,
      actorRole: entity.updatedByActorRole
    },
    history: entity.history.map(fromIncidentHistoryEntity)
  };
}

export function toScheduleAnomalyIncidentUpsertInput(
  readModel: ScheduleAnomalyIncidentReadModelLike
): UpsertScheduleAnomalyIncidentInput {
  return {
    incidentId: readModel.incidentId,
    organizationId: readModel.organizationId,
    state: readModel.state,
    assigneeId: readModel.assigneeId,
    resolutionCode: readModel.resolutionCode,
    note: readModel.note,
    updatedAt: readModel.updatedAt,
    updatedByActorId: readModel.updatedBy.actorId,
    updatedByActorRole: readModel.updatedBy.actorRole,
    history: readModel.history.map(toIncidentHistoryEntity)
  };
}

export async function listScheduleAnomalyIncidentReadModelsFromAudit(
  auditDataAccess: DataAccess["audit"],
  input?: { organizationId?: string; applyArchiveActions?: boolean }
) {
  const logs = await auditDataAccess.list({
    actions: ANOMALY_INCIDENT_PROJECTION_AUDIT_ACTIONS,
    entityType: "WorkSchedule",
    organizationId: input?.organizationId,
    limit: MAX_ANOMALY_INCIDENT_AUDIT_ROWS
  });
  return buildScheduleAnomalyIncidentReadModelsFromAuditLogs(logs, {
    applyArchiveActions: input?.applyArchiveActions
  });
}

export async function getScheduleAnomalyIncidentReadModelFromAudit(
  auditDataAccess: DataAccess["audit"],
  incidentId: string,
  input?: { applyArchiveActions?: boolean }
) {
  const logs = await auditDataAccess.list({
    actions: ANOMALY_INCIDENT_PROJECTION_AUDIT_ACTIONS,
    entityType: "WorkSchedule",
    entityId: incidentId,
    limit: MAX_ANOMALY_INCIDENT_AUDIT_ROWS
  });
  const readModel = buildScheduleAnomalyIncidentReadModelsFromAuditLogs(logs, {
    applyArchiveActions: input?.applyArchiveActions
  }).find((item) => item.incidentId === incidentId);
  return readModel ?? null;
}

export async function backfillScheduleAnomalyIncidentStoreFromReadModel(
  dataAccess: Pick<DataAccess, "scheduling" | "audit">,
  readModel: ScheduleAnomalyIncidentReadModelLike
) {
  const persisted = await dataAccess.scheduling.upsertIncident(
    toScheduleAnomalyIncidentUpsertInput(readModel)
  );

  try {
    await dataAccess.audit.append({
      action: "scheduling.anomaly.incident.backfilled",
      entityType: "WorkSchedule",
      entityId: readModel.incidentId,
      organizationId: readModel.organizationId,
      actorRole: "system",
      actorId: "SCHEDULING-INCIDENT-BACKFILL",
      payload: {
        incidentId: readModel.incidentId,
        state: readModel.state,
        historyCount: readModel.history.length
      }
    });
  } catch {
    // Non-blocking: keep read fallback available even when audit append fails.
  }

  return toScheduleAnomalyIncidentReadModelFromEntity(persisted);
}

export async function listScheduleAnomalyIncidentReadModelsFromStore(
  schedulingDataAccess: DataAccess["scheduling"],
  input: {
    organizationId?: string;
    state?: ScheduleAnomalyIncidentLifecycleState;
    assigneeId?: string;
    incidentIds?: string[];
  }
) {
  const incidents = await schedulingDataAccess.listIncidents({
    organizationId: input.organizationId,
    state: input.state,
    assigneeId: input.assigneeId,
    incidentIds: input.incidentIds
  });
  return incidents.map(toScheduleAnomalyIncidentReadModelFromEntity);
}

export async function listScheduleAnomalyIncidentReadModels(
  dataAccess: Pick<DataAccess, "scheduling" | "audit">,
  input?: {
    organizationId?: string;
    state?: ScheduleAnomalyIncidentLifecycleState;
    assigneeId?: string;
    incidentIds?: string[];
  }
) {
  const stored = await listScheduleAnomalyIncidentReadModelsFromStore(
    dataAccess.scheduling,
    {
      organizationId: input?.organizationId,
      state: input?.state,
      assigneeId: input?.assigneeId,
      incidentIds: input?.incidentIds
    }
  );
  if (stored.length > 0) {
    return stored;
  }

  const fromAudit = await listScheduleAnomalyIncidentReadModelsFromAudit(
    dataAccess.audit,
    {
      organizationId: input?.organizationId
    }
  );
  if (fromAudit.length === 0) {
    return [];
  }

  for (const item of fromAudit) {
    await backfillScheduleAnomalyIncidentStoreFromReadModel(dataAccess, item);
  }

  return listScheduleAnomalyIncidentReadModelsFromStore(dataAccess.scheduling, {
    organizationId: input?.organizationId,
    state: input?.state,
    assigneeId: input?.assigneeId,
    incidentIds: input?.incidentIds
  });
}

export async function getScheduleAnomalyIncidentReadModel(
  dataAccess: Pick<DataAccess, "scheduling" | "audit">,
  incidentId: string
) {
  const stored = await dataAccess.scheduling.findIncidentByIncidentId(incidentId);
  if (stored) {
    return toScheduleAnomalyIncidentReadModelFromEntity(stored);
  }

  const fromAudit = await getScheduleAnomalyIncidentReadModelFromAudit(
    dataAccess.audit,
    incidentId
  );
  if (!fromAudit) {
    return null;
  }
  return backfillScheduleAnomalyIncidentStoreFromReadModel(dataAccess, fromAudit);
}
