import type {
  PayrollYearEndInsuranceReconciliationReportResponse,
  PayrollYearEndRecalculationResponse,
  PayrollYearEndSettlementResponse
} from "@/components/payroll-year-end/types";

export type PayrollAccuracyCheckKey =
  | "gross_net_balance"
  | "deduction_components_balance"
  | "withholding_delta_balance"
  | "due_refund_exclusive"
  | "tax_credit_cap_balance"
  | "taxable_income_deduction_balance"
  | "tax_liability_delta_balance"
  | "withholding_delta_change_balance"
  | "taxable_income_reduction_balance"
  | "settlement_recalculation_baseline_balance"
  | "insurance_reconciliation_status_balance"
  | "insurance_monthly_sum_balance";

export type PayrollAccuracyCheck = {
  key: PayrollAccuracyCheckKey;
  passed: boolean;
  detail: string;
};

type SettlementSummary = PayrollYearEndSettlementResponse["summary"];
type RecalculationSummary = PayrollYearEndRecalculationResponse["recalculation"];
type InsuranceReconciliationReport = PayrollYearEndInsuranceReconciliationReportResponse["report"];

function formatDetail(expected: number, actual: number) {
  return `expected=${expected}, actual=${actual}`;
}

function buildSettlementChecks(summary: SettlementSummary): PayrollAccuracyCheck[] {
  const annual = summary.annualTotalsKrw;
  const settlement = summary.settlementKrw;

  const expectedNet = annual.grossPayKrw - annual.totalDeductionsKrw;
  const expectedTotalDeductions =
    annual.withholdingTaxKrw + annual.socialInsuranceKrw + annual.otherDeductionsKrw;
  const expectedWithholdingDelta =
    settlement.annualTaxLiabilityKrw - settlement.priorWithheldTaxKrw;

  const expectedAdditionalDue = Math.max(settlement.withholdingDeltaKrw, 0);
  const expectedRefund = Math.max(-settlement.withholdingDeltaKrw, 0);
  const dueRefundExclusive =
    settlement.additionalWithholdingDueKrw > 0 && settlement.withholdingRefundKrw > 0;

  const taxCreditItems = Object.values(settlement.taxCreditAppliedByItemKrw);
  const summedAppliedTaxCredit = taxCreditItems.reduce((sum, item) => sum + item.appliedKrw, 0);
  const withinCap = taxCreditItems.every(
    (item) => item.appliedKrw >= 0 && item.appliedKrw <= item.inputKrw && item.appliedKrw <= item.capKrw
  );

  return [
    {
      key: "gross_net_balance",
      passed: annual.netPayKrw === expectedNet,
      detail: formatDetail(expectedNet, annual.netPayKrw)
    },
    {
      key: "deduction_components_balance",
      passed: annual.totalDeductionsKrw === expectedTotalDeductions,
      detail: formatDetail(expectedTotalDeductions, annual.totalDeductionsKrw)
    },
    {
      key: "withholding_delta_balance",
      passed: settlement.withholdingDeltaKrw === expectedWithholdingDelta,
      detail: formatDetail(expectedWithholdingDelta, settlement.withholdingDeltaKrw)
    },
    {
      key: "due_refund_exclusive",
      passed:
        !dueRefundExclusive &&
        settlement.additionalWithholdingDueKrw === expectedAdditionalDue &&
        settlement.withholdingRefundKrw === expectedRefund,
      detail: `dueExpected=${expectedAdditionalDue}, dueActual=${settlement.additionalWithholdingDueKrw}, refundExpected=${expectedRefund}, refundActual=${settlement.withholdingRefundKrw}`
    },
    {
      key: "tax_credit_cap_balance",
      passed: withinCap && summedAppliedTaxCredit === settlement.totalTaxCreditAppliedKrw,
      detail: `sumApplied=${summedAppliedTaxCredit}, reported=${settlement.totalTaxCreditAppliedKrw}, withinCap=${withinCap}`
    }
  ];
}

