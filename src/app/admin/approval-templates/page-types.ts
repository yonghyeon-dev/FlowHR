export type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";

export type ApprovalLineTemplateDto = {
  id: string;
  organizationId: string;
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
  createdAt: string;
  updatedAt: string;
};

export type ApprovalGatePreviewDto = {
  organizationId: string;
  domain: ApprovalDomain;
  fallbackRole: string;
  expectedRoles: string[];
  actorRole: string;
  actorId: string | null;
  allowed: boolean;
  allowedReason: "expected_role" | "active_delegation" | "privileged_bypass" | "denied";
  payrollGrossPayKrw: number | null;
  effectiveAt: string;
  matchedTemplates: Array<{
    id: string;
    name: string;
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

export type ApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
};
