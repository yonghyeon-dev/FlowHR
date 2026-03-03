export type ApprovalExecutionLite = { updatedAt: string };

export type PayrollRunLite = {
  state: "PREVIEWED" | "CONFIRMED";
  payslipDistributedAt: string | null;
};

export type ContractDocumentLite = {
  status:
    | "DRAFT"
    | "APPROVAL_REQUESTED"
    | "SENT"
    | "SIGNED"
    | "REJECTED"
    | "EXPIRED"
    | "RENEWED";
  approvalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  requiresApproval: boolean;
  expiresAt: string | null;
};

export type AdminSummary = {
  pendingAttendanceCount: number;
  pendingLeaveCount: number;
  previewedPayrollCount: number;
  undistributedPayrollCount: number;
  pendingApprovalExecutionCount: number;
  stalledApprovalExecutionCount: number;
  contractDecisionQueueCount: number;
  contractPendingResponseCount: number;
  contractSlaOverdueCount: number;
  employeeCount: number;
  refreshedAt: string | null;
};

export const EMPTY_SUMMARY: AdminSummary = {
  pendingAttendanceCount: 0,
  pendingLeaveCount: 0,
  previewedPayrollCount: 0,
  undistributedPayrollCount: 0,
  pendingApprovalExecutionCount: 0,
  stalledApprovalExecutionCount: 0,
  contractDecisionQueueCount: 0,
  contractPendingResponseCount: 0,
  contractSlaOverdueCount: 0,
  employeeCount: 0,
  refreshedAt: null
};
