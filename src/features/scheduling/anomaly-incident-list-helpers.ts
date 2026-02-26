import { filterScheduleAnomalyIncidentQueue } from "@/features/scheduling/anomaly-incident-queue-helpers";
import { cloneScheduleAnomalyIncidentReadModel } from "@/features/scheduling/incident-read-model-helpers";
import type {
  ScheduleAnomalyIncidentLifecycleState,
  ScheduleAnomalyIncidentReadModel
} from "@/features/scheduling/service";

type BuildScheduleAnomalyIncidentListResultInput = {
  readModels: ScheduleAnomalyIncidentReadModel[];
  topN: number;
  state?: ScheduleAnomalyIncidentLifecycleState;
  assigneeId?: string;
};

export function buildScheduleAnomalyIncidentListResult(
  input: BuildScheduleAnomalyIncidentListResultInput
) {
  const matched = filterScheduleAnomalyIncidentQueue(input.readModels, {
    state: input.state,
    assigneeId: input.assigneeId
  });
  const items = matched.slice(0, input.topN).map(cloneScheduleAnomalyIncidentReadModel);
  return {
    total: matched.length,
    items
  };
}
