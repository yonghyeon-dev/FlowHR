import type { Multipliers } from "@/lib/payroll-rules";

export type PreviewPayrollInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  hourlyRateKrw: number;
  multipliers: Multipliers;
};

export type ManualDeductions = {
  deductionMode: "manual";
  deductions: {
    withholdingTaxKrw: number;
    socialInsuranceKrw: number;
    otherDeductionsKrw: number;
    breakdown?: Record<string, number>;
  };
};

export type ProfileDeductions = {
  deductionMode: "profile";
  profileId: string;
  expectedProfileVersion?: number;
};

export type StatutoryKrBaselineDeductions = {
  deductionMode: "statutory_kr_baseline";
  statutory?: {
    nonTaxableIncomeKrw: number;
    taxableIncomeKrw?: number;
    taxableIncomeItems?: Array<{
      code: string;
      category: string;
      amountKrw: number;
    }>;
    nonTaxableIncomeItems?: Array<{
      code: string;
      category: string;
      amountKrw: number;
    }>;
    incomeSplitItemPresetId?: string;
    incomeTaxBrackets?: Array<{
      upToKrw: number | null;
      rate: number;
    }>;
    incomeTaxLookupTable?: Array<{
      upToKrw: number | null;
      taxKrw: number;
      dependentTaxKrw?: Array<{
        dependentCount: number;
        taxKrw: number;
      }>;
    }>;
    incomeTaxLookupPresetId?: string;
    incomeTaxLookupPresetAuto?: boolean;
    incomeTaxLookupAsOf?: string;
    additionalTaxCreditKrw: number;
    dependentCount: number;
    dependentTaxCreditPerPersonKrw: number;
    requireMonthlyBoundary: boolean;
    incomeTaxRate: number;
    localIncomeTaxRate: number;
    nationalPensionRate: number;
    nationalPensionCapKrw?: number;
    healthInsuranceRate: number;
    healthInsuranceCapKrw?: number;
    longTermCareRateOnHealth: number;
    employmentInsuranceRate: number;
    employmentInsuranceCapKrw?: number;
    insuranceRounding?: {
      mode: "round" | "floor" | "ceil";
      nationalPensionUnitKrw: number;
      healthInsuranceUnitKrw: number;
      longTermCareUnitKrw: number;
      employmentInsuranceUnitKrw: number;
    };
    otherDeductionsKrw: number;
  };
};

export type PreviewPayrollWithDeductionsInput = PreviewPayrollInput &
  (ManualDeductions | ProfileDeductions | StatutoryKrBaselineDeductions);

export type PreviewPayrollInsuranceSettlementInput = PreviewPayrollInput & {
  employeeId: string;
  settlement?: {
    nonTaxableIncomeKrw: number;
    requireMonthlyBoundary: boolean;
    insurancePolicyPresetId?: string;
    insurancePolicyPresetAuto?: boolean;
    insurancePolicyAsOf?: string;
    insuranceRounding?: {
      mode: "round" | "floor" | "ceil";
      nationalPensionUnitKrw: number;
      healthInsuranceUnitKrw: number;
      longTermCareUnitKrw: number;
      employmentInsuranceUnitKrw: number;
      industrialAccidentUnitKrw: number;
    };
    nationalPensionEmployeeRate?: number;
    nationalPensionEmployerRate?: number;
    nationalPensionCapKrw?: number;
    healthInsuranceEmployeeRate?: number;
    healthInsuranceEmployerRate?: number;
    healthInsuranceCapKrw?: number;
    longTermCareRateOnHealth?: number;
    employmentInsuranceEmployeeRate?: number;
    employmentInsuranceEmployerRate?: number;
    employmentInsuranceCapKrw?: number;
    industrialAccidentEmployerRate?: number;
    priorWithheldKrw: number;
    priorEmployerPaidKrw: number;
  };
};

export type ClosePayrollPeriodInput = {
  periodStart: Date;
  periodEnd: Date;
  apply: boolean;
  settlement?: {
    priorPaidWithholdingTaxKrw: number;
    priorPaidSocialInsuranceKrw: number;
    priorPaidNetPayKrw: number;
  };
};

