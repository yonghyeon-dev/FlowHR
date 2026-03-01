import type {
  ScheduleAnomalyIncidentLifecycleState,
  ScheduleAnomalyIncidentReplayItem,
  ScheduleAnomalyIncidentReplayResult
} from "@/features/scheduling/service";
import { ANOMALY_INCIDENT_REPLAY_AUDIT_ACTION } from "@/features/scheduling/incident-audit-projection";
import { isWithinOptionalCreatedAtRange } from "@/features/scheduling/incident-normalizers";

type ScheduleAnomalyIncidentReplayModelBase = {
  incidentId: string;
  updatedAt: string;
  state: ScheduleAnomalyIncidentLifecycleState;
  history: unknown[];
};

type SelectScheduleAnomalyIncidentReplayTargetsInput<
  TReplayModel extends ScheduleAnomalyIncidentReplayModelBase
> = {
  replayModels: TReplayModel[];
  incidentIds?: string[] | null;
  topN: number;
};

type ExecuteScheduleAnomalyIncidentReplayActionsInput<
  TReplayModel extends ScheduleAnomalyIncidentReplayModelBase
> = {
  selectedIncidentIds: string[];
  replayModelById: Map<string, TReplayModel>;
  dryRun: boolean;
  onReplay: (input: {
    incidentId: string;
    replayModel: TReplayModel;
  }) => Promise<void>;
};

export type ScheduleAnomalyIncidentReplayActionSummary = {
  replayed: number;
  dryRunCount: number;
  notFound: number;
  failed: number;
  items: ScheduleAnomalyIncidentReplayItem[];
};

type ReplayModelWithAuditPayloadShape = {
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
  resolutionCode: string | null;
  note: string | null;
  updatedAt: string;
  updatedBy: {
    actorId: string | null;
    actorRole: string;
  };
  history: Array<{
    action: string;
    state: ScheduleAnomalyIncidentLifecycleState;
    assigneeId: string | null;
    resolutionCode: string | null;
    note: string | null;
    updatedAt: string;
    updatedBy: {
      actorId: string | null;
      actorRole: string;
    };
  }>;
};

type BuildScheduleAnomalyIncidentReplayAuditPayloadInput<
  TReplayModel extends ReplayModelWithAuditPayloadShape
> = {
  incidentId: string;
  replayModel: TReplayModel;
  includeArchived: boolean;
  replayedAt: string;
};

type BuildScheduleAnomalyIncidentReplayGeneratedAuditPayloadInput = {
  replayedAt: string;
  dryRun: boolean;
  includeArchived: boolean;
  fromIso: string | null;
  toIso: string | null;
  topN: number;
  incidentIds: string[] | null;
  requested: number;
  summary: Pick<
    ScheduleAnomalyIncidentReplayActionSummary,
    "replayed" | "dryRunCount" | "notFound" | "failed"
  >;
};

type BuildScheduleAnomalyIncidentReplaySummaryCountsInput = Pick<
  ScheduleAnomalyIncidentReplayActionSummary,
  "replayed" | "dryRunCount" | "notFound" | "failed"
>;

type BuildScheduleAnomalyIncidentReplayResultInput = {
  replayedAt: string;
  dryRun: boolean;
  includeArchived: boolean;
  fromIso: string | null;
  toIso: string | null;
  topN: number;
  incidentIds: string[] | null;
  requested: number;
  summary: ScheduleAnomalyIncidentReplayActionSummary;
};

type ResolveScheduleAnomalyIncidentReplayMetaInput = {
  replayedAt: string;
  dryRun: boolean;
  includeArchived: boolean;
  from: Date | undefined;
  to: Date | undefined;
  topN: number;
  incidentIds: string[] | null;
  selectedIncidentIds: string[];
};

type FilterScheduleAnomalyIncidentReplayLogsByRangeInput<TLog extends { createdAt: Date }> = {
  logs: TLog[];
  from: Date | undefined;
  to: Date | undefined;
};

type BuildScheduleAnomalyIncidentReplayedAuditEntryInput<
  TReplayModel extends ReplayModelWithAuditPayloadShape & { organizationId?: string | null }
> = {
  incidentId: string;
  replayModel: TReplayModel;
  includeArchived: boolean;
  replayedAt: string;
  fallbackOrganizationId: string | undefined;
  actorRole: string;
  actorId: string | undefined;
};

type BuildScheduleAnomalyIncidentReplayGeneratedAuditEntryInput = {
  organizationId: string | undefined;
  actorRole: string;
  actorId: string | undefined;
  payload: ReturnType<typeof buildScheduleAnomalyIncidentReplayGeneratedAuditPayload>;
};

