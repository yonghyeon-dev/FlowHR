import type {
  ApprovalDomain,
  ApprovalExecutionState,
  ApprovalStageResolution
} from "@/features/shared/data-access";
import {
  buildApprovalExecutionListedAuditPayload,
  buildApprovalStageHistoryListedAuditPayload
} from "@/features/approval/audit-payload-helpers";

export function buildApprovalStageHistoryListedAuditEntry(input: {
  organizationId: string;
  actorRole: string;
  actorId: string;
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
    action: "approval.stage_history.listed",
    entityType: "ApprovalStageHistory",
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: buildApprovalStageHistoryListedAuditPayload({
      domain: input.domain,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      allowed: input.allowed,
      resolution: input.resolution,
      from: input.from,
      to: input.to,
      limit: input.limit,
      resultCount: input.resultCount
    })
  };
}

export function buildApprovalExecutionListedAuditEntry(input: {
  organizationId: string;
  actorRole: string;
  actorId: string;
  domain: ApprovalDomain | undefined;
  targetEntityType: string | undefined;
  targetEntityId: string | undefined;
  state: ApprovalExecutionState | undefined;
  sort: "updated_desc" | "priority_desc";
  stalledHoursMin: number | undefined;
  asOf: Date;
  limit: number;
  resultCount: number;
}) {
  return {
    action: "approval.execution.listed",
    entityType: "ApprovalExecution",
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: buildApprovalExecutionListedAuditPayload({
      domain: input.domain,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
      state: input.state,
      sort: input.sort,
      stalledHoursMin: input.stalledHoursMin,
      asOf: input.asOf,
      limit: input.limit,
      resultCount: input.resultCount
    })
  };
}
