import { ServiceError } from "@/features/shared/service-error";
import type { PayrollRuntimeFeatureFlags } from "@/features/payroll/feature-management-settings";

function readBooleanEnvFlag(primaryKey: string, legacyKey: string): boolean {
  const raw = process.env[primaryKey] ?? process.env[legacyKey] ?? "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "periodEnd must be after periodStart");
  }
}

export function toKrwInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new ServiceError(400, `${fieldName} must be a non-negative integer`);
  }
  return value;
}

export function toRateNumber(value: number | null, fieldName: string) {
  if (value === null) {
    return null;
  }
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ServiceError(400, `${fieldName} must be between 0 and 1`);
  }
  return value;
}

export function isPayrollDeductionsEnabled(flags?: PayrollRuntimeFeatureFlags) {
  return flags?.deductions ?? readBooleanEnvFlag("FLOWHR_PAYROLL_DEDUCTIONS_V1", "PAYROLL_DEDUCTIONS_V1");
}

export function isPayrollDeductionProfileEnabled(flags?: PayrollRuntimeFeatureFlags) {
  return (
    flags?.deductionProfile ??
    readBooleanEnvFlag(
      "FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1",
      "PAYROLL_DEDUCTION_PROFILE_V1"
    )
  );
}

export function isPayrollKrBaselineEnabled(flags?: PayrollRuntimeFeatureFlags) {
  return flags?.krBaseline ?? readBooleanEnvFlag("FLOWHR_PAYROLL_KR_BASELINE_V1", "PAYROLL_KR_BASELINE_V1");
}

export function isPayrollKrInsuranceSettlementEnabled(flags?: PayrollRuntimeFeatureFlags) {
  return (
    flags?.krInsuranceSettlement ??
    readBooleanEnvFlag(
      "FLOWHR_PAYROLL_KR_INSURANCE_SETTLEMENT_V1",
      "PAYROLL_KR_INSURANCE_SETTLEMENT_V1"
    )
  );
}

export function isPayrollClosePeriodEnabled(flags?: PayrollRuntimeFeatureFlags) {
  return flags?.closePeriod ?? readBooleanEnvFlag("FLOWHR_PAYROLL_CLOSE_PERIOD_V1", "PAYROLL_CLOSE_PERIOD_V1");
}

export function isPayrollPayslipDeliveryEnabled(flags?: PayrollRuntimeFeatureFlags) {
  return (
    flags?.payslipDelivery ??
    readBooleanEnvFlag(
      "FLOWHR_PAYROLL_PAYSLIP_DELIVERY_V1",
      "PAYROLL_PAYSLIP_DELIVERY_V1"
    )
  );
}

export function isPayrollYearEndEnabled(flags?: PayrollRuntimeFeatureFlags) {
  return flags?.yearEnd ?? readBooleanEnvFlag("FLOWHR_PAYROLL_YEAR_END_V1", "PAYROLL_YEAR_END_V1");
}

export function isPayrollYearEndDeductionInputEnabled(flags?: PayrollRuntimeFeatureFlags) {
  return (
    flags?.yearEndDeductionInput ??
    readBooleanEnvFlag(
      "FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1",
      "PAYROLL_YEAR_END_DEDUCTION_INPUT_V1"
    )
  );
}

export function isPayrollYearEndFilingExportEnabled(flags?: PayrollRuntimeFeatureFlags) {
  return (
    flags?.yearEndFilingExport ??
    readBooleanEnvFlag(
      "FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1",
      "PAYROLL_YEAR_END_FILING_EXPORT_V1"
    )
  );
}

export function isPayrollYearEndFilingSubmissionEnabled(flags?: PayrollRuntimeFeatureFlags) {
  return (
    flags?.yearEndFilingSubmission ??
    readBooleanEnvFlag(
      "FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1",
      "PAYROLL_YEAR_END_FILING_SUBMISSION_V1"
    )
  );
}

export function getYearPeriodInSeoul(year: number) {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new ServiceError(400, "year must be between 2020 and 2100");
  }
  return {
    periodStart: new Date(`${year}-01-01T00:00:00+09:00`),
    periodEnd: new Date(`${year}-12-31T23:59:59+09:00`)
  };
}

export type SeoulDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const seoulDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

export function toSeoulDateTimeParts(value: Date): SeoulDateTimeParts {
  const parts = seoulDateTimeFormatter.formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((item) => item.type === type);
    return part ? Number(part.value) : Number.NaN;
  };
  const rawHour = read("hour");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: read("minute"),
    second: read("second")
  };
}

export function formatSeoulDateTime(parts: SeoulDateTimeParts) {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  const hour = String(parts.hour).padStart(2, "0");
  const minute = String(parts.minute).padStart(2, "0");
  const second = String(parts.second).padStart(2, "0");
  return `${parts.year}-${month}-${day} ${hour}:${minute}:${second} (Asia/Seoul)`;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function ensureMonthlyBoundaryInSeoul(periodStart: Date, periodEnd: Date) {
  const start = toSeoulDateTimeParts(periodStart);
  const end = toSeoulDateTimeParts(periodEnd);
  if (start.year !== end.year || start.month !== end.month) {
    throw new ServiceError(
      400,
      "statutory.requireMonthlyBoundary requires periodStart/periodEnd to be in the same month (Asia/Seoul)"
    );
  }

  if (start.day !== 1 || start.hour !== 0 || start.minute !== 0 || start.second !== 0) {
    throw new ServiceError(
      400,
      "statutory.requireMonthlyBoundary requires periodStart to be first day 00:00:00 (Asia/Seoul)"
    );
  }

  const monthLastDay = lastDayOfMonth(start.year, start.month);
  if (end.day !== monthLastDay || end.hour !== 23 || end.minute !== 59) {
    throw new ServiceError(
      400,
      "statutory.requireMonthlyBoundary requires periodEnd to be last day 23:59:* (Asia/Seoul)"
    );
  }
}
