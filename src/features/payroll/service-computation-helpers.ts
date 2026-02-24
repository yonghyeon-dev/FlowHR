import { calculateGrossPay, derivePayableMinutes, type PayableMinutes } from "@/lib/payroll-rules";
import type { DataAccess } from "@/features/shared/data-access";
import { ensureValidPeriod } from "@/features/payroll/service-runtime-helpers";
import type { PreviewPayrollInput } from "@/features/payroll/service-input-types";
import type { PayrollComputation } from "@/features/payroll/service-output-types";

export const emptyPayrollComputationTotals: PayableMinutes = {
  regular: 0,
  overtime: 0,
  night: 0,
  holiday: 0
};

export async function calculatePayrollComputation(
  dataAccess: DataAccess,
  input: PreviewPayrollInput,
  tenantScope: string | null
): Promise<PayrollComputation> {
  ensureValidPeriod(input.periodStart, input.periodEnd);

  const records = await dataAccess.attendance.listApprovedInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId: input.employeeId
  });

  let totals = emptyPayrollComputationTotals;
  for (const record of records) {
    if (!record.checkOutAt) {
      continue;
    }
    const split = derivePayableMinutes(
      record.checkInAt,
      record.checkOutAt,
      record.breakMinutes,
      record.isHoliday
    );
    totals = {
      regular: totals.regular + split.regular,
      overtime: totals.overtime + split.overtime,
      night: totals.night + split.night,
      holiday: totals.holiday + split.holiday
    };
  }

  const grossPayKrw = calculateGrossPay(totals, input.hourlyRateKrw, input.multipliers);
  return {
    recordsCount: records.length,
    totals,
    grossPayKrw
  };
}
