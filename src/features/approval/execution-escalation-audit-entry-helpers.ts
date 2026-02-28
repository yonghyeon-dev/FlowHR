import type { ApprovalExecutionEscalationAuditPayloadBase } from "@/features/approval/audit-payload-helpers";

type EscalationAuditActorContext = {
  organizationId: string;
  actorRole: string;
  actorId: string;
};

export function buildApprovalExecutionEscalationAuditActorContext(input: {
  organizationId: string;
  actorRole: string;
  actorId: string;
}): EscalationAuditActorContext {
  return {
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId
  };
}

function buildApprovalExecutionEscalationAuditEntry(input: {
  action: string;
  actor: EscalationAuditActorContext;
  payload: Record<string, unknown>;
}) {
  return {
    action: input.action,
    entityType: "ApprovalExecution",
    organizationId: input.actor.organizationId,
    actorRole: input.actor.actorRole,
    actorId: input.actor.actorId,
    payload: input.payload
  };
}

export function buildApprovalExecutionEscalationGeneratedAuditEntry(input: {
  actor: EscalationAuditActorContext;
  payload: ApprovalExecutionEscalationAuditPayloadBase;
}) {
  return buildApprovalExecutionEscalationAuditEntry({
    action: "approval.execution.escalation.generated",
    actor: input.actor,
    payload: input.payload
  });
}

export function buildApprovalExecutionEscalationRequestedAuditEntry(input: {
  actor: EscalationAuditActorContext;
  payload: ApprovalExecutionEscalationAuditPayloadBase;
}) {
  return buildApprovalExecutionEscalationAuditEntry({
    action: "approval.execution.escalation.requested",
    actor: input.actor,
    payload: input.payload
  });
}

export function buildApprovalExecutionEscalationFailedAuditEntry(input: {
  actor: EscalationAuditActorContext;
  payload: Record<string, unknown>;
}) {
  return buildApprovalExecutionEscalationAuditEntry({
    action: "approval.execution.escalation.failed",
    actor: input.actor,
    payload: input.payload
  });
}

export function buildApprovalExecutionEscalationEventPublishFailedAuditEntry(input: {
  actor: EscalationAuditActorContext;
  payload: Record<string, unknown>;
}) {
  return buildApprovalExecutionEscalationAuditEntry({
    action: "approval.execution.escalation.event_publish_failed",
    actor: input.actor,
    payload: input.payload
  });
}
