import { z } from "zod";
import { defaultMultipliers } from "@/lib/payroll-rules";

const isoDateTime = z.string().datetime({ offset: true });
const nonNegativeInteger = z.number().int().min(0);

export const previewPayrollSchema = z.object({
  periodStart: isoDateTime,
  periodEnd: isoDateTime,
  employeeId: z.string().min(1).optional(),
  hourlyRateKrw: z.number().int().positive().default(10000),
  multipliers: z
    .object({
      regular: z.number().positive(),
      overtime: z.number().positive(),
      night: z.number().positive(),
      holiday: z.number().positive()
    })
    .default(defaultMultipliers)
});

export const previewPayrollWithDeductionsSchema = previewPayrollSchema.extend({
  deductions: z.object({
    withholdingTaxKrw: nonNegativeInteger,
    socialInsuranceKrw: nonNegativeInteger,
    otherDeductionsKrw: nonNegativeInteger.default(0),
    breakdown: z.record(nonNegativeInteger).optional()
  })
});
