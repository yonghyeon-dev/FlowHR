import { parseIsoTimestampToMillis } from "@/features/scheduling/incident-normalizers";
import type {
  ScheduleAnomalyIncidentEscalationResult,
  ScheduleAnomalyIncidentEscalationItem,
  ScheduleAnomalyIncidentSlaItem
} from "@/features/scheduling/service";

type StoredScheduleAnomalyIncidentLike = {
  incidentId: string;
  lastEscalationRequestedAt: string | null;
};

type ExecuteScheduleAnomalyIncidentEscalationRequestsInput = {
  candidates: ScheduleAnomalyIncidentSlaItem[];
  dryRun: boolean;
  cooldownWindowStartMillis: number;
  cooldownMinutes: number;
  latestRequestedAtMillisByIncident: Map<string, number>;
  requestEscalation: (input: {
    candidate: ScheduleAnomalyIncidentSlaItem;
    requestedAt: string;
  }) => Promise<void>;
  onRequestFailed?: (input: {
    candidate: ScheduleAnomalyIncidentSlaItem;
    error: string;
  }) => Promise<void>;
};

export type ScheduleAnomalyIncidentEscalationExecutionSummary = {
  requested: number;
  skippedCooldown: number;
  failed: number;
  items: ScheduleAnomalyIncidentEscalationItem[];
};

type BuildScheduleAnomalyIncidentEscalationSummaryPayloadInput = {
  requestedAt: string;
  dryRun: boolean;
  includeResolved: boolean;
  includeWarning: boolean;
  cooldownMinutes: number;
  escalationChannel: string;
  state: string | undefined;
  assigneeId: string | undefined;
  topN: number | undefined;
  candidates: number;
  executionSummary: Pick<
    ScheduleAnomalyIncidentEscalationExecutionSummary,
    "requested" | "skippedCooldown" | "failed"
  >;
};

type BuildScheduleAnomalyIncidentEscalationResultInput = {
  requestedAt: string;
  dryRun: boolean;
  slaTargetMinutes: number;
  warningMinutes: number;
  includeResolved: boolean;
  includeWarning: boolean;
  cooldownMinutes: number;
  escalationChannel: string;
  candidates: number;
  executionSummary: ScheduleAnomalyIncidentEscalationExecutionSummary;
};

type BuildScheduleAnomalyIncidentEscalationRequestPayloadInput = {
  candidate: ScheduleAnomalyIncidentSlaItem;
  cooldownMinutes: number;
  escalationChannel: string;
  requestedAt: string;
};

type BuildScheduleAnomalyIncidentEscalationRequestFailedPayloadInput = {
  candidate: ScheduleAnomalyIncidentSlaItem;
  cooldownMinutes: number;
  escalationChannel: string;
  error: string;
};

export function buildLatestScheduleAnomalyEscalationRequestedAtMillisByIncident(
  storedIncidents: StoredScheduleAnomalyIncidentLike[]
) {
  const latestRequestedAtMillisByIncident = new Map<string, number>();
  for (const incident of storedIncidents) {
    if (!incident.lastEscalationRequestedAt) {
      continue;
    }
    const requestedAtMillis = parseIsoTimestampToMillis(incident.lastEscalationRequestedAt);
    if (requestedAtMillis === null) {
      continue;
    }
    const previous = latestRequestedAtMillisByIncident.get(incident.incidentId);
    if (previous === undefined || requestedAtMillis > previous) {
      latestRequestedAtMillisByIncident.set(incident.incidentId, requestedAtMillis);
    }
  }
  return latestRequestedAtMillisByIncident;
}