type MergeScheduleAnomalyIncidentReplayLastEscalationRequestedAtInput<TUpsertInput> = {
  upsertInput: TUpsertInput;
  lastEscalationRequestedAt: string | null | undefined;
};

type BuildScheduleAnomalyIncidentReplayPersistenceInput<
  TReplayModel extends ReplayModelWithAuditPayloadShape & { organizationId?: string | null },
  TUpsertInput extends Record<string, unknown>
> = {
  incidentId: string;
  replayModel: TReplayModel;
  includeArchived: boolean;
  replayedAt: string;
  lastEscalationRequestedAt: string | null | undefined;
  fallbackOrganizationId: string | undefined;
  actorRole: string;
  actorId: string | undefined;
  toUpsertInput: (replayModel: TReplayModel) => TUpsertInput;
};

export function selectScheduleAnomalyIncidentReplayTargets<
  TReplayModel extends ScheduleAnomalyIncidentReplayModelBase
>(
  input: SelectScheduleAnomalyIncidentReplayTargetsInput<TReplayModel>
) {
  const replayModelById = new Map(input.replayModels.map((item) => [item.incidentId, item]));
  const selectedIncidentIds = (
    input.incidentIds ??
    input.replayModels
      .slice()
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((item) => item.incidentId)
  ).slice(0, input.topN);
  return {
    replayModelById,
    selectedIncidentIds
  };
}

export async function executeScheduleAnomalyIncidentReplayActions<
  TReplayModel extends ScheduleAnomalyIncidentReplayModelBase
>(
  input: ExecuteScheduleAnomalyIncidentReplayActionsInput<TReplayModel>
): Promise<ScheduleAnomalyIncidentReplayActionSummary> {
  let replayed = 0;
  let dryRunCount = 0;
  let notFound = 0;
  let failed = 0;
  const items: ScheduleAnomalyIncidentReplayItem[] = [];

  for (const incidentId of input.selectedIncidentIds) {
    const replayModel = input.replayModelById.get(incidentId);
    if (!replayModel) {
      notFound += 1;
      items.push({
        incidentId,
        state: null,
        historyCount: 0,
        decision: "NOT_FOUND",
        reason: "incident not found in audit projection"
      });
      continue;
    }

    if (input.dryRun) {
      dryRunCount += 1;
      items.push({
        incidentId,
        state: replayModel.state,
        historyCount: replayModel.history.length,
        decision: "DRY_RUN",
        reason: "dry-run mode"
      });
      continue;
    }

    try {
      await input.onReplay({ incidentId, replayModel });
      replayed += 1;
      items.push({
        incidentId,
        state: replayModel.state,
        historyCount: replayModel.history.length,
        decision: "REPLAYED",
        reason: null
      });
    } catch (error) {
      failed += 1;
      items.push({
        incidentId,
        state: replayModel.state,
        historyCount: replayModel.history.length,
        decision: "FAILED",
        reason: error instanceof Error ? error.message : "unknown error"
      });
    }
  }

  return {
    replayed,
    dryRunCount,
    notFound,
    failed,
    items
  };
}

export function buildScheduleAnomalyIncidentReplayAuditPayload<
  TReplayModel extends ReplayModelWithAuditPayloadShape
>(input: BuildScheduleAnomalyIncidentReplayAuditPayloadInput<TReplayModel>) {
  return {
    incidentId: input.incidentId,
    state: input.replayModel.state,
    assigneeId: input.replayModel.assigneeId,
    resolutionCode: input.replayModel.resolutionCode,
    note: input.replayModel.note,
    updatedAt: input.replayModel.updatedAt,
    updatedByActorId: input.replayModel.updatedBy.actorId,
    updatedByActorRole: input.replayModel.updatedBy.actorRole,
    history: input.replayModel.history.map((entry) => ({
      action: entry.action,
      state: entry.state,
      assigneeId: entry.assigneeId,
      resolutionCode: entry.resolutionCode,
      note: entry.note,
      updatedAt: entry.updatedAt,
      updatedByActorId: entry.updatedBy.actorId,
      updatedByActorRole: entry.updatedBy.actorRole
    })),
    includeArchived: input.includeArchived,
    replayedAt: input.replayedAt
  };
}

export function buildScheduleAnomalyIncidentReplayGeneratedAuditPayload(
  input: BuildScheduleAnomalyIncidentReplayGeneratedAuditPayloadInput
) {
  return {
    replayedAt: input.replayedAt,
    dryRun: input.dryRun,
    includeArchived: input.includeArchived,
    from: input.fromIso,
    to: input.toIso,
    topN: input.topN,
    incidentIds: input.incidentIds,
    requested: input.requested,
    replayed: input.summary.replayed,
    dryRunCount: input.summary.dryRunCount,
    notFound: input.summary.notFound,
    failed: input.summary.failed
  };
}

