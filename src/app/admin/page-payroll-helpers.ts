import { analyzePayrollKrIncomeSplitDraftConsistency, type PayrollKrIncomeSplitItemConsistencySummary } from "@/features/payroll/kr-income-split-item-consistency";
import type { PayrollKrIncomeSplitItemDraft } from "@/components/payroll/PayrollKrIncomeSplitItemsTable";

type PayrollPreviewMode = "gross" | "statutory_kr_baseline";

type IncomeSplitItemPayload = {
  code: string;
  category: string;
  amountKrw: number;
};

type BuildAdminPayrollPreviewRequestInput = {
  payrollPreviewMode: PayrollPreviewMode;
  periodStart: string;
  periodEnd: string;
  employeeId: string;
  payrollHourlyRateKrw: string;
  payrollNonTaxableIncomeKrw: string;
  payrollTaxableIncomeKrw: string;
  payrollTaxableItems: PayrollKrIncomeSplitItemDraft[];
  payrollNonTaxableItems: PayrollKrIncomeSplitItemDraft[];
  payrollIncomeSplitItemPresetId: string;
  payrollOtherDeductionsKrw: string;
  payrollAdditionalTaxCreditKrw: string;
  payrollDependentCount: string;
  payrollDependentTaxCreditPerPersonKrw: string;
  payrollIncomeTaxLookupPresetId: string;
  payrollIncomeTaxLookupPresetAuto: boolean;
  payrollIncomeTaxLookupAsOf: string;
  payrollRequireMonthlyBoundary: boolean;
  payrollNationalPensionCapKrw: string;
  payrollHealthInsuranceCapKrw: string;
  payrollEmploymentInsuranceCapKrw: string;
  toIso: (value: string) => string;
};

type AdminPayrollPreviewRequest = {
  hasBlockingConsistencyIssues: boolean;
  consistencySummary: PayrollKrIncomeSplitItemConsistencySummary;
  label: string;
  path: string;
  payload: Record<string, unknown>;
};

export function buildIncomeSplitItems(items: PayrollKrIncomeSplitItemDraft[]): IncomeSplitItemPayload[] {
  return items.flatMap((item) => {
    const codeValue = item.code.trim();
    const categoryValue = item.category.trim();
    const amountValue = item.amountKrw.trim();
    if (!codeValue && !categoryValue && !amountValue) {
      return [];
    }
    const parsedAmount = amountValue.length > 0 ? Math.max(0, Math.trunc(Number(amountValue) || 0)) : -1;
    return [
      {
        code: codeValue,
        category: categoryValue,
        amountKrw: parsedAmount
      }
    ];
  });
}

export function buildAdminPayrollPreviewRequest(
  input: BuildAdminPayrollPreviewRequestInput
): AdminPayrollPreviewRequest {
  const taxableIncomeItems = buildIncomeSplitItems(input.payrollTaxableItems);
  const nonTaxableIncomeItems = buildIncomeSplitItems(input.payrollNonTaxableItems);
  const incomeSplitItemPresetId = input.payrollIncomeSplitItemPresetId.trim();
  const consistencySummary = analyzePayrollKrIncomeSplitDraftConsistency({
    taxableItems: input.payrollTaxableItems,
    nonTaxableItems: input.payrollNonTaxableItems
  });

  const basePayload = {
    periodStart: input.toIso(input.periodStart),
    periodEnd: input.toIso(input.periodEnd),
    employeeId: input.employeeId.trim() || undefined,
    hourlyRateKrw: Number(input.payrollHourlyRateKrw),
    multipliers: {
      overtime: 1.5,
      night: 1.5,
      holiday: 1.5
    }
  };

  const statutoryPayload = {
    ...basePayload,
    deductionMode: "statutory_kr_baseline" as const,
    statutory: {
      nonTaxableIncomeKrw: Math.max(0, Number(input.payrollNonTaxableIncomeKrw) || 0),
      taxableIncomeKrw:
        input.payrollTaxableIncomeKrw.trim().length > 0
          ? Math.max(0, Math.trunc(Number(input.payrollTaxableIncomeKrw) || 0))
          : undefined,
      taxableIncomeItems:
        incomeSplitItemPresetId.length > 0
          ? undefined
          : taxableIncomeItems.length > 0
            ? taxableIncomeItems
            : undefined,
      nonTaxableIncomeItems:
        incomeSplitItemPresetId.length > 0
          ? undefined
          : nonTaxableIncomeItems.length > 0
            ? nonTaxableIncomeItems
            : undefined,
      incomeSplitItemPresetId: incomeSplitItemPresetId || undefined,
      otherDeductionsKrw: Math.max(0, Number(input.payrollOtherDeductionsKrw) || 0),
      additionalTaxCreditKrw: Math.max(0, Math.trunc(Number(input.payrollAdditionalTaxCreditKrw) || 0)),
      dependentCount: Math.max(0, Math.trunc(Number(input.payrollDependentCount) || 0)),
      dependentTaxCreditPerPersonKrw: Math.max(
        0,
        Math.trunc(Number(input.payrollDependentTaxCreditPerPersonKrw) || 0)
      ),
      incomeTaxLookupPresetId: input.payrollIncomeTaxLookupPresetAuto
        ? undefined
        : input.payrollIncomeTaxLookupPresetId.trim() || undefined,
      incomeTaxLookupPresetAuto: input.payrollIncomeTaxLookupPresetAuto,
      incomeTaxLookupAsOf:
        input.payrollIncomeTaxLookupPresetAuto && input.payrollIncomeTaxLookupAsOf.trim().length > 0
          ? input.toIso(input.payrollIncomeTaxLookupAsOf)
          : undefined,
      requireMonthlyBoundary: input.payrollRequireMonthlyBoundary,
      nationalPensionCapKrw:
        input.payrollNationalPensionCapKrw.trim().length > 0
          ? Math.max(0, Number(input.payrollNationalPensionCapKrw) || 0)
          : undefined,
      healthInsuranceCapKrw:
        input.payrollHealthInsuranceCapKrw.trim().length > 0
          ? Math.max(0, Number(input.payrollHealthInsuranceCapKrw) || 0)
          : undefined,
      employmentInsuranceCapKrw:
        input.payrollEmploymentInsuranceCapKrw.trim().length > 0
          ? Math.max(0, Number(input.payrollEmploymentInsuranceCapKrw) || 0)
          : undefined
    }
  };

  if (input.payrollPreviewMode === "gross") {
    return {
      hasBlockingConsistencyIssues: false,
      consistencySummary,
      label: "급여 프리뷰 생성(총지급)",
      path: "/api/payroll/runs/preview",
      payload: basePayload
    };
  }

  return {
    hasBlockingConsistencyIssues: incomeSplitItemPresetId.length === 0 && consistencySummary.hasBlockingIssues,
    consistencySummary,
    label: "급여 프리뷰 생성(법정공제)",
    path: "/api/payroll/runs/preview-with-deductions",
    payload: statutoryPayload
  };
}
