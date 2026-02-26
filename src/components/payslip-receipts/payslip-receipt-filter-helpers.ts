import type { PayrollRunReceiptDto } from "@/components/payslip-receipts/types";

export type PayslipRunsStatusFilter = "all" | "pending_confirmation" | "confirmed" | "undistributed";

export function filterPayslipRunsByStatus(
  runs: PayrollRunReceiptDto[],
  runsStatusFilter: PayslipRunsStatusFilter
) {
  if (runsStatusFilter === "pending_confirmation") {
    return runs.filter(
      (run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null
    );
  }
  if (runsStatusFilter === "confirmed") {
    return runs.filter((run) => run.payslipReceiptConfirmedAt !== null);
  }
  if (runsStatusFilter === "undistributed") {
    return runs.filter((run) => run.payslipDistributedAt === null);
  }
  return runs;
}

export function filterPayslipRunsByQuery(runs: PayrollRunReceiptDto[], normalizedRunsSearchQuery: string) {
  if (!normalizedRunsSearchQuery) {
    return runs;
  }
  return runs.filter((run) =>
    `${run.id} ${run.periodStart} ${run.periodEnd} ${run.payslipDistributedAt ?? ""} ${run.payslipReceiptConfirmedAt ?? ""}`
      .toLowerCase()
      .includes(normalizedRunsSearchQuery)
  );
}

export function countPendingPayslipRuns(runs: PayrollRunReceiptDto[]) {
  return runs.filter((run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null).length;
}

export function summarizePayslipRunsStatusCounts(runs: PayrollRunReceiptDto[]) {
  return {
    pendingConfirmation: runs.filter(
      (run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null
    ).length,
    confirmed: runs.filter((run) => run.payslipReceiptConfirmedAt !== null).length,
    undistributed: runs.filter((run) => run.payslipDistributedAt === null).length
  };
}
