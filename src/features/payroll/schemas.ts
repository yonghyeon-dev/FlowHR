import { z } from "zod";
import { defaultMultipliers } from "@/lib/payroll-rules";

const isoDateTime = z.string().datetime({ offset: true });
const nonNegativeInteger = z.number().int().min(0);
const rate = z.number().min(0).max(1);
const payrollStateSchema = z.enum(["PREVIEWED", "CONFIRMED"]);

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

const manualDeductionsSchema = z.object({
  withholdingTaxKrw: nonNegativeInteger,
  socialInsuranceKrw: nonNegativeInteger,
  otherDeductionsKrw: nonNegativeInteger.default(0),
  breakdown: z.record(nonNegativeInteger).optional()
});

export const previewPayrollWithDeductionsSchema = previewPayrollSchema
  .extend({
    deductionMode: z.enum(["manual", "profile"]).default("manual"),
    profileId: z.string().min(1).optional(),
    expectedProfileVersion: z.number().int().positive().optional(),
    deductions: manualDeductionsSchema.optional()
  })
  .superRefine((value, ctx) => {
    if (value.deductionMode === "manual" && !value.deductions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deductions"],
        message: "deductions is required when deductionMode is manual"
      });
    }
    if (value.deductionMode === "profile" && !value.profileId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["profileId"],
        message: "profileId is required when deductionMode is profile"
      });
    }
    if (value.deductionMode === "manual" && value.expectedProfileVersion !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expectedProfileVersion"],
        message: "expectedProfileVersion is supported only when deductionMode is profile"
      });
    }
  });

export const upsertDeductionProfileSchema = z.object({
  name: z.string().min(1),
  mode: z.enum(["manual", "profile"]).default("profile"),
  withholdingRate: rate.nullable().default(null),
  socialInsuranceRate: rate.nullable().default(null),
  fixedOtherDeductionKrw: nonNegativeInteger.default(0),
  active: z.boolean().default(true)
});

export const listPayrollRunsQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional(),
  state: payrollStateSchema.optional()
});

export const listDeductionProfilesQuerySchema = z.object({
  active: z.enum(["true", "false"]).optional(),
  mode: z.enum(["manual", "profile"]).optional()
});
