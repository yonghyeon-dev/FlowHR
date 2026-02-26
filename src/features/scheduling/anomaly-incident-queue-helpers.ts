import { parseIsoTimestampToMillis } from "@/features/scheduling/incident-normalizers";
import { toSlaStatusWeight } from "@/features/scheduling/incident-read-model-helpers";
import type {
  ScheduleAnomalyIncidentLifecycleState,
  ScheduleAnomalyIncidentReadModel,
  ScheduleAnomalyIncidentSlaItem,
  ScheduleAnomalyIncidentSlaStatus
} from "@/features/scheduling/service";

type IncidentQueueFilterInput = {
  state?: ScheduleAnomalyIncidentLifecycleState;
  assigneeId?: string;
};

type BuildScheduleAnomalyIncidentSlaQueueInput = IncidentQueueFilterInput & {
  readModels: ScheduleAnomalyIncidentReadModel[];
  includeResolved: boolean;
  slaTargetMinutes: number;
  warningMinutes: number;
  asOfMillis: number;
};

type ScheduleAnomalyIncidentSlaCounts = {
  total: number;
  open: number;
  healthy: number;
  warning: number;
  breached: number;
  resolved: number;
};

function resolveScheduleAnomalyIncidentSlaStatus(input: {
  state: ScheduleAnomalyIncidentLifecycleState;
  elapsedMinutes: number;
  slaTargetMinutes: number;
  warningMinutes: number;
}): ScheduleAnomalyIncidentSlaStatus {
  if (input.state === "RESOLVED") {
    return "RESOLVED";
  }
  if (input.elapsedMinutes >= input.slaTargetMinutes) {
    return "BREACHED";
  }
  if (input.elapsedMinutes >= input.warningMinutes) {
    return "WARNING";
  }
  return "HEALTHY";
}

export function filterScheduleAnomalyIncidentQueue(
  readModels: ScheduleAnomalyIncidentReadModel[],
  input: IncidentQueueFilterInput
) {
  return readModels
    .filter((item) => (input.state ? item.state === input.state : true))
    .filter((item) => (input.assigneeId ? item.assigneeId === input.assigneeId : true))
    .sort((left, right) => {
      const byUpdatedAt = right.updatedAt.localeCompare(left.updatedAt);
      if (byUpdatedAt !== 0) {
        return byUpdatedAt;
      }
      return left.incidentId.localeCompare(right.incidentId);
    });
}

export function buildScheduleAnomalyIncidentSlaQueue(input: BuildScheduleAnomalyIncidentSlaQueueInput): {
  matched: ScheduleAnomalyIncidentSlaItem[];
  counts: ScheduleAnomalyIncidentSlaCounts;
} {
  const matched = filterScheduleAnomalyIncidentQueue(input.readModels, {
    state: input.state,
    assigneeId: input.assigneeId
  })
    .map((item) => {
      const updatedAtMillis = parseIsoTimestampToMillis(item.updatedAt) ?? input.asOfMillis;
      const elapsedMinutes = Math.max(0, Math.floor((input.asOfMillis - updatedAtMillis) / 60_000));
      const status = resolveScheduleAnomalyIncidentSlaStatus({
        state: item.state,
        elapsedMinutes,
        slaTargetMinutes: input.slaTargetMinutes,
        warningMinutes: input.warningMinutes
      });
      return {
        incidentId: item.incidentId,
        state: item.state,
        assigneeId: item.assigneeId,
        updatedAt: item.updatedAt,
        elapsedMinutes,
        slaTargetMinutes: input.slaTargetMinutes,
        warningMinutes: input.warningMinutes,
        status,
        updatedBy: { ...item.updatedBy },
        historyCount: item.history.length
      };
    })
    .filter((item) => (input.includeResolved ? true : item.state !== "RESOLVED"))
    .sort((left, right) => {
      const byStatus = toSlaStatusWeight(right.status) - toSlaStatusWeight(left.status);
      if (byStatus !== 0) {
        return byStatus;
      }
      if (left.elapsedMinutes !== right.elapsedMinutes) {
        return right.elapsedMinutes - left.elapsedMinutes;
      }
      const byUpdatedAt = left.updatedAt.localeCompare(right.updatedAt);
      if (byUpdatedAt !== 0) {
        return byUpdatedAt;
      }
      return left.incidentId.localeCompare(right.incidentId);
    });

  const counts = {
    total: matched.length,
    open: matched.filter((item) => item.status !== "RESOLVED").length,
    healthy: matched.filter((item) => item.status === "HEALTHY").length,
    warning: matched.filter((item) => item.status === "WARNING").length,
    breached: matched.filter((item) => item.status === "BREACHED").length,
    resolved: matched.filter((item) => item.status === "RESOLVED").length
  };

  return { matched, counts };
}
