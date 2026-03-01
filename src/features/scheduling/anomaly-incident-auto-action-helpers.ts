import type {
  ScheduleAnomalyIncidentAutoActionItem,
  ScheduleAnomalyIncidentAutoActionResult,
  ScheduleAnomalyIncidentAutoAssignMode,
  ScheduleAnomalyIncidentEscalationDecision,
  ScheduleAnomalyIncidentEscalationResult,
  ScheduleAnomalyIncidentEscalationItem,
  ScheduleAnomalyIncidentLifecycleState
} from "@/features/scheduling/service";

type AssignScheduleAnomalyIncidentInput = {
  incidentId: string;
  previousAssigneeId: string | null;
  escalationDecision: ScheduleAnomalyIncidentEscalationDecision;
};

type AssignScheduleAnomalyIncidentResult = {
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
};

type ExecuteScheduleAnomalyIncidentAutoActionAssignmentsInput = {
  escalationItems: ScheduleAnomalyIncidentEscalationItem[];
  escalationDryRun: boolean;
  autoAssigneeId: string;
  autoAssignMode: ScheduleAnomalyIncidentAutoAssignMode;
  assignIncident: (
    input: AssignScheduleAnomalyIncidentInput
  ) => Promise<AssignScheduleAnomalyIncidentResult>;
  onAssignFailed?: (input: {
    incidentId: string;
    previousAssigneeId: string | null;
    escalationDecision: ScheduleAnomalyIncidentEscalationDecision;
    error: string;
  }) => Promise<void>;
};

type BuildScheduleAnomalyIncidentAutoActionAssignIncidentCallbackInput = {
  autoAssigneeId: string;
  autoAssignNote: string | null;
  updateLifecycle: (input: {
    incidentId: string;
    assigneeId: string;
    note: string | undefined;
  }) => Promise<AssignScheduleAnomalyIncidentResult>;
};

export type ScheduleAnomalyIncidentAutoActionAssignmentSummary = {
  escalated: number;
  assigned: number;
  skippedEscalation: number;
  skippedAssigned: number;
  failed: number;
  dryRun: number;
  items: ScheduleAnomalyIncidentAutoActionItem[];
};

type ScheduleAnomalyIncidentAutoActionNotificationAuditInput = {
  action: string;
  payload: Record<string, unknown>;
};

type NotifyScheduleAnomalyIncidentAutoActionExecutionInput = {
  dryRun: boolean;
  executedAt: string;
  candidates: number;
  escalated: number;
  assigned: number;
  failed: number;
  summaryPayload: Record<string, unknown>;
  items: ScheduleAnomalyIncidentAutoActionItem[];
  publishExecuted: (payload: Record<string, unknown>) => Promise<void>;
  appendAudit: (input: ScheduleAnomalyIncidentAutoActionNotificationAuditInput) => Promise<void>;
};

type BuildScheduleAnomalyIncidentAutoActionNotificationAuditPayloadInput = {
  executedAt: string;
  candidates: number;
  escalated: number;
  assigned: number;
  failed: number;
  error?: string;
};

type ResolveScheduleAnomalyIncidentAutoActionNotificationMetaInput = {
  dryRun: boolean;
  executedAt: string;
  candidates: number;
  escalated: number;
  assigned: number;
  failed: number;
};

type BuildScheduleAnomalyIncidentAutoActionExecutedEventPayloadInput = {
  summaryPayload: Record<string, unknown>;
  items: ScheduleAnomalyIncidentAutoActionItem[];
};

type BuildScheduleAnomalyIncidentAutoActionSummaryPayloadInput = {
  executedAt: string;
  state: ScheduleAnomalyIncidentLifecycleState | undefined;
  assigneeId: string | undefined;
  topN: number | undefined;
  escalation: Pick<ScheduleAnomalyIncidentEscalationResult, "dryRun" | "policy" | "counts">;
  autoAssigneeId: string;
  autoAssignMode: ScheduleAnomalyIncidentAutoAssignMode;
  autoAssignNote: string | null;
  assignmentSummary: Pick<
    ScheduleAnomalyIncidentAutoActionAssignmentSummary,
    "escalated" | "assigned" | "skippedEscalation" | "skippedAssigned" | "failed" | "dryRun"
  >;
};

