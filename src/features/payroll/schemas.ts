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

const statutoryIncomeTaxBracketSchema = z.object({
  upToKrw: nonNegativeInteger.nullable(),
  rate
});

const statutoryKrBaselineSchema = z.object({
  nonTaxableIncomeKrw: nonNegativeInteger.default(0),
  incomeTaxBrackets: z.array(statutoryIncomeTaxBracketSchema).min(1).optional(),
  additionalTaxCreditKrw: nonNegativeInteger.default(0),
  dependentCount: nonNegativeInteger.default(0),
  dependentTaxCreditPerPersonKrw: nonNegativeInteger.default(0),
  requireMonthlyBoundary: z.boolean().default(false),
  incomeTaxRate: rate.default(0.03),
  localIncomeTaxRate: rate.default(0.1),
  nationalPensionRate: rate.default(0.045),
  nationalPensionCapKrw: nonNegativeInteger.optional(),
  healthInsuranceRate: rate.default(0.03545),
  healthInsuranceCapKrw: nonNegativeInteger.optional(),
  longTermCareRateOnHealth: rate.default(0.1295),
  employmentInsuranceRate: rate.default(0.009),
  employmentInsuranceCapKrw: nonNegativeInteger.optional(),
  otherDeductionsKrw: nonNegativeInteger.default(0)
});

const statutoryInsuranceSettlementSchema = z.object({
  nonTaxableIncomeKrw: nonNegativeInteger.default(0),
  requireMonthlyBoundary: z.boolean().default(true),
  nationalPensionEmployeeRate: rate.default(0.045),
  nationalPensionEmployerRate: rate.default(0.045),
  nationalPensionCapKrw: nonNegativeInteger.optional(),
  healthInsuranceEmployeeRate: rate.default(0.03545),
  healthInsuranceEmployerRate: rate.default(0.03545),
  healthInsuranceCapKrw: nonNegativeInteger.optional(),
  longTermCareRateOnHealth: rate.default(0.1295),
  employmentInsuranceEmployeeRate: rate.default(0.009),
  employmentInsuranceEmployerRate: rate.default(0.0115),
  employmentInsuranceCapKrw: nonNegativeInteger.optional(),
  industrialAccidentEmployerRate: rate.default(0.015),
  priorWithheldKrw: nonNegativeInteger.default(0),
  priorEmployerPaidKrw: nonNegativeInteger.default(0)
});

export const previewPayrollWithDeductionsSchema = previewPayrollSchema
  .extend({
    deductionMode: z.enum(["manual", "profile", "statutory_kr_baseline"]).default("manual"),
    profileId: z.string().min(1).optional(),
    expectedProfileVersion: z.number().int().positive().optional(),
    deductions: manualDeductionsSchema.optional(),
    statutory: statutoryKrBaselineSchema.optional()
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
    if (value.deductionMode !== "profile" && value.expectedProfileVersion !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expectedProfileVersion"],
        message: "expectedProfileVersion is supported only when deductionMode is profile"
      });
    }
    if (value.deductionMode !== "manual" && value.deductions !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deductions"],
        message: "deductions is supported only when deductionMode is manual"
      });
    }
    if (value.deductionMode !== "profile" && value.profileId !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["profileId"],
        message: "profileId is supported only when deductionMode is profile"
      });
    }
    if (value.deductionMode !== "statutory_kr_baseline" && value.statutory !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["statutory"],
        message: "statutory is supported only when deductionMode is statutory_kr_baseline"
      });
    }
    if (value.deductionMode === "statutory_kr_baseline" && value.statutory?.incomeTaxBrackets) {
      const brackets = value.statutory.incomeTaxBrackets;
      let lastFiniteUpper = -1;
      for (const [index, bracket] of brackets.entries()) {
        if (bracket.upToKrw === null) {
          if (index !== brackets.length - 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["statutory", "incomeTaxBrackets", index, "upToKrw"],
              message: "open-ended bracket(upToKrw=null) must be the last bracket"
            });
          }
        } else if (bracket.upToKrw <= lastFiniteUpper) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["statutory", "incomeTaxBrackets", index, "upToKrw"],
            message: "incomeTaxBrackets upToKrw values must be strictly increasing"
          });
        } else {
          lastFiniteUpper = bracket.upToKrw;
        }
      }
      if (brackets[brackets.length - 1]?.upToKrw !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["statutory", "incomeTaxBrackets"],
          message: "incomeTaxBrackets must end with an open-ended bracket(upToKrw=null)"
        });
      }
    }
  });

export const previewPayrollInsuranceSettlementSchema = previewPayrollSchema.extend({
  employeeId: z.string().min(1),
  settlement: statutoryInsuranceSettlementSchema.optional()
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
