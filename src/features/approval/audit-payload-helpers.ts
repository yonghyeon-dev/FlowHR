import type {
  ApprovalDomain,
  ApprovalExecutionState,
  ApprovalStageResolution
} from "@/features/shared/data-access";
import type { ApprovalEscalationWebhookProvider } from "@/features/approval/execution-escalation-core-helpers";

export function buildApprovalStageHistoryListedAuditPayload(input: {
  domain: ApprovalDomain | undefined;
  targetEntityType: string | undefined;
  targetEntityId: string | undefined;
  allowed: boolean | undefined;
  resolution: ApprovalStageResolution | undefined;
  from: Date | undefined;
  to: Date | undefined;
  limit: number;
  resultCount: number;
}) {
  return {
    domain: input.domain ?? null,
    targetEntityType: input.targetEntityType ?? null,
    targetEntityId: input.targetEntityId ?? null,
    allowed: input.allowed ?? null,
    resolution: input.resolution ?? null,
    from: input.from?.toISOString() ?? null,
    to: input.to?.toISOString() ?? null,
    limit: input.limit,
    resultCount: input.resultCount
  };
}

export function buildApprovalExecutionListedAuditPayload(input: {
  domain: ApprovalDomain | undefined;
  targetEntityType: string | undefined;
  targetEntityId: string | undefined;
  state: ApprovalExecutionState | undefined;
  sort: string;
  stalledHoursMin: number | undefined;
  asOf: Date;
  limit: number;
  resultCount: number;
}) {
  return {
    domain: input.domain ?? null,
    targetEntityType: input.targetEntityType ?? null,
    targetEntityId: input.targetEntityId ?? null,
    state: input.state ?? null,
    sort: input.sort,
    stalledHoursMin: input.stalledHoursMin ?? null,
    asOf: input.asOf.toISOString(),
    limit: input.limit,
    resultCount: input.resultCount
  };
}

export type ApprovalExecutionEscalationAuditPayloadBase = {
  asOf: string;
  domain: ApprovalDomain | null;
  stalledHoursMin: number;
  limit: number;
  notificationChannel: string;
  dryRun: boolean;
  totalPending: number;
  candidateCount: number;
  requestedAt: string;
  provider: ApprovalEscalationWebhookProvider | null;
  webhookSource: string | null;
};

export function buildApprovalExecutionEscalationAuditPayloadBase(input: {
  asOf: Date;
  domain: ApprovalDomain | undefined;
  stalledHoursMin: number;
  limit: number;
  notificationChannel: string;
  dryRun: boolean;
  totalPending: number;
  candidateCount: number;
  requestedAt: string;
  provider: ApprovalEscalationWebhookProvider | null;
  webhookSource: string | null;
}): ApprovalExecutionEscalationAuditPayloadBase {
  return {
    asOf: input.asOf.toISOString(),
    domain: input.domain ?? null,
    stalledHoursMin: input.stalledHoursMin,
    limit: input.limit,
    notificationChannel: input.notificationChannel,
    dryRun: input.dryRun,
    totalPending: input.totalPending,
    candidateCount: input.candidateCount,
    requestedAt: input.requestedAt,
    provider: input.provider,
    webhookSource: input.webhookSource
  };
}

export function buildApprovalExecutionEscalationFailureAuditPayload(input: {
  base: ApprovalExecutionEscalationAuditPayloadBase;
  reason: string;
  error?: string;
}) {
  return {
    ...input.base,
    reason: input.reason,
    ...(input.error ? { error: input.error } : {})
  };
}
