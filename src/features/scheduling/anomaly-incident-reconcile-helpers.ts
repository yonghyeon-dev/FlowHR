import type {
  ScheduleAnomalyIncidentLifecycleState,
  ScheduleAnomalyIncidentReconcileItem,
  ScheduleAnomalyIncidentReconcileResult,
  ScheduleAnomalyIncidentResolutionCode
} from "@/features/scheduling/service";

type ScheduleAnomalyIncidentReconcileRow = {
  incidentId: string;
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
  resolutionCode: ScheduleAnomalyIncidentResolutionCode | null;
  note: string | null;
  updatedAt: string;
  history: unknown[];
};

type BuildScheduleAnomalyIncidentReconcileSnapshotInput = {
  storeRows: ScheduleAnomalyIncidentReconcileRow[];
  auditRows: ScheduleAnomalyIncidentReconcileRow[];
};

type BuildScheduleAnomalyIncidentReconcileSnapshotInputFromRows = {
  storeRows: ScheduleAnomalyIncidentReconcileRow[];
  auditRows: ScheduleAnomalyIncidentReconcileRow[];
};

type BuildScheduleAnomalyIncidentReconcileAuditReadInput = {
  organizationId: string | undefined;
};

export type ScheduleAnomalyIncidentReconcileCounts = {
  total: number;
  match: number;
  storeMissing: number;
  orphanedStore: number;
  fieldMismatch: number;
};

type BuildScheduleAnomalyIncidentReconcileGeneratedAuditPayloadInput = {
  reconciledAt: string;
  topN: number;
  includeMatching: boolean;
  compared: number;
  returned: number;
  counts: ScheduleAnomalyIncidentReconcileCounts;
};

type ResolveScheduleAnomalyIncidentReconcileMetaInput = {
  reconciledAt: string;
  topN: number;
  includeMatching: boolean;
};

type BuildScheduleAnomalyIncidentReconcileSummaryInput = {
  compared: number;
  returned: number;
  counts: ScheduleAnomalyIncidentReconcileCounts;
};

type BuildScheduleAnomalyIncidentReconcileGeneratedAuditEntryInput = {
  organizationId: string | undefined;
  actorRole: string;
  actorId: string | undefined;
  payload: ReturnType<typeof buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload>;
};

type BuildScheduleAnomalyIncidentReconcileResultInput = {
  reconciledAt: string;
  topN: number;
  includeMatching: boolean;
  counts: ScheduleAnomalyIncidentReconcileCounts;
  items: ScheduleAnomalyIncidentReconcileItem[];
};

export function buildScheduleAnomalyIncidentReconcileSnapshot(
  input: BuildScheduleAnomalyIncidentReconcileSnapshotInput
): {
  compared: ScheduleAnomalyIncidentReconcileItem[];
  counts: ScheduleAnomalyIncidentReconcileCounts;
} {
  const storeById = new Map(input.storeRows.map((item) => [item.incidentId, item]));
  const auditById = new Map(input.auditRows.map((item) => [item.incidentId, item]));
  const allIncidentIds = Array.from(new Set([...storeById.keys(), ...auditById.keys()])).sort(
    (left, right) => left.localeCompare(right)
  );

  const compared: ScheduleAnomalyIncidentReconcileItem[] = [];
  for (const incidentId of allIncidentIds) {
    const store = storeById.get(incidentId) ?? null;
    const audit = auditById.get(incidentId) ?? null;

    if (!store && audit) {
      compared.push({
        incidentId,
        status: "STORE_MISSING",
        fields: ["incident"],
        storeState: null,
        auditState: audit.state,
        storeHistoryCount: 0,
        auditHistoryCount: audit.history.length
      });
      continue;
    }

    if (store && !audit) {
      compared.push({
        incidentId,
        status: "ORPHANED_STORE",
        fields: ["incident"],
        storeState: store.state,
        auditState: null,
        storeHistoryCount: store.history.length,
        auditHistoryCount: 0
      });
      continue;
    }

    if (!store || !audit) {
      continue;
    }

    const fields: string[] = [];
    if (store.state !== audit.state) {
      fields.push("state");
    }
    if (store.assigneeId !== audit.assigneeId) {
      fields.push("assigneeId");
    }
    if (store.resolutionCode !== audit.resolutionCode) {
      fields.push("resolutionCode");
    }
    if (store.note !== audit.note) {
      fields.push("note");
    }
    if (store.updatedAt !== audit.updatedAt) {
      fields.push("updatedAt");
    }
    if (store.history.length !== audit.history.length) {
      fields.push("historyCount");
    }

    compared.push({
      incidentId,
      status: fields.length > 0 ? "FIELD_MISMATCH" : "MATCH",
      fields,
      storeState: store.state,
      auditState: audit.state,
      storeHistoryCount: store.history.length,
      auditHistoryCount: audit.history.length
    });
  }

  const counts = {
    total: compared.length,
    match: compared.filter((item) => item.status === "MATCH").length,
    storeMissing: compared.filter((item) => item.status === "STORE_MISSING").length,
    orphanedStore: compared.filter((item) => item.status === "ORPHANED_STORE").length,
    fieldMismatch: compared.filter((item) => item.status === "FIELD_MISMATCH").length
  };

  return { compared, counts };
}

export function buildScheduleAnomalyIncidentReconcileSnapshotInputFromRows(
  input: BuildScheduleAnomalyIncidentReconcileSnapshotInputFromRows
) {
  return {
    storeRows: input.storeRows,
    auditRows: input.auditRows
  };
}

export function buildScheduleAnomalyIncidentReconcileAuditReadInput(
  input: BuildScheduleAnomalyIncidentReconcileAuditReadInput
) {
  return {
    organizationId: input.organizationId,
    applyArchiveActions: true
  };
}

export function selectScheduleAnomalyIncidentReconcileItems(
  compared: ScheduleAnomalyIncidentReconcileItem[],
  input: {
    includeMatching: boolean;
    topN: number;
  }
) {
  return compared
    .filter((item) => (input.includeMatching ? true : item.status !== "MATCH"))
    .slice(0, input.topN);
}

export function buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload(
  input: BuildScheduleAnomalyIncidentReconcileGeneratedAuditPayloadInput
) {
  return {
    reconciledAt: input.reconciledAt,
    topN: input.topN,
    includeMatching: input.includeMatching,
    compared: input.compared,
    returned: input.returned,
    counts: input.counts
  };
}

export function resolveScheduleAnomalyIncidentReconcileMeta(
  input: ResolveScheduleAnomalyIncidentReconcileMetaInput
) {
  return {
    reconciledAt: input.reconciledAt,
    topN: input.topN,
    includeMatching: input.includeMatching
  };
}

export function buildScheduleAnomalyIncidentReconcileSummary(
  input: BuildScheduleAnomalyIncidentReconcileSummaryInput
) {
  return {
    compared: input.compared,
    returned: input.returned,
    counts: input.counts
  };
}

export function buildScheduleAnomalyIncidentReconcileGeneratedAuditEntry(
  input: BuildScheduleAnomalyIncidentReconcileGeneratedAuditEntryInput
) {
  return {
    action: "scheduling.anomaly.incident.reconciliation.generated",
    entityType: "WorkSchedule" as const,
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: input.payload
  };
}

export function buildScheduleAnomalyIncidentReconcileResult(
  input: BuildScheduleAnomalyIncidentReconcileResultInput
): ScheduleAnomalyIncidentReconcileResult {
  return {
    reconciledAt: input.reconciledAt,
    filters: {
      topN: input.topN,
      includeMatching: input.includeMatching
    },
    counts: input.counts,
    items: input.items
  };
}