type BuildScheduleAnomalyIncidentAutoActionResultInput = {
  executedAt: string;
  escalation: Pick<ScheduleAnomalyIncidentEscalationResult, "dryRun" | "policy" | "counts">;
  autoAssigneeId: string;
  autoAssignMode: ScheduleAnomalyIncidentAutoAssignMode;
  autoAssignNote: string | null;
  assignmentSummary: Pick<
    ScheduleAnomalyIncidentAutoActionAssignmentSummary,
    "escalated" | "assigned" | "skippedEscalation" | "skippedAssigned" | "failed" | "dryRun"
  >;
  items: ScheduleAnomalyIncidentAutoActionItem[];
};

type BuildScheduleAnomalyIncidentAutoActionAssignFailedPayloadInput = {
  incidentId: string;
  previousAssigneeId: string | null;
  autoAssigneeId: string;
  autoAssignMode: ScheduleAnomalyIncidentAutoAssignMode;
  escalationDecision: ScheduleAnomalyIncidentEscalationDecision;
  error: string;
};

function isEscalatedDecision(decision: ScheduleAnomalyIncidentEscalationDecision) {
  return decision === "REQUESTED" || decision === "DRY_RUN";
}

export function buildScheduleAnomalyIncidentAutoActionAssignIncidentCallback(
  input: BuildScheduleAnomalyIncidentAutoActionAssignIncidentCallbackInput
) {
  return async ({
    incidentId
  }: AssignScheduleAnomalyIncidentInput): Promise<AssignScheduleAnomalyIncidentResult> => {
    const updated = await input.updateLifecycle({
      incidentId,
      assigneeId: input.autoAssigneeId,
      note: input.autoAssignNote ?? undefined
    });
    return {
      state: updated.state,
      assigneeId: updated.assigneeId
    };
  };
}

