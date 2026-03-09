import type {
  OrganizationEntity,
  UpdateOrganizationInput
} from "@/features/shared/data-access";

export type PayrollFeatureToggleMode = "default" | "enabled" | "disabled";

export type PayrollRuntimeFeatureFlags = {
  deductions: boolean;
  deductionProfile: boolean;
  krBaseline: boolean;
  krInsuranceSettlement: boolean;
  closePeriod: boolean;
  payslipDelivery: boolean;
  yearEnd: boolean;
  yearEndDeductionInput: boolean;
  yearEndFilingExport: boolean;
  yearEndFilingSubmission: boolean;
};

export type PayrollFeatureManagementSnapshot = {
  payroll: {
    [Key in keyof PayrollRuntimeFeatureFlags]: {
      mode: PayrollFeatureToggleMode;
      effectiveEnabled: boolean;
      fallbackEnabled: boolean;
    };
  };
};

type PayrollFeatureManagementPayload = {
  payroll: {
    [Key in keyof PayrollRuntimeFeatureFlags]: {
      mode: PayrollFeatureToggleMode;
    };
  };
};

type PayrollFeatureSettingsOrganization = Pick<
  OrganizationEntity,
  | "payrollFeatureDeductionsEnabled"
  | "payrollFeatureDeductionProfileEnabled"
  | "payrollFeatureKrBaselineEnabled"
  | "payrollFeatureKrInsuranceSettlementEnabled"
  | "payrollFeatureClosePeriodEnabled"
  | "payrollFeaturePayslipDeliveryEnabled"
  | "payrollFeatureYearEndEnabled"
  | "payrollFeatureYearEndDeductionInputEnabled"
  | "payrollFeatureYearEndFilingExportEnabled"
  | "payrollFeatureYearEndFilingSubmissionEnabled"
>;

function readBooleanEnvFlag(primaryKey: string, legacyKey: string): boolean {
  const raw = process.env[primaryKey] ?? process.env[legacyKey] ?? "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function toMode(value: boolean | null | undefined): PayrollFeatureToggleMode {
  if (value === true) {
    return "enabled";
  }
  if (value === false) {
    return "disabled";
  }
  return "default";
}

function toOverrideValue(mode: PayrollFeatureToggleMode): boolean | null {
  if (mode === "enabled") {
    return true;
  }
  if (mode === "disabled") {
    return false;
  }
  return null;
}

export function resolvePayrollRuntimeFeatureFlags(
  organization: PayrollFeatureSettingsOrganization | null | undefined
): PayrollRuntimeFeatureFlags {
  const defaults: PayrollRuntimeFeatureFlags = {
    deductions: readBooleanEnvFlag("FLOWHR_PAYROLL_DEDUCTIONS_V1", "PAYROLL_DEDUCTIONS_V1"),
    deductionProfile: readBooleanEnvFlag(
      "FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1",
      "PAYROLL_DEDUCTION_PROFILE_V1"
    ),
    krBaseline: readBooleanEnvFlag("FLOWHR_PAYROLL_KR_BASELINE_V1", "PAYROLL_KR_BASELINE_V1"),
    krInsuranceSettlement: readBooleanEnvFlag(
      "FLOWHR_PAYROLL_KR_INSURANCE_SETTLEMENT_V1",
      "PAYROLL_KR_INSURANCE_SETTLEMENT_V1"
    ),
    closePeriod: readBooleanEnvFlag("FLOWHR_PAYROLL_CLOSE_PERIOD_V1", "PAYROLL_CLOSE_PERIOD_V1"),
    payslipDelivery: readBooleanEnvFlag(
      "FLOWHR_PAYROLL_PAYSLIP_DELIVERY_V1",
      "PAYROLL_PAYSLIP_DELIVERY_V1"
    ),
    yearEnd: readBooleanEnvFlag("FLOWHR_PAYROLL_YEAR_END_V1", "PAYROLL_YEAR_END_V1"),
    yearEndDeductionInput: readBooleanEnvFlag(
      "FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1",
      "PAYROLL_YEAR_END_DEDUCTION_INPUT_V1"
    ),
    yearEndFilingExport: readBooleanEnvFlag(
      "FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1",
      "PAYROLL_YEAR_END_FILING_EXPORT_V1"
    ),
    yearEndFilingSubmission: readBooleanEnvFlag(
      "FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1",
      "PAYROLL_YEAR_END_FILING_SUBMISSION_V1"
    )
  };

  return {
    deductions: organization?.payrollFeatureDeductionsEnabled ?? defaults.deductions,
    deductionProfile:
      organization?.payrollFeatureDeductionProfileEnabled ?? defaults.deductionProfile,
    krBaseline: organization?.payrollFeatureKrBaselineEnabled ?? defaults.krBaseline,
    krInsuranceSettlement:
      organization?.payrollFeatureKrInsuranceSettlementEnabled ??
      defaults.krInsuranceSettlement,
    closePeriod: organization?.payrollFeatureClosePeriodEnabled ?? defaults.closePeriod,
    payslipDelivery:
      organization?.payrollFeaturePayslipDeliveryEnabled ?? defaults.payslipDelivery,
    yearEnd: organization?.payrollFeatureYearEndEnabled ?? defaults.yearEnd,
    yearEndDeductionInput:
      organization?.payrollFeatureYearEndDeductionInputEnabled ??
      defaults.yearEndDeductionInput,
    yearEndFilingExport:
      organization?.payrollFeatureYearEndFilingExportEnabled ??
      defaults.yearEndFilingExport,
    yearEndFilingSubmission:
      organization?.payrollFeatureYearEndFilingSubmissionEnabled ??
      defaults.yearEndFilingSubmission
  };
}

