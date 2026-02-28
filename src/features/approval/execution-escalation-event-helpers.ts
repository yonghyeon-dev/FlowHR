import type { DomainEvent } from "@/features/shared/domain-event-publisher";
import type { ApprovalDomain } from "@/features/shared/data-access";
import type {
  ApprovalEscalationWebhookProvider,
  ApprovalExecutionEscalationItem
} from "@/features/approval/execution-escalation-core-helpers";
import { buildApprovalExecutionEscalationRequestedEventPayload } from "@/features/approval/execution-escalation-event-payload-helpers";

export function buildApprovalExecutionEscalationRequestedEvent(input: {
  requestedAt: string;
  actorRole: string;
  actorId: string;
  organizationId: string;
  asOf: Date;
  domain: ApprovalDomain | undefined;
  stalledHoursMin: number;
  limit: number;
  notificationChannel: string;
  provider: ApprovalEscalationWebhookProvider;
  webhookSource: string;
  items: ApprovalExecutionEscalationItem[];
}): DomainEvent {
  return {
    name: "approval.execution.escalation.requested.v1",
    occurredAt: input.requestedAt,
    entityType: "ApprovalExecution",
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: buildApprovalExecutionEscalationRequestedEventPayload({
      organizationId: input.organizationId,
      asOf: input.asOf,
      domain: input.domain,
      stalledHoursMin: input.stalledHoursMin,
      limit: input.limit,
      notificationChannel: input.notificationChannel,
      candidateCount: input.items.length,
      provider: input.provider,
      webhookSource: input.webhookSource,
      items: input.items
    })
  };
}
