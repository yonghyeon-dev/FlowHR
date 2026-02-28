import type { ApprovalDomain } from "@/features/shared/data-access";
import type {
  ApprovalEscalationWebhookProvider,
  ApprovalExecutionEscalationItem
} from "@/features/approval/execution-escalation-core-helpers";

export function buildApprovalExecutionEscalationRequestedEventPayload(input: {
  organizationId: string;
  asOf: Date;
  domain: ApprovalDomain | undefined;
  stalledHoursMin: number;
  limit: number;
  notificationChannel: string;
  candidateCount: number;
  provider: ApprovalEscalationWebhookProvider;
  webhookSource: string;
  items: ApprovalExecutionEscalationItem[];
}) {
  return {
    organizationId: input.organizationId,
    asOf: input.asOf.toISOString(),
    domain: input.domain ?? null,
    stalledHoursMin: input.stalledHoursMin,
    limit: input.limit,
    notificationChannel: input.notificationChannel,
    candidateCount: input.candidateCount,
    provider: input.provider,
    webhookSource: input.webhookSource,
    items: input.items.slice(0, 100)
  };
}
