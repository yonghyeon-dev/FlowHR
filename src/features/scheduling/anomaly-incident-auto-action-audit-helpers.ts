import { buildScheduleAnomalyIncidentAutoActionAssignFailedPayload } from "@/features/scheduling/anomaly-incident-auto-action-helpers";
import type {
  ScheduleAnomalyIncidentAutoAssignMode,
  ScheduleAnomalyIncidentEscalationDecision
} from "@/features/scheduling/service";

type BuildScheduleAnomalyIncidentAutoActionAssignFailedAuditEntryInput = {
  incidentId: string;
  previousAssigneeId: string | null;
  autoAssigneeId: string;
  autoAssignMode: ScheduleAnomalyIncidentAutoAssignMode;
  escalationDecision: ScheduleAnomalyIncidentEscalationDecision;
  error: string;
  organizationId: string | undefined;
  actorRole: string;
  actorId: string | undefined;
};

type BuildScheduleAnomalyIncidentAutoActionGeneratedAuditEntryInput = {
  organizationId: string | undefined;
  actorRole: string;
  actorId: string | undefined;
  payload: Record<string, unknown>;
};

type BuildScheduleAnomalyIncidentAutoActionExecutionAuditEntryInput = {
  action: string;
  organizationId: string | undefined;
  actorRole: string;
  actorId: string | undefined;
  payload: Record<string, unknown>;
};

export function buildScheduleAnomalyIncidentAutoActionAssignFailedAuditEntry(
  input: BuildScheduleAnomalyIncidentAutoActionAssignFailedAuditEntryInput
) {
  return {
    action: "scheduling.anomaly.incident.auto_action.assign.failed",
    entityType: "WorkSchedule",
    entityId: input.incidentId,
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: buildScheduleAnomalyIncidentAutoActionAssignFailedPayload({
      incidentId: input.incidentId,
      previousAssigneeId: input.previousAssigneeId,
      autoAssigneeId: input.autoAssigneeId,
      autoAssignMode: input.autoAssignMode,
      escalationDecision: input.escalationDecision,
      error: input.error
    })
  };
}

export function buildScheduleAnomalyIncidentAutoActionGeneratedAuditEntry(
  input: BuildScheduleAnomalyIncidentAutoActionGeneratedAuditEntryInput
) {
  return {
    action: "scheduling.anomaly.incident.auto_action.generated",
    entityType: "WorkSchedule",
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: input.payload
  };
}

export function buildScheduleAnomalyIncidentAutoActionExecutionAuditEntry(
  input: BuildScheduleAnomalyIncidentAutoActionExecutionAuditEntryInput
) {
  return {
    action: input.action,
    entityType: "WorkSchedule",
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: input.payload
  };
}
