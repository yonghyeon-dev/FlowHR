import type { ScheduleAnomalyIncidentEntity } from "@/features/shared/data-access";
import { ANOMALY_INCIDENT_ARCHIVE_AUDIT_ACTION } from "@/features/scheduling/incident-audit-projection";
import { parseIsoTimestampToMillis } from "@/features/scheduling/incident-normalizers";
import type {
  ScheduleAnomalyIncidentArchiveItem,
  ScheduleAnomalyIncidentArchiveResult,
  ScheduleAnomalyIncidentLifecycleState
} from "@/features/scheduling/service";

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

type BuildScheduleAnomalyIncidentArchiveAuditPayloadInput = {
  candidate: Pick<
    ScheduleAnomalyIncidentEntity,
    "incidentId" | "state" | "assigneeId" | "updatedAt"
  >;
  archivedAt: string;
  asOfIso: string;
  olderThanMinutes: number;
  archiveReason: string | null;
};

type BuildScheduleAnomalyIncidentArchiveGeneratedAuditPayloadInput = {
  archivedAt: string;
  dryRun: boolean;
  asOfIso: string;
  olderThanMinutes: number;
  includeNonResolved: boolean;
  stateFilter: ScheduleAnomalyIncidentLifecycleState | undefined;
  assigneeFilter: string | undefined;
  topN: number;
  archiveReason: string | null;
  total: number;
  eligible: number;
  candidates: number;
  summary: Pick<
    ScheduleAnomalyIncidentArchiveActionSummary,
    "archived" | "dryRunCount" | "failed"
  >;
  skippedState: number;
  skippedRecent: number;
};

type BuildScheduleAnomalyIncidentArchiveSummaryCountsInput = Pick<
  ScheduleAnomalyIncidentArchiveActionSummary,
  "archived" | "dryRunCount" | "failed"
>;

type BuildScheduleAnomalyIncidentArchiveResultInput = {
  archivedAt: string;
  dryRun: boolean;
  olderThanMinutes: number;
  includeNonResolved: boolean;
  archiveReason: string | null;
  stateFilter: ScheduleAnomalyIncidentLifecycleState | undefined;
  assigneeFilter: string | undefined;
  topN: number;
  total: number;
  eligible: number;
  candidates: number;
  summary: ScheduleAnomalyIncidentArchiveActionSummary;
  skippedState: number;
  skippedRecent: number;
};

type ResolveScheduleAnomalyIncidentArchiveMetaInput = {
  archivedAt: string;
  dryRun: boolean;
  asOfIso: string;
  olderThanMinutes: number;
  includeNonResolved: boolean;
  stateFilter: ScheduleAnomalyIncidentLifecycleState | undefined;
  assigneeFilter: string | undefined;
  topN: number;
  archiveReason: string | null;
  total: number;
  eligible: number;
  candidates: number;
};

type BuildScheduleAnomalyIncidentArchiveGeneratedAuditEntryInput = {
  organizationId: string | undefined;
  actorRole: string;
  actorId: string | undefined;
  payload: ReturnType<typeof buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload>;
};

type BuildScheduleAnomalyIncidentArchivedAuditEntryInput = {
  candidate: Pick<
    ScheduleAnomalyIncidentEntity,
    "incidentId" | "state" | "assigneeId" | "updatedAt" | "organizationId"
  >;
  archivedAt: string;
  asOfIso: string;
  olderThanMinutes: number;
  archiveReason: string | null;
  fallbackOrganizationId: string | undefined;
  actorRole: string;
  actorId: string | undefined;
};

type BuildScheduleAnomalyIncidentArchivedAuditAppenderInput = {
  asOfIso: string;
  olderThanMinutes: number;
  archiveReason: string | null;
  fallbackOrganizationId: string | undefined;
  actorRole: string;
  actorId: string | undefined;
  appendAuditEntry: (
    entry: ReturnType<typeof buildScheduleAnomalyIncidentArchivedAuditEntry>
  ) => Promise<void>;
};

