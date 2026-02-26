export type AdminKpiSummaryInput = {
  approvalPendingCount: number;
  approvalStalledCount: number;
  attendanceApprovedCount: number;
  attendanceTotalCount: number;
  leaveApprovedDays: number;
  payrollConfirmedCount: number;
  payrollTotalCount: number;
  contractSlaOverdueCount: number;
};

export type AdminKpiSummary = {
  approvalPendingCount: number;
  approvalStalledCount: number;
  attendanceApprovalRate: number;
  leaveApprovedDays: number;
  payrollConfirmedRate: number;
  contractSlaOverdueCount: number;
};

function safePercent(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return (numerator / denominator) * 100;
}

export function buildAdminKpiSummary(input: AdminKpiSummaryInput): AdminKpiSummary {
  return {
    approvalPendingCount: Math.max(0, Math.trunc(input.approvalPendingCount)),
    approvalStalledCount: Math.max(0, Math.trunc(input.approvalStalledCount)),
    attendanceApprovalRate: safePercent(input.attendanceApprovedCount, input.attendanceTotalCount),
    leaveApprovedDays: Number.isFinite(input.leaveApprovedDays) ? Math.max(0, input.leaveApprovedDays) : 0,
    payrollConfirmedRate: safePercent(input.payrollConfirmedCount, input.payrollTotalCount),
    contractSlaOverdueCount: Math.max(0, Math.trunc(input.contractSlaOverdueCount))
  };
}

export function computeKpiDelta(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return 0;
  }
  return current - previous;
}

export function computePreviousPeriodRange(periodStartIso: string, periodEndIso: string) {
  const startMs = new Date(periodStartIso).getTime();
  const endMs = new Date(periodEndIso).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    throw new Error("invalid period range");
  }
  const spanMs = endMs - startMs;
  const previousEndMs = startMs - 1;
  const previousStartMs = previousEndMs - spanMs;
  return {
    from: new Date(previousStartMs).toISOString(),
    to: new Date(previousEndMs).toISOString()
  };
}

export function computeStalledHours(updatedAt: string, asOf: Date) {
  const updatedMs = new Date(updatedAt).getTime();
  const asOfMs = asOf.getTime();
  if (!Number.isFinite(updatedMs) || !Number.isFinite(asOfMs)) {
    return 0;
  }
  return Math.max(0, (asOfMs - updatedMs) / 3_600_000);
}