export async function executeScheduleAnomalyIncidentAutoActionAssignments(
  input: ExecuteScheduleAnomalyIncidentAutoActionAssignmentsInput
): Promise<ScheduleAnomalyIncidentAutoActionAssignmentSummary> {
  let assigned = 0;
  let skippedEscalation = 0;
  let skippedAssigned = 0;
  let failed = 0;
  let dryRun = 0;
  const items: ScheduleAnomalyIncidentAutoActionItem[] = [];

  for (const escalationItem of input.escalationItems) {
    const previousAssigneeId = escalationItem.assigneeId ?? null;
    if (!isEscalatedDecision(escalationItem.decision)) {
      skippedEscalation += 1;
      items.push({
        incidentId: escalationItem.incidentId,
        state: escalationItem.state,
        status: escalationItem.status,
        escalationDecision: escalationItem.decision,
        previousAssigneeId,
        assignedAssigneeId: previousAssigneeId,
        decision: "SKIPPED_ESCALATION",
        reason: escalationItem.reason ?? `escalation decision ${escalationItem.decision}`
      });
      continue;
    }

    if (input.autoAssignMode === "ASSIGN_IF_UNASSIGNED" && previousAssigneeId) {
      skippedAssigned += 1;
      items.push({
        incidentId: escalationItem.incidentId,
        state: escalationItem.state,
        status: escalationItem.status,
        escalationDecision: escalationItem.decision,
        previousAssigneeId,
        assignedAssigneeId: previousAssigneeId,
        decision: "SKIPPED_ALREADY_ASSIGNED",
        reason: "incident already has assignee"
      });
      continue;
    }

    if (input.autoAssignMode === "FORCE_ASSIGN" && previousAssigneeId === input.autoAssigneeId) {
      skippedAssigned += 1;
      items.push({
        incidentId: escalationItem.incidentId,
        state: escalationItem.state,
        status: escalationItem.status,
        escalationDecision: escalationItem.decision,
        previousAssigneeId,
        assignedAssigneeId: previousAssigneeId,
        decision: "SKIPPED_SAME_ASSIGNEE",
        reason: "incident is already assigned to autoAssigneeId"
      });
      continue;
    }

    if (input.escalationDryRun || escalationItem.decision === "DRY_RUN") {
      dryRun += 1;
      items.push({
        incidentId: escalationItem.incidentId,
        state: escalationItem.state,
        status: escalationItem.status,
        escalationDecision: escalationItem.decision,
        previousAssigneeId,
        assignedAssigneeId: input.autoAssigneeId,
        decision: "DRY_RUN",
        reason: "dry-run mode"
      });
      continue;
    }

    try {
      const updated = await input.assignIncident({
        incidentId: escalationItem.incidentId,
        previousAssigneeId,
        escalationDecision: escalationItem.decision
      });
      assigned += 1;
      items.push({
        incidentId: escalationItem.incidentId,
        state: updated.state,
        status: escalationItem.status,
        escalationDecision: escalationItem.decision,
        previousAssigneeId,
        assignedAssigneeId: updated.assigneeId,
        decision: "ASSIGNED",
        reason: null
      });
    } catch (error) {
      failed += 1;
      const reason = error instanceof Error ? error.message : "unknown error";
      items.push({
        incidentId: escalationItem.incidentId,
        state: escalationItem.state,
        status: escalationItem.status,
        escalationDecision: escalationItem.decision,
        previousAssigneeId,
        assignedAssigneeId: previousAssigneeId,
        decision: "FAILED",
        reason
      });

      if (input.onAssignFailed) {
        try {
          await input.onAssignFailed({
            incidentId: escalationItem.incidentId,
            previousAssigneeId,
            escalationDecision: escalationItem.decision,
            error: reason
          });
        } catch {
          // Non-blocking failure path for auto-action assignment telemetry.
        }
      }
    }
  }

  const escalated = input.escalationItems.filter((item) => isEscalatedDecision(item.decision)).length;
  return {
    escalated,
    assigned,
    skippedEscalation,
    skippedAssigned,
    failed,
    dryRun,
    items
  };
}

function buildScheduleAnomalyIncidentAutoActionEventItems(items: ScheduleAnomalyIncidentAutoActionItem[]) {
  return items.slice(0, 50).map((item) => ({
    incidentId: item.incidentId,
    escalationDecision: item.escalationDecision,
    decision: item.decision,
    previousAssigneeId: item.previousAssigneeId,
    assignedAssigneeId: item.assignedAssigneeId,
    reason: item.reason
  }));
}

export function buildScheduleAnomalyIncidentAutoActionExecutedEventPayload(
  input: BuildScheduleAnomalyIncidentAutoActionExecutedEventPayloadInput
) {
  return {
    ...input.summaryPayload,
    items: buildScheduleAnomalyIncidentAutoActionEventItems(input.items)
  };
}

export function resolveScheduleAnomalyIncidentAutoActionNotificationMeta(
  input: ResolveScheduleAnomalyIncidentAutoActionNotificationMetaInput
) {
  return {
    dryRun: input.dryRun,
    executedAt: input.executedAt,
    candidates: input.candidates,
    escalated: input.escalated,
    assigned: input.assigned,
    failed: input.failed
  };
}

export function buildScheduleAnomalyIncidentAutoActionNotificationAuditPayload(
  input: BuildScheduleAnomalyIncidentAutoActionNotificationAuditPayloadInput
) {
  return {
    executedAt: input.executedAt,
    candidates: input.candidates,
    escalated: input.escalated,
    assigned: input.assigned,
    failed: input.failed,
    ...(input.error ? { error: input.error } : {})
  };
}