export function buildScheduleAnomalyIncidentReplayedAuditEntry<
  TReplayModel extends ReplayModelWithAuditPayloadShape & { organizationId?: string | null }
>(input: BuildScheduleAnomalyIncidentReplayedAuditEntryInput<TReplayModel>) {
  return {
    action: ANOMALY_INCIDENT_REPLAY_AUDIT_ACTION,
    entityType: "WorkSchedule" as const,
    entityId: input.incidentId,
    organizationId: input.replayModel.organizationId ?? input.fallbackOrganizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: buildScheduleAnomalyIncidentReplayAuditPayload({
      incidentId: input.incidentId,
      replayModel: input.replayModel,
      includeArchived: input.includeArchived,
      replayedAt: input.replayedAt
    })
  };
}

export function buildScheduleAnomalyIncidentReplayGeneratedAuditEntry(
  input: BuildScheduleAnomalyIncidentReplayGeneratedAuditEntryInput
) {
  return {
    action: "scheduling.anomaly.incident.replay.generated",
    entityType: "WorkSchedule" as const,
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: input.payload
  };
}

export function filterScheduleAnomalyIncidentReplayLogsByRange<
  TLog extends { createdAt: Date }
>(input: FilterScheduleAnomalyIncidentReplayLogsByRangeInput<TLog>) {
  return input.logs.filter((entry) =>
    isWithinOptionalCreatedAtRange(entry.createdAt, {
      from: input.from,
      to: input.to
    })
  );
}

export function buildScheduleAnomalyIncidentReplaySummaryCounts(
  input: BuildScheduleAnomalyIncidentReplaySummaryCountsInput
) {
  return {
    replayed: input.replayed,
    dryRunCount: input.dryRunCount,
    notFound: input.notFound,
    failed: input.failed
  };
}

export function resolveScheduleAnomalyIncidentReplayMeta(
  input: ResolveScheduleAnomalyIncidentReplayMetaInput
) {
  return {
    replayedAt: input.replayedAt,
    dryRun: input.dryRun,
    includeArchived: input.includeArchived,
    fromIso: input.from?.toISOString() ?? null,
    toIso: input.to?.toISOString() ?? null,
    topN: input.topN,
    incidentIds: input.incidentIds,
    requested: input.selectedIncidentIds.length
  };
}

export function mergeScheduleAnomalyIncidentReplayLastEscalationRequestedAt<
  TUpsertInput extends Record<string, unknown>
>(input: MergeScheduleAnomalyIncidentReplayLastEscalationRequestedAtInput<TUpsertInput>) {
  return {
    ...input.upsertInput,
    lastEscalationRequestedAt: input.lastEscalationRequestedAt ?? null
  };
}

export function buildScheduleAnomalyIncidentReplayPersistenceInput<
  TReplayModel extends ReplayModelWithAuditPayloadShape & { organizationId?: string | null },
  TUpsertInput extends Record<string, unknown>
>(input: BuildScheduleAnomalyIncidentReplayPersistenceInput<TReplayModel, TUpsertInput>) {
  return {
    upsertInput: mergeScheduleAnomalyIncidentReplayLastEscalationRequestedAt({
      upsertInput: input.toUpsertInput(input.replayModel),
      lastEscalationRequestedAt: input.lastEscalationRequestedAt
    }),
    auditEntry: buildScheduleAnomalyIncidentReplayedAuditEntry({
      incidentId: input.incidentId,
      replayModel: input.replayModel,
      includeArchived: input.includeArchived,
      replayedAt: input.replayedAt,
      fallbackOrganizationId: input.fallbackOrganizationId,
      actorRole: input.actorRole,
      actorId: input.actorId
    })
  };
}

export function buildScheduleAnomalyIncidentReplayResult(
  input: BuildScheduleAnomalyIncidentReplayResultInput
): ScheduleAnomalyIncidentReplayResult {
  return {
    replayedAt: input.replayedAt,
    dryRun: input.dryRun,
    policy: {
      includeArchived: input.includeArchived,
      from: input.fromIso,
      to: input.toIso
    },
    filters: {
      topN: input.topN,
      incidentIds: input.incidentIds
    },
    counts: {
      requested: input.requested,
      replayed: input.summary.replayed,
      dryRun: input.summary.dryRunCount,
      notFound: input.summary.notFound,
      failed: input.summary.failed
    },
    items: input.summary.items
  };
}