export type PayslipDeliveryChannel = "in_app" | "email";

export type DistributePayrollPayslipsInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  deliveryChannel: PayslipDeliveryChannel;
  dryRun: boolean;
};

export type AcknowledgePayrollPayslipReceiptInput = {
  runId: string;
};

export type YearEndTaxCreditItemsInput = {
  earnedIncomeTaxCreditKrw: number;
  childTaxCreditKrw: number;
  additionalTaxCreditKrw: number;
};

export type PreviewPayrollYearEndSettlementInput = {
  year: number;
  employeeId: string;
  nonTaxableAnnualIncomeKrw: number;
  additionalTaxCreditKrw: number;
  taxCredits?: Partial<YearEndTaxCreditItemsInput>;
  annualIncomeTaxRate: number;
  localIncomeTaxRate: number;
};

export type YearEndDeductionItemsInput = {
  personalPensionKrw: number;
  insurancePremiumKrw: number;
  medicalExpenseKrw: number;
  educationExpenseKrw: number;
  donationKrw: number;
  housingSavingsKrw: number;
};

export type YearEndDeductionEligibilityInput = {
  personalPensionEligible: boolean;
  insurancePremiumEligible: boolean;
  medicalExpenseEligible: boolean;
  educationExpenseEligible: boolean;
  donationEligible: boolean;
  housingSavingsEligible: boolean;
};

export type YearEndTaxCreditItemKey = keyof YearEndTaxCreditItemsInput;

export type YearEndTaxCreditCapAppliedItemKrw = {
  inputKrw: number;
  capKrw: number;
  appliedKrw: number;
  capped: boolean;
  applicationReasonCode: YearEndAppliedReasonCode;
  applicationReason: string;
};

export type YearEndTaxCreditCapAppliedBreakdownKrw = Record<
  YearEndTaxCreditItemKey,
  YearEndTaxCreditCapAppliedItemKrw
>;

export type YearEndDeductionItemKey = keyof YearEndDeductionItemsInput;

export type YearEndDeductionCapAppliedItemKrw = {
  inputKrw: number;
  capKrw: number;
  appliedKrw: number;
  capped: boolean;
  applicationReasonCode: YearEndAppliedReasonCode;
  applicationReason: string;
};

export type YearEndAppliedReasonCode = "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED";

export type YearEndDeductionCapAppliedBreakdownKrw = Record<
  YearEndDeductionItemKey,
  YearEndDeductionCapAppliedItemKrw
>;

export type PayrollYearEndFilingExportFormat = "json" | "csv" | "jsonl" | "hometax_csv";
export type PayrollYearEndFilingValidationMode = "basic" | "strict";
export type PayrollYearEndFilingTransport = "manual_portal" | "hometax_upload" | "nts_api_mock";
export type PayrollYearEndFilingAckStatus = "accepted" | "rejected";

export type RecalculatePayrollYearEndSettlementInput = PreviewPayrollYearEndSettlementInput & {
  deductionItems: YearEndDeductionItemsInput;
  deductionEligibility?: Partial<YearEndDeductionEligibilityInput>;
};

export type FinalizePayrollYearEndSettlementInput = PreviewPayrollYearEndSettlementInput & {
  deductionItems: YearEndDeductionItemsInput;
  deductionEligibility?: Partial<YearEndDeductionEligibilityInput>;
  apply: boolean;
  finalizedByNote?: string;
  expectedSettlementHash?: string;
};

export type ExportPayrollYearEndFilingDataInput = {
  year: number;
  employeeId: string;
  format: PayrollYearEndFilingExportFormat;
  validationMode: PayrollYearEndFilingValidationMode;
  expectedSettlementHash?: string;
};

export type SubmitPayrollYearEndFilingPackageInput = {
  year: number;
  employeeId: string;
  format: PayrollYearEndFilingExportFormat;
  validationMode: PayrollYearEndFilingValidationMode;
  expectedSettlementHash?: string;
  transport: PayrollYearEndFilingTransport;
  submissionNote?: string;
};

