import type { PayrollRunEntity } from "@/features/shared/data-access";

type PayrollTotalsKrw = {
  grossPayKrw: number;
  withholdingTaxKrw: number;
  socialInsuranceKrw: number;
  otherDeductionsKrw: number;
  totalDeductionsKrw: number;
  netPayKrw: number;
};

type YearEndWithholdingReceiptRunStates = {
  totalRuns: number;
  confirmedRuns: number;
  previewedRuns: number;
  undistributedRuns: number;
  pendingReceiptRuns: number;
  previewedRunIds: string[];
  undistributedRunIds: string[];
  pendingReceiptRunIds: string[];
};

type BuildYearEndWithholdingReceiptGuardInput = {
  runs: PayrollRunEntity[];
  confirmedRuns: PayrollRunEntity[];
  previewedRuns: PayrollRunEntity[];
};

type YearEndWithholdingReceiptGuard = {
  undistributedRuns: PayrollRunEntity[];
  pendingReceiptRuns: PayrollRunEntity[];
  runStates: YearEndWithholdingReceiptRunStates;
  blockingReasons: string[];
  canIssue: boolean;
};

type BuildYearEndWithholdingReceiptSummaryInput = {
  year: number;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  issue: boolean;
  receiptNumber: string;
  issuerName: string;
  issuedAt: string | null;
  runStates: YearEndWithholdingReceiptRunStates;
  annualTotalsKrw: PayrollTotalsKrw;
  blockingReasons: string[];
};

type YearEndWithholdingReceiptSummary = {
  year: number;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  issue: boolean;
  canIssue: boolean;
  issued: boolean;
  receiptNumber: string;
  issuerName: string;
  issuedAt: string | null;
  runStates: YearEndWithholdingReceiptRunStates;
  annualTotalsKrw: PayrollTotalsKrw;
  blockingReasons: string[];
};

export function buildYearEndWithholdingReceiptGuard(
  input: BuildYearEndWithholdingReceiptGuardInput
): YearEndWithholdingReceiptGuard {
  const undistributedRuns = input.confirmedRuns.filter((run) => run.payslipDistributedAt === null);
  const pendingReceiptRuns = input.confirmedRuns.filter(
    (run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null
  );

  const blockingReasons: string[] = [];
  if (input.confirmedRuns.length === 0) {
    blockingReasons.push("no confirmed payroll runs found for selected year");
  }
  if (input.previewedRuns.length > 0) {
    blockingReasons.push("all payroll runs must be confirmed before withholding receipt issue");
  }
  if (undistributedRuns.length > 0) {
    blockingReasons.push("all confirmed runs must be distributed before withholding receipt issue");
  }
  if (pendingReceiptRuns.length > 0) {
    blockingReasons.push(
      "all distributed runs must have payslip receipt confirmation before withholding receipt issue"
    );
  }

  return {
    undistributedRuns,
    pendingReceiptRuns,
    runStates: {
      totalRuns: input.runs.length,
      confirmedRuns: input.confirmedRuns.length,
      previewedRuns: input.previewedRuns.length,
      undistributedRuns: undistributedRuns.length,
      pendingReceiptRuns: pendingReceiptRuns.length,
      previewedRunIds: input.previewedRuns.map((run) => run.id),
      undistributedRunIds: undistributedRuns.map((run) => run.id),
      pendingReceiptRunIds: pendingReceiptRuns.map((run) => run.id)
    },
    blockingReasons,
    canIssue: blockingReasons.length === 0
  };
}

export function buildYearEndWithholdingReceiptSummary(
  input: BuildYearEndWithholdingReceiptSummaryInput
): YearEndWithholdingReceiptSummary {
  const canIssue = input.blockingReasons.length === 0;
  return {
    year: input.year,
    employeeId: input.employeeId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    issue: input.issue,
    canIssue,
    issued: input.issue,
    receiptNumber: input.receiptNumber,
    issuerName: input.issuerName,
    issuedAt: input.issuedAt,
    runStates: input.runStates,
    annualTotalsKrw: input.annualTotalsKrw,
    blockingReasons: input.blockingReasons
  };
}
