import type { ApprovalDomain, ApprovalStageResolution } from "@/features/shared/data-access";

export function normalizeApprovalStageHistoryListLimit(limit: number | undefined) {
  return limit !== undefined ? Math.min(Math.max(limit, 1), 500) : 100;
}

export function buildApprovalStageHistoryListQueryInput(input: {
  organizationId: string;
  domain: ApprovalDomain | undefined;
  targetEntityType: string | undefined;
  targetEntityId: string | undefined;
  allowed: boolean | undefined;
  resolution: ApprovalStageResolution | undefined;
  from: Date | undefined;
  to: Date | undefined;
  limit: number;
}) {
  return {
    organizationId: input.organizationId,
    domain: input.domain,
    targetEntityType: input.targetEntityType?.trim(),
    targetEntityId: input.targetEntityId?.trim(),
    allowed: input.allowed,
    resolution: input.resolution,
    from: input.from,
    to: input.to,
    limit: input.limit
  };
}
