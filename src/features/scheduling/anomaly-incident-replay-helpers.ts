import type {
  ScheduleAnomalyIncidentLifecycleState,
  ScheduleAnomalyIncidentReplayItem
} from "@/features/scheduling/service";

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