type BuildScheduleAnomalyIncidentArchiveDeleteIncidentCallbackInput = {
  organizationId: string | undefined;
  deleteIncident: (input: { incidentId: string; organizationId: string | undefined }) => Promise<boolean>;
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

export function buildScheduleAnomalyIncidentArchiveAuditPayload(
  input: BuildScheduleAnomalyIncidentArchiveAuditPayloadInput
) {
  return {
    incidentId: input.candidate.incidentId,
    state: input.candidate.state,
    assigneeId: input.candidate.assigneeId,
    updatedAt: input.candidate.updatedAt,
    archivedAt: input.archivedAt,
    asOf: input.asOfIso,
    olderThanMinutes: input.olderThanMinutes,
    reason: input.archiveReason
  };
}

export function buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload(
  input: BuildScheduleAnomalyIncidentArchiveGeneratedAuditPayloadInput
) {
  return {
    archivedAt: input.archivedAt,
    dryRun: input.dryRun,
    asOf: input.asOfIso,
    olderThanMinutes: input.olderThanMinutes,
    includeNonResolved: input.includeNonResolved,
    state: input.stateFilter ?? null,
    assigneeId: input.assigneeFilter ?? null,
    topN: input.topN,
    reason: input.archiveReason,
    total: input.total,
    eligible: input.eligible,
    candidates: input.candidates,
    archived: input.summary.archived,
    dryRunCount: input.summary.dryRunCount,
    skippedState: input.skippedState,
    skippedRecent: input.skippedRecent,
    failed: input.summary.failed
  };
}

export function buildScheduleAnomalyIncidentArchiveGeneratedAuditEntry(
  input: BuildScheduleAnomalyIncidentArchiveGeneratedAuditEntryInput
) {
  return {
    action: "scheduling.anomaly.incident.archive.generated",
    entityType: "WorkSchedule" as const,
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: input.payload
  };
}

export function resolveScheduleAnomalyIncidentArchiveMeta(
  input: ResolveScheduleAnomalyIncidentArchiveMetaInput
) {
  return {
    archivedAt: input.archivedAt,
    dryRun: input.dryRun,
    asOfIso: input.asOfIso,
    olderThanMinutes: input.olderThanMinutes,
    includeNonResolved: input.includeNonResolved,
    stateFilter: input.stateFilter,
    assigneeFilter: input.assigneeFilter,
    topN: input.topN,
    archiveReason: input.archiveReason,
    total: input.total,
    eligible: input.eligible,
    candidates: input.candidates
  };
}

export function buildScheduleAnomalyIncidentArchiveSummaryCounts(
  input: BuildScheduleAnomalyIncidentArchiveSummaryCountsInput
) {
  return {
    archived: input.archived,
    dryRunCount: input.dryRunCount,
    failed: input.failed
  };
}

export function buildScheduleAnomalyIncidentArchivedAuditEntry(
  input: BuildScheduleAnomalyIncidentArchivedAuditEntryInput
) {
  return {
    action: ANOMALY_INCIDENT_ARCHIVE_AUDIT_ACTION,
    entityType: "WorkSchedule" as const,
    entityId: input.candidate.incidentId,
    organizationId: input.candidate.organizationId ?? input.fallbackOrganizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: buildScheduleAnomalyIncidentArchiveAuditPayload({
      candidate: input.candidate,
      archivedAt: input.archivedAt,
      asOfIso: input.asOfIso,
      olderThanMinutes: input.olderThanMinutes,
      archiveReason: input.archiveReason
    })
  };
}

export function buildScheduleAnomalyIncidentArchivedAuditAppender(
  input: BuildScheduleAnomalyIncidentArchivedAuditAppenderInput
) {
  return async ({
    candidate,
    archivedAt
  }: {
    candidate: BuildScheduleAnomalyIncidentArchivedAuditEntryInput["candidate"];
    archivedAt: string;
  }) => {
    await input.appendAuditEntry(
      buildScheduleAnomalyIncidentArchivedAuditEntry({
        candidate,
        archivedAt,
        asOfIso: input.asOfIso,
        olderThanMinutes: input.olderThanMinutes,
        archiveReason: input.archiveReason,
        fallbackOrganizationId: input.fallbackOrganizationId,
        actorRole: input.actorRole,
        actorId: input.actorId
      })
    );
  };
}

export function buildScheduleAnomalyIncidentArchiveDeleteIncidentCallback(
  input: BuildScheduleAnomalyIncidentArchiveDeleteIncidentCallbackInput
) {
  return async ({ incidentId }: { incidentId: string }) =>
    input.deleteIncident({
      incidentId,
      organizationId: input.organizationId
    });
}

export function buildScheduleAnomalyIncidentArchiveResult(
  input: BuildScheduleAnomalyIncidentArchiveResultInput
): ScheduleAnomalyIncidentArchiveResult {
  return {
    archivedAt: input.archivedAt,
    dryRun: input.dryRun,
    policy: {
      olderThanMinutes: input.olderThanMinutes,
      includeNonResolved: input.includeNonResolved,
      reason: input.archiveReason
    },
    filters: {
      state: input.stateFilter ?? null,
      assigneeId: input.assigneeFilter ?? null,
      topN: input.topN
    },
    counts: {
      total: input.total,
      eligible: input.eligible,
      candidates: input.candidates,
      archived: input.summary.archived,
      dryRun: input.summary.dryRunCount,
      skippedState: input.skippedState,
      skippedRecent: input.skippedRecent,
      failed: input.summary.failed
    },
    items: input.summary.items
  };
}