export async function notifyScheduleAnomalyIncidentAutoActionExecution(
  input: NotifyScheduleAnomalyIncidentAutoActionExecutionInput
) {
  if (input.dryRun) {
    return;
  }

  try {
    await input.publishExecuted(
      buildScheduleAnomalyIncidentAutoActionExecutedEventPayload({
        summaryPayload: input.summaryPayload,
        items: input.items
      })
    );

    await input.appendAudit({
      action: "scheduling.anomaly.incident.auto_action.notified",
      payload: buildScheduleAnomalyIncidentAutoActionNotificationAuditPayload({
        executedAt: input.executedAt,
        candidates: input.candidates,
        escalated: input.escalated,
        assigned: input.assigned,
        failed: input.failed
      })
    });
  } catch (error) {
    try {
      await input.appendAudit({
        action: "scheduling.anomaly.incident.auto_action.notify.failed",
        payload: buildScheduleAnomalyIncidentAutoActionNotificationAuditPayload({
          executedAt: input.executedAt,
          candidates: input.candidates,
          escalated: input.escalated,
          assigned: input.assigned,
          failed: input.failed,
          error: error instanceof Error ? error.message : "unknown error"
        })
      });
    } catch {
      // Non-blocking failure path for auto-action notification telemetry.
    }
  }
}

export function buildScheduleAnomalyIncidentAutoActionSummaryPayload(
  input: BuildScheduleAnomalyIncidentAutoActionSummaryPayloadInput
) {
  return {
    executedAt: input.executedAt,
    dryRun: input.escalation.dryRun,
    state: input.state ?? null,
    assigneeId: input.assigneeId?.trim() ?? null,
    topN: input.topN ?? 50,
    includeResolved: input.escalation.policy.includeResolved,
    includeWarning: input.escalation.policy.includeWarning,
    slaTargetMinutes: input.escalation.policy.slaTargetMinutes,
    warningMinutes: input.escalation.policy.warningMinutes,
    cooldownMinutes: input.escalation.policy.cooldownMinutes,
    escalationChannel: input.escalation.policy.escalationChannel,
    autoAssigneeId: input.autoAssigneeId,
    autoAssignMode: input.autoAssignMode,
    autoAssignNote: input.autoAssignNote,
    candidates: input.escalation.counts.candidates,
    escalated: input.assignmentSummary.escalated,
    assigned: input.assignmentSummary.assigned,
    skippedEscalation: input.assignmentSummary.skippedEscalation,
    skippedAssigned: input.assignmentSummary.skippedAssigned,
    failed: input.assignmentSummary.failed,
    dryRunCount: input.assignmentSummary.dryRun
  };
}

export function buildScheduleAnomalyIncidentAutoActionResult(
  input: BuildScheduleAnomalyIncidentAutoActionResultInput
): ScheduleAnomalyIncidentAutoActionResult {
  return {
    executedAt: input.executedAt,
    dryRun: input.escalation.dryRun,
    policy: {
      slaTargetMinutes: input.escalation.policy.slaTargetMinutes,
      warningMinutes: input.escalation.policy.warningMinutes,
      includeResolved: input.escalation.policy.includeResolved,
      includeWarning: input.escalation.policy.includeWarning,
      cooldownMinutes: input.escalation.policy.cooldownMinutes,
      escalationChannel: input.escalation.policy.escalationChannel,
      autoAssigneeId: input.autoAssigneeId,
      autoAssignMode: input.autoAssignMode,
      autoAssignNote: input.autoAssignNote
    },
    counts: {
      candidates: input.escalation.counts.candidates,
      escalated: input.assignmentSummary.escalated,
      assigned: input.assignmentSummary.assigned,
      skippedEscalation: input.assignmentSummary.skippedEscalation,
      skippedAssigned: input.assignmentSummary.skippedAssigned,
      failed: input.assignmentSummary.failed,
      dryRun: input.assignmentSummary.dryRun
    },
    items: input.items
  };
}

export function buildScheduleAnomalyIncidentAutoActionAssignFailedPayload(
  input: BuildScheduleAnomalyIncidentAutoActionAssignFailedPayloadInput
) {
  return {
    incidentId: input.incidentId,
    previousAssigneeId: input.previousAssigneeId,
    autoAssigneeId: input.autoAssigneeId,
    autoAssignMode: input.autoAssignMode,
    escalationDecision: input.escalationDecision,
    error: input.error
  };
}
