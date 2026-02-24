import type { ApiLog, LeaveBalanceDto } from "@/app/employee/page-types";

type LeaveBalanceCopyLike = {
  cardLabels: {
    remaining: string;
    granted: string;
    used: string;
    carryOver: string;
  };
  dayUnit: (value: string) => string;
  projectionPending: string;
  projectedRemaining: (value: string) => string;
  projectedShortage: (value: string) => string;
};

export function summarizeEmployeeApiLogs(logs: ApiLog[]) {
  const total = logs.length;
  const success = logs.filter((log) => log.ok).length;
  const fail = total - success;
  const successRate = total === 0 ? 0 : Math.round((success / total) * 100);
  return { total, success, fail, successRate };
}

export function buildLeaveBalanceCards(
  leaveBalance: LeaveBalanceDto | null,
  leaveBalanceCopy: LeaveBalanceCopyLike,
  formatDays: (value: number) => string
) {
  if (!leaveBalance) {
    return [];
  }
  return [
    {
      key: "remaining",
      label: leaveBalanceCopy.cardLabels.remaining,
      value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.remainingDays)),
      tone: "remaining"
    },
    {
      key: "granted",
      label: leaveBalanceCopy.cardLabels.granted,
      value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.grantedDays)),
      tone: "granted"
    },
    {
      key: "used",
      label: leaveBalanceCopy.cardLabels.used,
      value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.usedDays)),
      tone: "used"
    },
    {
      key: "carry-over",
      label: leaveBalanceCopy.cardLabels.carryOver,
      value: leaveBalanceCopy.dayUnit(formatDays(leaveBalance.carryOverDays)),
      tone: "carry-over"
    }
  ];
}

export function buildLeaveUsageProjectionLabel(
  leaveBalance: LeaveBalanceDto | null,
  leaveBalanceCopy: LeaveBalanceCopyLike,
  formatDays: (value: number) => string
) {
  if (!leaveBalance || leaveBalance.grantedDays <= 0) {
    return leaveBalanceCopy.projectionPending;
  }

  const elapsedMonths = Math.max(1, new Date().getMonth() + 1);
  const averageUsedPerMonth = leaveBalance.usedDays / elapsedMonths;
  const projectedYearEndUsed = averageUsedPerMonth * 12;
  const projectedRemaining = leaveBalance.grantedDays - projectedYearEndUsed;
  if (projectedRemaining >= 0) {
    return leaveBalanceCopy.projectedRemaining(formatDays(projectedRemaining));
  }
  return leaveBalanceCopy.projectedShortage(formatDays(Math.abs(projectedRemaining)));
}
