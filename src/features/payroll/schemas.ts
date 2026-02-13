import { z } from "zod";
import { defaultMultipliers } from "@/lib/payroll-rules";

const isoDateTime = z.string().datetime({ offset: true });

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
