import { resolveAdminContractDocumentNextStep } from "@/components/contracts/document-action-policy";

import type {
  AdminSummary,
  ApprovalExecutionLite,
  ContractDocumentLite,
  PayrollRunLite
} from "@/app/admin/page-dashboard-types";

type AdminApiResult = {
  response: {
    ok: boolean;
  };
  body: unknown;
};

const contractSlaTrackedStatuses = new Set<ContractDocumentLite["status"]>([
  "DRAFT",
  "APPROVAL_REQUESTED",
  "SENT"
]);

const contractDecisionQueueSteps = new Set([
  "REQUEST_APPROVAL",
  "APPROVE_OR_REJECT",
  "SEND_DOCUMENT"
]);

function readArray<T>(payload: unknown, key: string): T[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const value = (payload as Record<string, unknown>)[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

export function buildAdminSummaryFromApiResults(input: {
  attendanceResult: AdminApiResult;
  leaveResult: AdminApiResult;
  payrollResult: AdminApiResult;
  employeeResult: AdminApiResult;
  approvalResult: AdminApiResult;
  contractsResult: AdminApiResult;
  asOfIso: string;
  runtimeLocale: string;
}): AdminSummary {
  const pendingAttendanceCount = input.attendanceResult.response.ok
    ? readArray<unknown>(input.attendanceResult.body, "records").length
    : 0;

  const pendingLeaveCount = input.leaveResult.response.ok
    ? readArray<unknown>(input.leaveResult.body, "requests").length
    : 0;

  const payrollRuns = input.payrollResult.response.ok
    ? readArray<PayrollRunLite>(input.payrollResult.body, "runs")
    : [];
  const previewedPayrollCount = payrollRuns.filter((run) => run.state === "PREVIEWED").length;
  const undistributedPayrollCount = payrollRuns.filter(
    (run) => run.state === "CONFIRMED" && !run.payslipDistributedAt
  ).length;

  const approvalExecutions = input.approvalResult.response.ok
    ? readArray<ApprovalExecutionLite>(input.approvalResult.body, "executions")
    : [];

  const asOfMillis = new Date(input.asOfIso).getTime();
  const stalledApprovalExecutionCount = approvalExecutions.filter((execution) => {
    const updatedAtMillis = new Date(execution.updatedAt).getTime();
    if (!Number.isFinite(updatedAtMillis)) {
      return false;
    }
    const stalledHours = (asOfMillis - updatedAtMillis) / (1000 * 60 * 60);
    return stalledHours >= 24;
  }).length;

  const contractDocuments = input.contractsResult.response.ok
    ? readArray<ContractDocumentLite>(input.contractsResult.body, "documents")
    : [];

  const contractDecisionQueueCount = contractDocuments.filter((document) =>
    contractDecisionQueueSteps.has(
      resolveAdminContractDocumentNextStep({
        status: document.status,
        approvalStatus: document.approvalStatus ?? "NONE",
        requiresApproval: Boolean(document.requiresApproval)
      })
    )
  ).length;

  const contractSlaOverdueCount = contractDocuments.filter((document) => {
    if (!contractSlaTrackedStatuses.has(document.status)) {
      return false;
    }
    const expiresAtMillis = document.expiresAt ? new Date(document.expiresAt).getTime() : Number.NaN;
    return Number.isFinite(expiresAtMillis) && expiresAtMillis < asOfMillis;
  }).length;
  const contractPendingResponseCount = contractDocuments.filter(
    (document) => document.status === "SENT"
  ).length;

  const employeeCount = input.employeeResult.response.ok
    ? readArray<unknown>(input.employeeResult.body, "employees").length
    : 0;

  return {
    pendingAttendanceCount,
    pendingLeaveCount,
    previewedPayrollCount,
    undistributedPayrollCount,
    pendingApprovalExecutionCount: approvalExecutions.length,
    stalledApprovalExecutionCount,
    contractDecisionQueueCount,
    contractPendingResponseCount,
    contractSlaOverdueCount,
    employeeCount,
    refreshedAt: new Date().toLocaleString(input.runtimeLocale)
  };
}
