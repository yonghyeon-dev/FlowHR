export type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";
export type ApprovalExecutionState = "PENDING" | "APPROVED" | "REJECTED";
export type ApprovalExecutionSort = "updated_desc" | "priority_desc";
export type ApprovalStageResolution =
  | "EXPECTED_ROLE"
  | "ACTIVE_DELEGATION"
  | "PRIVILEGED_BYPASS"
  | "DENIED";

export type ApprovalExecutionDto = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  templateId: string | null;
  state: ApprovalExecutionState;
  totalStages: number;
  currentStageIndex: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalStageHistoryDto = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  stageIndex: number;
  stageLabel: string;
  requiredRoles: string[];
  actorRole: string;
  actorId: string | null;
  allowed: boolean;
  resolution: ApprovalStageResolution;
  evaluatedAt: string;
};

export type EscalationItemDto = {
  executionId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  stalledHours: number;
  currentStageIndex: number;
  totalStages: number;
  decision: "REQUESTED" | "DRY_RUN";
};

export type EscalationResultDto = {
  requestedAt: string;
  dryRun: boolean;
  policy: {
    stalledHoursMin: number;
    limit: number;
    notificationChannel: string;
    webhookConfigured: boolean;
    provider: "discord" | "slack" | null;
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
  items: EscalationItemDto[];
};

export type ApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
};

export type ApiLogStats = {
  total: number;
  success: number;
  fail: number;
};

export type ApprovalExecutionSummary = {
  total: number;
  pendingCount: number;
  stalledCount: number;
  payrollPendingCount: number;
  leavePendingCount: number;
  attendancePendingCount: number;
};

export const domainOptions: Array<ApprovalDomain | ""> = ["", "ATTENDANCE", "LEAVE", "PAYROLL"];
export const stateOptions: Array<ApprovalExecutionState | ""> = ["", "PENDING", "APPROVED", "REJECTED"];
