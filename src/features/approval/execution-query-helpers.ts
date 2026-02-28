import type {
  ApprovalDomain,
  ApprovalExecutionState
} from "@/features/shared/data-access";

export function buildApprovalExecutionListQueryInput(input: {
  organizationId: string;
  domain: ApprovalDomain | undefined;
  targetEntityType: string | undefined;
  targetEntityId: string | undefined;
  state: ApprovalExecutionState | undefined;
}) {
  return {
    organizationId: input.organizationId,
    domain: input.domain,
    targetEntityType: input.targetEntityType?.trim(),
    targetEntityId: input.targetEntityId?.trim(),
    state: input.state
  };
}

export function buildPendingApprovalExecutionQueryInput(input: {
  organizationId: string;
  domain: ApprovalDomain | undefined;
}) {
  return {
    organizationId: input.organizationId,
    domain: input.domain,
    state: "PENDING" as const
  };
}
