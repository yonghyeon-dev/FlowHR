import type { PayrollRunEntity } from "@/features/shared/data-access";

type BuildYearEndFilingGuardInput = {
  runs: PayrollRunEntity[];
  confirmedRuns: PayrollRunEntity[];
  previewedRuns: PayrollRunEntity[];
};

type YearEndFilingGuardRunStates = {
  totalRuns: number;
  confirmedRuns: number;
  previewedRuns: number;
  undistributedRuns: number;
  pendingReceiptRuns: number;
  previewedRunIds: string[];
  undistributedRunIds: string[];
  pendingReceiptRunIds: string[];
};

type YearEndFilingGuard = {
  undistributedRuns: PayrollRunEntity[];
  pendingReceiptRuns: PayrollRunEntity[];
  runStates: YearEndFilingGuardRunStates;
  blockingReasons: string[];
  canFinalize: boolean;
};

type YearEndInsuranceReconciliationMonthlySummary = {
  month: string;
  runCount: number;
  confirmedRunCount: number;
  previewedRunCount: number;
  grossPayKrw: number;
  socialInsuranceKrw: number;
  withholdingTaxKrw: number;
};

export function buildYearEndFilingGuard(snapshot: BuildYearEndFilingGuardInput): YearEndFilingGuard {
  const undistributedRuns = snapshot.confirmedRuns.filter((run) => run.payslipDistributedAt === null);
  const pendingReceiptRuns = snapshot.confirmedRuns.filter(
    (run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null
  );

  const blockingReasons: string[] = [];
  if (snapshot.confirmedRuns.length === 0) {
    blockingReasons.push("no confirmed payroll runs found for selected year");
  }
  if (snapshot.previewedRuns.length > 0) {
    blockingReasons.push("all payroll runs must be confirmed before year-end finalization");
  }
  if (undistributedRuns.length > 0) {
    blockingReasons.push("all confirmed runs must be distributed before year-end finalization");
  }
  if (pendingReceiptRuns.length > 0) {
    blockingReasons.push(
      "all distributed runs must have payslip receipt confirmation before year-end finalization"
    );
  }

  return {
    undistributedRuns,
    pendingReceiptRuns,
    runStates: {
      totalRuns: snapshot.runs.length,
      confirmedRuns: snapshot.confirmedRuns.length,
      previewedRuns: snapshot.previewedRuns.length,
      undistributedRuns: undistributedRuns.length,
      pendingReceiptRuns: pendingReceiptRuns.length,
      previewedRunIds: snapshot.previewedRuns.map((run) => run.id),
      undistributedRunIds: undistributedRuns.map((run) => run.id),
      pendingReceiptRunIds: pendingReceiptRuns.map((run) => run.id)
    },
    blockingReasons,
    canFinalize: blockingReasons.length === 0
  };
}

export function buildYearEndInsuranceReconciliationMonthlyBreakdown(
  runs: PayrollRunEntity[],
  resolveMonthKey: (periodStart: Date) => string
): YearEndInsuranceReconciliationMonthlySummary[] {
  const byMonth = new Map<string, YearEndInsuranceReconciliationMonthlySummary>();

  for (const run of runs) {
    const month = resolveMonthKey(run.periodStart);
    const existing = byMonth.get(month) ?? {
      month,
      runCount: 0,
      confirmedRunCount: 0,
      previewedRunCount: 0,
      grossPayKrw: 0,
      socialInsuranceKrw: 0,
      withholdingTaxKrw: 0
    };
    existing.runCount += 1;
    if (run.state === "CONFIRMED") {
      existing.confirmedRunCount += 1;
    } else {
      existing.previewedRunCount += 1;
    }
    existing.grossPayKrw += run.grossPayKrw;
    existing.socialInsuranceKrw += run.socialInsuranceKrw ?? 0;
    existing.withholdingTaxKrw += run.withholdingTaxKrw ?? 0;
    byMonth.set(month, existing);
  }

  return Array.from(byMonth.values()).sort((left, right) => left.month.localeCompare(right.month));
}
