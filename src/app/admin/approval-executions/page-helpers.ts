import type {
  ApprovalDomain,
  ApprovalExecutionDto
} from "@/app/admin/approval-executions/page-types";

export function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
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
