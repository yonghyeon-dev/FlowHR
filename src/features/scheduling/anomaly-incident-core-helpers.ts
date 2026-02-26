import { ServiceError } from "@/features/shared/service-error";

export type AnomalyIncidentLifecycleAction = "ACKNOWLEDGE" | "ASSIGN" | "RESOLVE";
export type AnomalyIncidentLifecycleState = "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
export type AnomalyIncidentResolutionCode =
  | "FALSE_POSITIVE"
  | "ATTENDANCE_CORRECTED"
  | "MANUAL_CONFIRMED"
  | "OTHER";

type IncidentHistoryEntryLike = {
  action: AnomalyIncidentLifecycleAction;
  state: AnomalyIncidentLifecycleState;
  assigneeId: string | null;
  resolutionCode: AnomalyIncidentResolutionCode | null;
  note: string | null;
  updatedAt: string;
  updatedBy: {
    actorId: string | null;
    actorRole: string;
  };
};

type ExistingIncidentReadModelLike = {
  assigneeId: string | null;
  resolutionCode: AnomalyIncidentResolutionCode | null;
  note: string | null;
  history: IncidentHistoryEntryLike[];
};

type NormalizeLifecycleMutationInput = {
  action: AnomalyIncidentLifecycleAction;
  assigneeId: string | undefined;
  resolutionCode: AnomalyIncidentResolutionCode | undefined;
  note: string | undefined;
};

export function normalizeAnomalyIncidentLifecycleMutationInput(
  input: NormalizeLifecycleMutationInput
) {
  const assigneeId = input.assigneeId?.trim();
  if (input.action === "ASSIGN" && !assigneeId) {
    throw new ServiceError(400, "assigneeId is required when action is ASSIGN");
  }
  if (input.action !== "ASSIGN" && assigneeId) {
    throw new ServiceError(400, "assigneeId is only allowed when action is ASSIGN");
  }

  const resolutionCode = input.action === "RESOLVE" ? (input.resolutionCode ?? "OTHER") : null;
  if (input.action !== "RESOLVE" && input.resolutionCode !== undefined) {
    throw new ServiceError(400, "resolutionCode is only allowed when action is RESOLVE");
  }

  return {
    assigneeId: assigneeId ?? null,
    resolutionCode,
    note: input.note?.trim() || null
  };
}

type BuildLifecycleUpdateResultInput = {
  action: AnomalyIncidentLifecycleAction;
  stateByAction: Record<AnomalyIncidentLifecycleAction, AnomalyIncidentLifecycleState>;
  existing: ExistingIncidentReadModelLike | null;
  normalizedAssigneeId: string | null;
  normalizedResolutionCode: AnomalyIncidentResolutionCode | null;
  normalizedNote: string | null;
  actorId: string | null;
  actorRole: string;
  updatedAt: string;
  maxHistory: number;
};

export function buildAnomalyIncidentLifecycleUpdateResult(
  input: BuildLifecycleUpdateResultInput
) {
  const state = input.stateByAction[input.action];
  const assigneeId =
    input.action === "ASSIGN" ? input.normalizedAssigneeId : (input.existing?.assigneeId ?? null);
  const resolutionCode =
    input.action === "RESOLVE"
      ? input.normalizedResolutionCode
      : (input.existing?.resolutionCode ?? null);
  const note = input.normalizedNote ?? input.existing?.note ?? null;
  const historyEntry: IncidentHistoryEntryLike = {
    action: input.action,
    state,
    assigneeId,
    resolutionCode,
    note,
    updatedAt: input.updatedAt,
    updatedBy: {
      actorId: input.actorId,
      actorRole: input.actorRole
    }
  };
  const history = [...(input.existing?.history ?? []), historyEntry].slice(-input.maxHistory);

  return {
    state,
    assigneeId,
    resolutionCode,
    note,
    historyEntry,
    history,
    payload: {
      incidentId: "",
      action: input.action,
      state,
      assigneeId,
      resolutionCode,
      note,
      updatedAt: input.updatedAt
    }
  };
}

type BuildIncidentListAuditPayloadInput = {
  state: AnomalyIncidentLifecycleState | undefined;
  assigneeId: string | null;
  topN: number;
  total: number;
  returned: number;
};

export function buildAnomalyIncidentListAuditPayload(input: BuildIncidentListAuditPayloadInput) {
  return {
    state: input.state ?? null,
    assigneeId: input.assigneeId,
    topN: input.topN,
    total: input.total,
    returned: input.returned
  };
}

type IncidentSlaCountsLike = {
  total: number;
  open: number;
  healthy: number;
  warning: number;
  breached: number;
  resolved: number;
};

type BuildIncidentSlaReportInput<TItem> = {
  generatedAt: string;
  asOfIso: string;
  state: AnomalyIncidentLifecycleState | undefined;
  assigneeId: string | null;
  topN: number;
  includeResolved: boolean;
  slaTargetMinutes: number;
  warningMinutes: number;
  counts: IncidentSlaCountsLike;
  items: TItem[];
};

export function buildAnomalyIncidentSlaReport<TItem>(input: BuildIncidentSlaReportInput<TItem>) {
  return {
    generatedAt: input.generatedAt,
    asOf: input.asOfIso,
    policy: {
      slaTargetMinutes: input.slaTargetMinutes,
      warningMinutes: input.warningMinutes,
      includeResolved: input.includeResolved
    },
    filters: {
      state: input.state ?? null,
      assigneeId: input.assigneeId,
      topN: input.topN
    },
    counts: input.counts,
    items: input.items
  };
}

type BuildIncidentSlaAuditPayloadInput = {
  asOfIso: string;
  state: AnomalyIncidentLifecycleState | undefined;
  assigneeId: string | null;
  topN: number;
  includeResolved: boolean;
  slaTargetMinutes: number;
  warningMinutes: number;
  counts: IncidentSlaCountsLike;
  returned: number;
};

export function buildAnomalyIncidentSlaAuditPayload(
  input: BuildIncidentSlaAuditPayloadInput
) {
  return {
    asOf: input.asOfIso,
    state: input.state ?? null,
    assigneeId: input.assigneeId,
    topN: input.topN,
    includeResolved: input.includeResolved,
    slaTargetMinutes: input.slaTargetMinutes,
    warningMinutes: input.warningMinutes,
    ...input.counts,
    returned: input.returned
  };
}
