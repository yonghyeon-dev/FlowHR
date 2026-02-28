import type { ApprovalDomain } from "@/features/shared/data-access";
import type {
  ApprovalEscalationWebhookProvider,
  ApprovalExecutionEscalationItem
} from "@/features/approval/execution-escalation-core-helpers";

export type ApprovalExecutionEscalationResponse = {
  requestedAt: string;
  dryRun: boolean;
  policy: {
    stalledHoursMin: number;
    limit: number;
    notificationChannel: string;
    webhookConfigured: boolean;
    provider: ApprovalEscalationWebhookProvider | null;
    webhookSource: string | null;
  };
  filters: {
    organizationId: string;
    domain: ApprovalDomain | null;
    asOf: string;
  };
  counts: {
    totalPending: number;
    candidates: number;
    requested: number;
    dryRun: number;
    skippedNoCandidate: number;
    failed: number;
  };
  items: ApprovalExecutionEscalationItem[];
};

export function buildApprovalExecutionEscalationResponse(input: {
  requestedAt: string;
  dryRun: boolean;
  stalledHoursMin: number;
  limit: number;
  notificationChannel: string;
  provider: ApprovalEscalationWebhookProvider | null;
  webhookSource: string | null;
  organizationId: string;
  domain: ApprovalDomain | undefined;
  asOf: Date;
  totalPending: number;
  items: ApprovalExecutionEscalationItem[];
}): ApprovalExecutionEscalationResponse {
  return {
    requestedAt: input.requestedAt,
    dryRun: input.dryRun,
    policy: {
      stalledHoursMin: input.stalledHoursMin,
      limit: input.limit,
      notificationChannel: input.notificationChannel,
      webhookConfigured: input.provider !== null,
      provider: input.provider,
      webhookSource: input.webhookSource
    },
    filters: {
      organizationId: input.organizationId,
      domain: input.domain ?? null,
      asOf: input.asOf.toISOString()
    },
    counts: {
      totalPending: input.totalPending,
      candidates: input.items.length,
      requested: !input.dryRun && input.items.length > 0 ? input.items.length : 0,
      dryRun: input.dryRun ? input.items.length : 0,
      skippedNoCandidate: input.items.length === 0 ? 1 : 0,
      failed: 0
    },
    items: input.items
  };
}
