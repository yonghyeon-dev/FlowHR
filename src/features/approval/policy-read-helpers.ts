import type {
  ApprovalDelegationEntity,
  ApprovalDomain,
  ApprovalLineTemplateEntity,
  ApprovalPolicyEntity
} from "@/features/shared/data-access";

export type ApprovalPolicyGateAllowedReason =
  | "expected_role"
  | "active_delegation"
  | "privileged_bypass"
  | "denied";

export type ApprovalPolicyReadResult = {
  policy: ApprovalPolicyEntity;
  configured: boolean;
};

export type ApprovalPolicyGatePreview = {
  organizationId: string;
  domain: ApprovalDomain;
  fallbackRole: string;
  expectedRoles: string[];
  actorRole: string;
  actorId: string | null;
  allowed: boolean;
  allowedReason: ApprovalPolicyGateAllowedReason;
  payrollGrossPayKrw: number | null;
  effectiveAt: string;
  matchedTemplates: Array<{
    id: string;
    name: string;
    domain: ApprovalDomain;
    approverRoles: string[];
    approvalStages: Array<{
      stageIndex: number;
      label: string;
      approverRoles: string[];
      minApprovals: number;
    }>;
    payrollGrossPayMinKrw: number | null;
    payrollGrossPayMaxKrw: number | null;
    active: boolean;
  }>;
  activeDelegations: Array<{
    id: string;
    delegatorRole: string;
    delegateActorId: string;
    startsAt: string;
    endsAt: string;
    active: boolean;
  }>;
};

export function resolveApprovalPolicyReadResult(
  policy: ApprovalPolicyEntity | null,
  organizationId: string,
  buildPolicyFallback: (organizationId: string) => ApprovalPolicyEntity
): ApprovalPolicyReadResult {
  return {
    policy: policy ?? buildPolicyFallback(organizationId),
    configured: policy !== null
  };
}

export function resolveApprovalGatePreviewActorContext(input: {
  actorRole: string | undefined;
  actorId: string | undefined;
  defaultActorRole: string;
  defaultActorId: string | null;
}) {
  return {
    previewActorRole: input.actorRole?.trim() || input.defaultActorRole,
    previewActorId: input.actorId?.trim() || input.defaultActorId
  };
}

export function toApprovalPolicyGatePreview(input: {
  organizationId: string;
  domain: ApprovalDomain;
  fallbackRole: string;
  expectedRoles: string[];
  actorRole: string;
  actorId: string | null;
  allowed: boolean;
  allowedReason: ApprovalPolicyGateAllowedReason;
  payrollGrossPayKrw: number | null | undefined;
  effectiveAt: Date;
  matchedTemplates: ApprovalLineTemplateEntity[];
  activeDelegations: Array<
    Pick<ApprovalDelegationEntity, "id" | "delegatorRole" | "delegateActorId" | "startsAt" | "endsAt" | "active">
  >;
}): ApprovalPolicyGatePreview {
  return {
    organizationId: input.organizationId,
    domain: input.domain,
    fallbackRole: input.fallbackRole,
    expectedRoles: input.expectedRoles,
    actorRole: input.actorRole,
    actorId: input.actorId,
    allowed: input.allowed,
    allowedReason: input.allowedReason,
    payrollGrossPayKrw: input.payrollGrossPayKrw ?? null,
    effectiveAt: input.effectiveAt.toISOString(),
    matchedTemplates: input.matchedTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      domain: template.domain,
      approverRoles: template.approverRoles,
      approvalStages: template.approvalStages.map((stage) => ({
        stageIndex: stage.stageIndex,
        label: stage.label,
        approverRoles: [...stage.approverRoles],
        minApprovals: stage.minApprovals
      })),
      payrollGrossPayMinKrw: template.payrollGrossPayMinKrw,
      payrollGrossPayMaxKrw: template.payrollGrossPayMaxKrw,
      active: template.active
    })),
    activeDelegations: input.activeDelegations.map((delegation) => ({
      id: delegation.id,
      delegatorRole: delegation.delegatorRole,
      delegateActorId: delegation.delegateActorId,
      startsAt: delegation.startsAt.toISOString(),
      endsAt: delegation.endsAt.toISOString(),
      active: delegation.active
    }))
  };
}

export function buildApprovalPolicyGatePreviewAuditPayload(preview: ApprovalPolicyGatePreview) {
  return {
    domain: preview.domain,
    actorRole: preview.actorRole,
    actorId: preview.actorId,
    expectedRoles: preview.expectedRoles,
    fallbackRole: preview.fallbackRole,
    allowed: preview.allowed,
    allowedReason: preview.allowedReason,
    payrollGrossPayKrw: preview.payrollGrossPayKrw,
    matchedTemplateIds: preview.matchedTemplates.map((template) => template.id),
    activeDelegationIds: preview.activeDelegations.map((delegation) => delegation.id)
  };
}