export function resolveOrganizationPayrollFeatureManagementSettings(
  organization: PayrollFeatureSettingsOrganization | null | undefined
): PayrollFeatureManagementSnapshot {
  const effective = resolvePayrollRuntimeFeatureFlags(organization);
  const fallback = resolvePayrollRuntimeFeatureFlags(null);

  return {
    payroll: {
      deductions: {
        mode: toMode(organization?.payrollFeatureDeductionsEnabled),
        effectiveEnabled: effective.deductions,
        fallbackEnabled: fallback.deductions
      },
      deductionProfile: {
        mode: toMode(organization?.payrollFeatureDeductionProfileEnabled),
        effectiveEnabled: effective.deductionProfile,
        fallbackEnabled: fallback.deductionProfile
      },
      krBaseline: {
        mode: toMode(organization?.payrollFeatureKrBaselineEnabled),
        effectiveEnabled: effective.krBaseline,
        fallbackEnabled: fallback.krBaseline
      },
      krInsuranceSettlement: {
        mode: toMode(organization?.payrollFeatureKrInsuranceSettlementEnabled),
        effectiveEnabled: effective.krInsuranceSettlement,
        fallbackEnabled: fallback.krInsuranceSettlement
      },
      closePeriod: {
        mode: toMode(organization?.payrollFeatureClosePeriodEnabled),
        effectiveEnabled: effective.closePeriod,
        fallbackEnabled: fallback.closePeriod
      },
      payslipDelivery: {
        mode: toMode(organization?.payrollFeaturePayslipDeliveryEnabled),
        effectiveEnabled: effective.payslipDelivery,
        fallbackEnabled: fallback.payslipDelivery
      },
      yearEnd: {
        mode: toMode(organization?.payrollFeatureYearEndEnabled),
        effectiveEnabled: effective.yearEnd,
        fallbackEnabled: fallback.yearEnd
      },
      yearEndDeductionInput: {
        mode: toMode(organization?.payrollFeatureYearEndDeductionInputEnabled),
        effectiveEnabled: effective.yearEndDeductionInput,
        fallbackEnabled: fallback.yearEndDeductionInput
      },
      yearEndFilingExport: {
        mode: toMode(organization?.payrollFeatureYearEndFilingExportEnabled),
        effectiveEnabled: effective.yearEndFilingExport,
        fallbackEnabled: fallback.yearEndFilingExport
      },
      yearEndFilingSubmission: {
        mode: toMode(organization?.payrollFeatureYearEndFilingSubmissionEnabled),
        effectiveEnabled: effective.yearEndFilingSubmission,
        fallbackEnabled: fallback.yearEndFilingSubmission
      }
    }
  };
}

export function toOrganizationPayrollFeatureManagementUpdateInput(
  payload: PayrollFeatureManagementPayload
): UpdateOrganizationInput {
  return {
    payrollFeatureDeductionsEnabled: toOverrideValue(payload.payroll.deductions.mode),
    payrollFeatureDeductionProfileEnabled: toOverrideValue(
      payload.payroll.deductionProfile.mode
    ),
    payrollFeatureKrBaselineEnabled: toOverrideValue(payload.payroll.krBaseline.mode),
    payrollFeatureKrInsuranceSettlementEnabled: toOverrideValue(
      payload.payroll.krInsuranceSettlement.mode
    ),
    payrollFeatureClosePeriodEnabled: toOverrideValue(payload.payroll.closePeriod.mode),
    payrollFeaturePayslipDeliveryEnabled: toOverrideValue(
      payload.payroll.payslipDelivery.mode
    ),
    payrollFeatureYearEndEnabled: toOverrideValue(payload.payroll.yearEnd.mode),
    payrollFeatureYearEndDeductionInputEnabled: toOverrideValue(
      payload.payroll.yearEndDeductionInput.mode
    ),
    payrollFeatureYearEndFilingExportEnabled: toOverrideValue(
      payload.payroll.yearEndFilingExport.mode
    ),
    payrollFeatureYearEndFilingSubmissionEnabled: toOverrideValue(
      payload.payroll.yearEndFilingSubmission.mode
    )
  };
}