export type ResubmitPayrollYearEndFilingPackageInput = {
  year: number;
  employeeId: string;
  submissionId: string;
  format: PayrollYearEndFilingExportFormat;
  validationMode: PayrollYearEndFilingValidationMode;
  expectedSettlementHash?: string;
  transport: PayrollYearEndFilingTransport;
  submissionNote?: string;
  resubmissionReason?: string;
};

export type AcknowledgePayrollYearEndFilingPackageInput = {
  year: number;
  employeeId: string;
  submissionId: string;
  expectedSettlementHash?: string;
  ackStatus: PayrollYearEndFilingAckStatus;
  ackCode?: string;
  ackNote?: string;
  rejectionReasonCode?: string;
  rejectionReasonDetail?: string;
};

export type CancelPayrollYearEndFilingPackageInput = {
  year: number;
  employeeId: string;
  submissionId: string;
};

export type ReopenPayrollYearEndFilingPackageInput = {
  year: number;
  employeeId: string;
  submissionId: string;
};

export type PayrollYearEndFilingSubmissionStatus = "submitted" | "acknowledged" | "canceled";

export type PayrollYearEndFilingSubmissionStatusFilter =
  | PayrollYearEndFilingSubmissionStatus
  | "all";
export type PayrollYearEndFilingSubmissionAckStatusFilter = PayrollYearEndFilingAckStatus | "none" | "all";
export type PayrollYearEndFilingSubmissionValidationStatusFilter = "pass" | "fail" | "all";
export type PayrollYearEndFilingSubmissionTransportFilter = PayrollYearEndFilingTransport | "all";
export type PayrollYearEndFilingSubmissionSortBy =
  | "submittedAt"
  | "attempt"
  | "status"
  | "ackStatus"
  | "validationStatus"
  | "transport";
export type PayrollYearEndFilingSubmissionSortDirection = "asc" | "desc";

export type ListPayrollYearEndFilingSubmissionsInput = {
  year: number;
  employeeId: string;
  status?: PayrollYearEndFilingSubmissionStatusFilter;
  ackStatus?: PayrollYearEndFilingSubmissionAckStatusFilter;
  validationStatus?: PayrollYearEndFilingSubmissionValidationStatusFilter;
  transport?: PayrollYearEndFilingSubmissionTransportFilter;
  settlementHash?: string;
  search?: string;
  sortBy?: PayrollYearEndFilingSubmissionSortBy;
  sortDirection?: PayrollYearEndFilingSubmissionSortDirection;
};

export type ListPayrollYearEndFilingSubmissionTimelineInput = {
  year: number;
  employeeId: string;
  submissionId: string;
};

export type AddPayrollYearEndFilingEvidenceNoteInput = {
  year: number;
  employeeId: string;
  submissionId: string;
  note: string;
};

export type IssuePayrollYearEndWithholdingReceiptInput = {
  year: number;
  employeeId: string;
  issue: boolean;
  issuerName?: string;
};

export type PayrollYearEndWithholdingReceiptDocumentFormat = "json" | "text";

export type GetPayrollYearEndWithholdingReceiptDocumentInput = {
  year: number;
  employeeId: string;
  format: PayrollYearEndWithholdingReceiptDocumentFormat;
};

export type GetPayrollYearEndFinalizedSettlementInput = {
  year: number;
  employeeId: string;
};

export type GetPayrollYearEndInsuranceReconciliationReportInput = {
  year: number;
  employeeId: string;
};

export type GetPayrollYearEndPreflightChecklistInput = {
  year: number;
  employeeId: string;
  nonTaxableAnnualIncomeKrw?: number;
};

export type UpsertDeductionProfileInput = {
  profileId: string;
  name: string;
  mode: "manual" | "profile";
  withholdingRate: number | null;
  socialInsuranceRate: number | null;
  fixedOtherDeductionKrw: number;
  active: boolean;
};
