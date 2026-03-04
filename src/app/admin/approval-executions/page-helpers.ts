import type {
  ApprovalDomain,
  ApprovalExecutionDto,
  ApprovalExecutionSort,
  ApprovalExecutionState
} from "@/app/admin/approval-executions/page-types";

export function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function normalizeApprovalDomainFilter(value: string | null): ApprovalDomain | "" {
  if (value === "ATTENDANCE" || value === "LEAVE" || value === "PAYROLL") {
    return value;
  }
  return "";
}

export function normalizeApprovalStateFilter(value: string | null): ApprovalExecutionState | "" {
  if (value === "PENDING" || value === "APPROVED" || value === "REJECTED") {
    return value;
  }
  return "PENDING";
}

export function normalizeApprovalSortFilter(value: string | null): ApprovalExecutionSort {
  if (value === "updated_desc" || value === "priority_desc") {
    return value;
  }
  return "priority_desc";
}

export function normalizePositiveIntegerText(value: string | null, fallback: string) {
  if (!value) return fallback;
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return String(Math.floor(parsed));
}

export function resolveApprovalAnalyticsFocusLabel(isKoLocale: boolean, focusMetric: string | null) {
  if (focusMetric === "stalledApprovals") {
    return isKoLocale ? "정체 결재 대기함" : "Stalled approval queue";
  }
  if (focusMetric === "pendingApprovals") {
    return isKoLocale ? "결재 대기함" : "Pending approval queue";
  }
  return isKoLocale ? "결재 실행 현황" : "Approval execution queue";
}

export function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

export function toIso(value: string) {
  return new Date(value).toISOString();
}

export function formatDateTime(value: string | null, runtimeLocale: string) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}

export function getCompletedStages(execution: ApprovalExecutionDto) {
  if (execution.totalStages <= 0) {
    return 0;
  }
  if (execution.state === "APPROVED") {
    return execution.totalStages;
  }
  if (execution.state === "REJECTED") {
    return Math.max(1, Math.min(execution.currentStageIndex, execution.totalStages));
  }
  return Math.max(0, Math.min(execution.currentStageIndex - 1, execution.totalStages));
}

export function getProgressPercent(execution: ApprovalExecutionDto) {
  if (execution.totalStages <= 0) {
    return 0;
  }
  return Math.round((getCompletedStages(execution) / execution.totalStages) * 100);
}

export function getStalledHours(execution: ApprovalExecutionDto, asOf: Date) {
  return Math.max(0, (asOf.getTime() - new Date(execution.updatedAt).getTime()) / (60 * 60 * 1000));
}

export function resolveQuickJumpPath(execution: ApprovalExecutionDto) {
  if (execution.domain === "PAYROLL") {
    return "/admin/payroll-year-end";
  }
  if (execution.domain === "LEAVE") {
    return "/admin/leave-accrual";
  }
  return "/admin/attendance-live";
}

export function resolveQuickJumpLabel(execution: ApprovalExecutionDto, isKoLocale: boolean) {
  if (execution.domain === "PAYROLL") {
    return isKoLocale ? "급여 워크스페이스" : "Payroll workspace";
  }
  if (execution.domain === "LEAVE") {
    return isKoLocale ? "휴가 워크스페이스" : "Leave workspace";
  }
  return isKoLocale ? "근태 워크스페이스" : "Attendance workspace";
}

export function toTargetKey(input: {
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
}) {
  return `${input.domain}:${input.targetEntityType}:${input.targetEntityId}`;
}
