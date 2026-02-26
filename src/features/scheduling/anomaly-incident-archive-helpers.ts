import type { ScheduleAnomalyIncidentEntity } from "@/features/shared/data-access";
import { parseIsoTimestampToMillis } from "@/features/scheduling/incident-normalizers";
import type { ScheduleAnomalyIncidentArchiveItem } from "@/features/scheduling/service";

type BuildScheduleAnomalyIncidentArchiveCandidatesInput = {
  incidents: ScheduleAnomalyIncidentEntity[];
  includeNonResolved: boolean;
  cutoffMillis: number;
  topN: number;
};

export type ScheduleAnomalyIncidentArchiveCandidates = {
  eligible: ScheduleAnomalyIncidentEntity[];
  candidates: ScheduleAnomalyIncidentEntity[];
  skippedState: number;
  skippedRecent: number;
};

type ExecuteScheduleAnomalyIncidentArchiveActionsInput = {
  candidates: ScheduleAnomalyIncidentEntity[];
  dryRun: boolean;
  deleteIncident: (input: { incidentId: string }) => Promise<boolean>;
  onArchived: (input: {
    candidate: ScheduleAnomalyIncidentEntity;
    archivedAt: string;
  }) => Promise<void>;
};

export type ScheduleAnomalyIncidentArchiveActionSummary = {
  archived: number;
  dryRunCount: number;
  failed: number;
  items: ScheduleAnomalyIncidentArchiveItem[];
};

export function buildScheduleAnomalyIncidentArchiveCandidates(
  input: BuildScheduleAnomalyIncidentArchiveCandidatesInput
): ScheduleAnomalyIncidentArchiveCandidates {
  const sorted = input.incidents.slice().sort((left, right) => {
    const byUpdatedAt = left.updatedAt.localeCompare(right.updatedAt);
    if (byUpdatedAt !== 0) {
      return byUpdatedAt;
    }
    return left.incidentId.localeCompare(right.incidentId);
  });

  let skippedState = 0;
  let skippedRecent = 0;
  const eligible: ScheduleAnomalyIncidentEntity[] = [];
  for (const incident of sorted) {
    if (!input.includeNonResolved && incident.state !== "RESOLVED") {
      skippedState += 1;
      continue;
    }
    const updatedAtMillis = parseIsoTimestampToMillis(incident.updatedAt);
    if (updatedAtMillis === null || updatedAtMillis > input.cutoffMillis) {
      skippedRecent += 1;
      continue;
    }
    eligible.push(incident);
  }

  return {
    eligible,
    candidates: eligible.slice(0, input.topN),
    skippedState,
    skippedRecent
  };
}

export async function executeScheduleAnomalyIncidentArchiveActions(
  input: ExecuteScheduleAnomalyIncidentArchiveActionsInput
): Promise<ScheduleAnomalyIncidentArchiveActionSummary> {
  let archived = 0;
  let dryRunCount = 0;
  let failed = 0;
  const items: ScheduleAnomalyIncidentArchiveItem[] = [];

  for (const candidate of input.candidates) {
    if (input.dryRun) {
      dryRunCount += 1;
      items.push({
        incidentId: candidate.incidentId,
        state: candidate.state,
        assigneeId: candidate.assigneeId,
        updatedAt: candidate.updatedAt,
        decision: "DRY_RUN",
        reason: "dry-run mode"
      });
      continue;
    }

    try {
      const deleted = await input.deleteIncident({ incidentId: candidate.incidentId });
      if (!deleted) {
        failed += 1;
        items.push({
          incidentId: candidate.incidentId,
          state: candidate.state,
          assigneeId: candidate.assigneeId,
          updatedAt: candidate.updatedAt,
          decision: "FAILED",
          reason: "incident not found"
        });
        continue;
      }

      const archivedAt = new Date().toISOString();
      await input.onArchived({ candidate, archivedAt });
      archived += 1;
      items.push({
        incidentId: candidate.incidentId,
        state: candidate.state,
        assigneeId: candidate.assigneeId,
        updatedAt: candidate.updatedAt,
        decision: "ARCHIVED",
        reason: null
      });
    } catch (error) {
      failed += 1;
      items.push({
        incidentId: candidate.incidentId,
        state: candidate.state,
        assigneeId: candidate.assigneeId,
        updatedAt: candidate.updatedAt,
        decision: "FAILED",
        reason: error instanceof Error ? error.message : "unknown error"
      });
    }
  }

  return { archived, dryRunCount, failed, items };
}