function buildRecalculationChecks(recalculation: RecalculationSummary): PayrollAccuracyCheck[] {
  const deductions = recalculation.deductionItemsKrw;
  const baseline = recalculation.baselineSettlementKrw;
  const target = recalculation.recalculatedSettlementKrw;
  const delta = recalculation.deltaKrw;

  const expectedTaxableAfter =
    deductions.taxableAnnualIncomeBeforeDeductionKrw - deductions.appliedIncomeDeductionKrw;
  const expectedTaxLiability =
    baseline.annualTaxLiabilityKrw + delta.annualTaxLiabilityDeltaKrw;
  const expectedWithholdingDelta =
    baseline.withholdingDeltaKrw + delta.withholdingDeltaChangeKrw;
  const expectedTaxableReduction =
    deductions.taxableAnnualIncomeBeforeDeductionKrw - deductions.taxableAnnualIncomeAfterDeductionKrw;

  return [
    {
      key: "taxable_income_deduction_balance",
      passed: deductions.taxableAnnualIncomeAfterDeductionKrw === expectedTaxableAfter,
      detail: formatDetail(expectedTaxableAfter, deductions.taxableAnnualIncomeAfterDeductionKrw)
    },
    {
      key: "tax_liability_delta_balance",
      passed: target.annualTaxLiabilityKrw === expectedTaxLiability,
      detail: formatDetail(expectedTaxLiability, target.annualTaxLiabilityKrw)
    },
    {
      key: "withholding_delta_change_balance",
      passed: target.withholdingDeltaKrw === expectedWithholdingDelta,
      detail: formatDetail(expectedWithholdingDelta, target.withholdingDeltaKrw)
    },
    {
      key: "taxable_income_reduction_balance",
      passed: delta.taxableIncomeReductionKrw === expectedTaxableReduction,
      detail: formatDetail(expectedTaxableReduction, delta.taxableIncomeReductionKrw)
    }
  ];
}

function buildInsuranceChecks(report: InsuranceReconciliationReport): PayrollAccuracyCheck[] {
  const monthlySocialInsuranceSum = report.monthlyBreakdown.reduce(
    (sum, row) => sum + row.socialInsuranceKrw,
    0
  );
  const statusConsistency =
    report.reconciliation.status === "pending_finalization"
      ? report.finalization.finalized === false
      : report.reconciliation.status === "matched"
        ? report.reconciliation.deltaKrw === 0 && report.finalization.finalized
        : report.reconciliation.deltaKrw !== 0 && report.finalization.finalized;

  return [
    {
      key: "insurance_reconciliation_status_balance",
      passed: statusConsistency,
      detail: `status=${report.reconciliation.status}, delta=${report.reconciliation.deltaKrw}, finalized=${report.finalization.finalized}`
    },
    {
      key: "insurance_monthly_sum_balance",
      passed: monthlySocialInsuranceSum === report.annualRunSocialInsuranceKrw,
      detail: formatDetail(report.annualRunSocialInsuranceKrw, monthlySocialInsuranceSum)
    }
  ];
}

function buildSettlementRecalculationCrossChecks(
  summary: SettlementSummary,
  recalculation: RecalculationSummary
): PayrollAccuracyCheck[] {
  const settlementTaxLiability = summary.settlementKrw.annualTaxLiabilityKrw;
  const settlementWithholdingDelta = summary.settlementKrw.withholdingDeltaKrw;
  const baselineTaxLiability = recalculation.baselineSettlementKrw.annualTaxLiabilityKrw;
  const baselineWithholdingDelta = recalculation.baselineSettlementKrw.withholdingDeltaKrw;
  return [
    {
      key: "settlement_recalculation_baseline_balance",
      passed:
        settlementTaxLiability === baselineTaxLiability &&
        settlementWithholdingDelta === baselineWithholdingDelta,
      detail: `settlementTax=${settlementTaxLiability}, baselineTax=${baselineTaxLiability}, settlementDelta=${settlementWithholdingDelta}, baselineDelta=${baselineWithholdingDelta}`
    }
  ];
}

export function buildPayrollAccuracyEvidence(params: {
  settlement: PayrollYearEndSettlementResponse | null;
  recalculation: PayrollYearEndRecalculationResponse | null;
  insuranceReconciliationReport: PayrollYearEndInsuranceReconciliationReportResponse | null;
}) {
  const checks: PayrollAccuracyCheck[] = [];
  if (params.settlement) {
    checks.push(...buildSettlementChecks(params.settlement.summary));
  }
  if (params.recalculation) {
    checks.push(...buildRecalculationChecks(params.recalculation.recalculation));
  }
  if (params.settlement && params.recalculation) {
    checks.push(
      ...buildSettlementRecalculationCrossChecks(
        params.settlement.summary,
        params.recalculation.recalculation
      )
    );
  }
  if (params.insuranceReconciliationReport) {
    checks.push(...buildInsuranceChecks(params.insuranceReconciliationReport.report));
  }

  const passCount = checks.filter((check) => check.passed).length;
  const failCount = checks.length - passCount;
  return {
    checks,
    passCount,
    failCount
  };
}