export async function executeScheduleAnomalyIncidentEscalationRequests(
  input: ExecuteScheduleAnomalyIncidentEscalationRequestsInput
): Promise<ScheduleAnomalyIncidentEscalationExecutionSummary> {
  let requested = 0;
  let skippedCooldown = 0;
  let failed = 0;
  const items: ScheduleAnomalyIncidentEscalationItem[] = [];

  for (const candidate of input.candidates) {
    const lastRequestedAtMillis = input.latestRequestedAtMillisByIncident.get(candidate.incidentId);
    if (
      lastRequestedAtMillis !== undefined &&
      lastRequestedAtMillis >= input.cooldownWindowStartMillis
    ) {
      skippedCooldown += 1;
      items.push({
        incidentId: candidate.incidentId,
        state: candidate.state,
        status: candidate.status,
        elapsedMinutes: candidate.elapsedMinutes,
        assigneeId: candidate.assigneeId,
        decision: "SKIPPED_COOLDOWN",
        reason: `cooldown active (${input.cooldownMinutes}m)`
      });
      continue;
    }

    if (input.dryRun) {
      items.push({
        incidentId: candidate.incidentId,
        state: candidate.state,
        status: candidate.status,
        elapsedMinutes: candidate.elapsedMinutes,
        assigneeId: candidate.assigneeId,
        decision: "DRY_RUN",
        reason: "dry-run mode"
      });
      continue;
    }

    const requestedAt = new Date().toISOString();
    try {
      await input.requestEscalation({ candidate, requestedAt });
      requested += 1;
      input.latestRequestedAtMillisByIncident.set(candidate.incidentId, Date.parse(requestedAt));
      items.push({
        incidentId: candidate.incidentId,
        state: candidate.state,
        status: candidate.status,
        elapsedMinutes: candidate.elapsedMinutes,
        assigneeId: candidate.assigneeId,
        decision: "REQUESTED",
        reason: null
      });
    } catch (error) {
      failed += 1;
      const reason = error instanceof Error ? error.message : "unknown error";
      items.push({
        incidentId: candidate.incidentId,
        state: candidate.state,
        status: candidate.status,
        elapsedMinutes: candidate.elapsedMinutes,
        assigneeId: candidate.assigneeId,
        decision: "FAILED",
        reason
      });

      if (input.onRequestFailed) {
        try {
          await input.onRequestFailed({ candidate, error: reason });
        } catch {
          // Non-blocking failure path for escalation command telemetry.
        }
      }
    }
  }

  return { requested, skippedCooldown, failed, items };
}

export function buildScheduleAnomalyIncidentEscalationSummaryPayload(
  input: BuildScheduleAnomalyIncidentEscalationSummaryPayloadInput
) {
  return {
    requestedAt: input.requestedAt,
    dryRun: input.dryRun,
    includeResolved: input.includeResolved,
    includeWarning: input.includeWarning,
    cooldownMinutes: input.cooldownMinutes,
    escalationChannel: input.escalationChannel,
    state: input.state ?? null,
    assigneeId: input.assigneeId?.trim() ?? null,
    topN: input.topN ?? 50,
    candidates: input.candidates,
    requested: input.executionSummary.requested,
    skippedCooldown: input.executionSummary.skippedCooldown,
    failed: input.executionSummary.failed
  };
}

export function buildScheduleAnomalyIncidentEscalationResult(
  input: BuildScheduleAnomalyIncidentEscalationResultInput
): ScheduleAnomalyIncidentEscalationResult {
  return {
    requestedAt: input.requestedAt,
    dryRun: input.dryRun,
    policy: {
      slaTargetMinutes: input.slaTargetMinutes,
      warningMinutes: input.warningMinutes,
      includeResolved: input.includeResolved,
      includeWarning: input.includeWarning,
      cooldownMinutes: input.cooldownMinutes,
      escalationChannel: input.escalationChannel
    },
    counts: {
      candidates: input.candidates,
      requested: input.executionSummary.requested,
      skippedCooldown: input.executionSummary.skippedCooldown,
      failed: input.executionSummary.failed
    },
    items: input.executionSummary.items
  };
}

export function buildScheduleAnomalyIncidentEscalationRequestPayload(
  input: BuildScheduleAnomalyIncidentEscalationRequestPayloadInput
) {
  return {
    incidentId: input.candidate.incidentId,
    state: input.candidate.state,
    status: input.candidate.status,
    elapsedMinutes: input.candidate.elapsedMinutes,
    assigneeId: input.candidate.assigneeId,
    slaTargetMinutes: input.candidate.slaTargetMinutes,
    warningMinutes: input.candidate.warningMinutes,
    cooldownMinutes: input.cooldownMinutes,
    escalationChannel: input.escalationChannel,
    requestedAt: input.requestedAt
  };
}

export function buildScheduleAnomalyIncidentEscalationRequestFailedPayload(
  input: BuildScheduleAnomalyIncidentEscalationRequestFailedPayloadInput
) {
  return {
    incidentId: input.candidate.incidentId,
    status: input.candidate.status,
    elapsedMinutes: input.candidate.elapsedMinutes,
    cooldownMinutes: input.cooldownMinutes,
    escalationChannel: input.escalationChannel,
    error: input.error
  };
}
