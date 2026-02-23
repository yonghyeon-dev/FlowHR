import { z } from "zod";
import { defaultMultipliers } from "@/lib/payroll-rules";
import { findPayrollKrIncomeSplitItemCodeDictionaryEntry } from "@/features/payroll/kr-income-split-item-code-dictionary";

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

const statutoryIncomeTaxLookupRowSchema = z.object({
  upToKrw: nonNegativeInteger.nullable(),
  taxKrw: nonNegativeInteger
});

const statutoryIncomeSplitItemSchema = z.object({
  code: z.string().trim().min(1).max(40),
  category: z.string().trim().min(1).max(40),
  amountKrw: nonNegativeInteger
});

const statutoryInsuranceRoundingSchema = z.object({
  mode: z.enum(["round", "floor", "ceil"]).default("round"),
  nationalPensionUnitKrw: z.number().int().positive().default(1),
  healthInsuranceUnitKrw: z.number().int().positive().default(1),
  longTermCareUnitKrw: z.number().int().positive().default(1),
  employmentInsuranceUnitKrw: z.number().int().positive().default(1)
});

const settlementInsuranceRoundingSchema = statutoryInsuranceRoundingSchema.extend({
  industrialAccidentUnitKrw: z.number().int().positive().default(1)
});

const statutoryKrBaselineSchema = z.object({
  nonTaxableIncomeKrw: nonNegativeInteger.default(0),
  taxableIncomeKrw: nonNegativeInteger.optional(),
  taxableIncomeItems: z.array(statutoryIncomeSplitItemSchema).max(20).optional(),
  nonTaxableIncomeItems: z.array(statutoryIncomeSplitItemSchema).max(20).optional(),
  incomeSplitItemPresetId: z.string().min(1).max(80).optional(),
  incomeTaxBrackets: z.array(statutoryIncomeTaxBracketSchema).min(1).optional(),
  incomeTaxLookupTable: z.array(statutoryIncomeTaxLookupRowSchema).min(1).optional(),
  incomeTaxLookupPresetId: z.string().min(1).max(80).optional(),
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
  insuranceRounding: statutoryInsuranceRoundingSchema.optional(),
  otherDeductionsKrw: nonNegativeInteger.default(0)
});

const statutoryInsuranceSettlementSchema = z.object({
  nonTaxableIncomeKrw: nonNegativeInteger.default(0),
  requireMonthlyBoundary: z.boolean().default(true),
  insuranceRounding: settlementInsuranceRoundingSchema.optional(),
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
    if (value.deductionMode === "statutory_kr_baseline") {
      const brackets = value.statutory?.incomeTaxBrackets;
      const lookupTable = value.statutory?.incomeTaxLookupTable;
      const lookupPresetId = value.statutory?.incomeTaxLookupPresetId;
      const taxableIncomeItems = value.statutory?.taxableIncomeItems;
      const nonTaxableIncomeItems = value.statutory?.nonTaxableIncomeItems;
      const incomeSplitItemPresetId = value.statutory?.incomeSplitItemPresetId;
      if (brackets && lookupTable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["statutory"],
          message: "incomeTaxBrackets and incomeTaxLookupTable are mutually exclusive"
        });
      }
      if (brackets && lookupPresetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["statutory"],
          message: "incomeTaxBrackets and incomeTaxLookupPresetId are mutually exclusive"
        });
      }
      if (lookupTable && lookupPresetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["statutory"],
          message: "incomeTaxLookupTable and incomeTaxLookupPresetId are mutually exclusive"
        });
      }
      if (incomeSplitItemPresetId && (taxableIncomeItems || nonTaxableIncomeItems)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["statutory"],
          message:
            "incomeSplitItemPresetId and taxableIncomeItems/nonTaxableIncomeItems are mutually exclusive"
        });
      }
      if (brackets) {
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
      if (lookupTable) {
        let lastFiniteUpper = -1;
        let lastTaxKrw = -1;
        for (const [index, row] of lookupTable.entries()) {
          if (row.upToKrw === null) {
            if (index !== lookupTable.length - 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["statutory", "incomeTaxLookupTable", index, "upToKrw"],
                message: "open-ended row(upToKrw=null) must be the last lookup row"
              });
            }
          } else if (row.upToKrw <= lastFiniteUpper) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["statutory", "incomeTaxLookupTable", index, "upToKrw"],
              message: "incomeTaxLookupTable upToKrw values must be strictly increasing"
            });
          } else {
            lastFiniteUpper = row.upToKrw;
          }
          if (row.taxKrw < lastTaxKrw) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["statutory", "incomeTaxLookupTable", index, "taxKrw"],
              message: "incomeTaxLookupTable taxKrw values must be non-decreasing"
            });
          }
          lastTaxKrw = row.taxKrw;
        }
        if (lookupTable[lookupTable.length - 1]?.upToKrw !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["statutory", "incomeTaxLookupTable"],
            message: "incomeTaxLookupTable must end with an open-ended row(upToKrw=null)"
          });
        }
      }

      function validateIncomeSplitItemCodes(
        fieldName: "taxableIncomeItems" | "nonTaxableIncomeItems",
        items: Array<{ code: string }>
      ) {
        const seen = new Set<string>();
        for (const [index, item] of items.entries()) {
          const normalized = item.code.trim().toLowerCase();
          if (seen.has(normalized)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["statutory", fieldName, index, "code"],
              message: `${fieldName} code must be unique(case-insensitive)`
            });
          }
          seen.add(normalized);
        }
      }

      function validateIncomeSplitItemDictionary(
        fieldName: "taxableIncomeItems" | "nonTaxableIncomeItems",
        kind: "taxable" | "non_taxable",
        items: Array<{ code: string; category: string }>
      ) {
        for (const [index, item] of items.entries()) {
          const dictionaryEntry = findPayrollKrIncomeSplitItemCodeDictionaryEntry(item.code, kind);
          if (!dictionaryEntry) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["statutory", fieldName, index, "code"],
              message: `${fieldName} code is not supported by dictionary: ${item.code}`
            });
            continue;
          }
          const normalizedCategory = item.category.trim().toLowerCase();
          if (normalizedCategory !== dictionaryEntry.category.toLowerCase()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["statutory", fieldName, index, "category"],
              message: `${fieldName} category must match dictionary category(${dictionaryEntry.category}) for code ${dictionaryEntry.code}`
            });
          }
        }
      }

      if (taxableIncomeItems) {
        validateIncomeSplitItemCodes("taxableIncomeItems", taxableIncomeItems);
        validateIncomeSplitItemDictionary("taxableIncomeItems", "taxable", taxableIncomeItems);
      }
      if (nonTaxableIncomeItems) {
        validateIncomeSplitItemCodes("nonTaxableIncomeItems", nonTaxableIncomeItems);
        validateIncomeSplitItemDictionary(
          "nonTaxableIncomeItems",
          "non_taxable",
          nonTaxableIncomeItems
        );
      }
    }
  });

export const previewPayrollInsuranceSettlementSchema = previewPayrollSchema.extend({
  employeeId: z.string().min(1),
  settlement: statutoryInsuranceSettlementSchema.optional()
});

const closePayrollPeriodSettlementSchema = z.object({
  priorPaidWithholdingTaxKrw: nonNegativeInteger.default(0),
  priorPaidSocialInsuranceKrw: nonNegativeInteger.default(0),
  priorPaidNetPayKrw: nonNegativeInteger.default(0)
});

const payrollYearSchema = z.number().int().min(2020).max(2100);
const yearEndTaxCreditsSchema = z.object({
  earnedIncomeTaxCreditKrw: nonNegativeInteger.default(0),
  childTaxCreditKrw: nonNegativeInteger.default(0),
  additionalTaxCreditKrw: nonNegativeInteger.default(0)
});
const yearEndDeductionItemsSchema = z.object({
  personalPensionKrw: nonNegativeInteger.default(0),
  insurancePremiumKrw: nonNegativeInteger.default(0),
  medicalExpenseKrw: nonNegativeInteger.default(0),
  educationExpenseKrw: nonNegativeInteger.default(0),
  donationKrw: nonNegativeInteger.default(0),
  housingSavingsKrw: nonNegativeInteger.default(0)
});
const yearEndDeductionEligibilitySchema = z.object({
  personalPensionEligible: z.boolean().default(true),
  insurancePremiumEligible: z.boolean().default(true),
  medicalExpenseEligible: z.boolean().default(true),
  educationExpenseEligible: z.boolean().default(true),
  donationEligible: z.boolean().default(true),
  housingSavingsEligible: z.boolean().default(true)
});
const yearEndSettlementHashSchema = z.string().regex(/^[a-f0-9]{64}$/i);
const defaultYearEndDeductionItems = {
  personalPensionKrw: 0,
  insurancePremiumKrw: 0,
  medicalExpenseKrw: 0,
  educationExpenseKrw: 0,
  donationKrw: 0,
  housingSavingsKrw: 0
};
const defaultYearEndDeductionEligibility = {
  personalPensionEligible: true,
  insurancePremiumEligible: true,
  medicalExpenseEligible: true,
  educationExpenseEligible: true,
  donationEligible: true,
  housingSavingsEligible: true
};

export const closePayrollPeriodSchema = z.object({
  periodStart: isoDateTime,
  periodEnd: isoDateTime,
  apply: z.boolean().default(false),
  settlement: closePayrollPeriodSettlementSchema.optional()
});

export const distributePayrollPayslipsSchema = z.object({
  periodStart: isoDateTime,
  periodEnd: isoDateTime,
  employeeId: z.string().min(1).optional(),
  deliveryChannel: z.enum(["in_app", "email"]).default("in_app"),
  dryRun: z.boolean().default(true)
});

export const previewPayrollYearEndSettlementSchema = z.object({
  year: payrollYearSchema,
  employeeId: z.string().min(1),
  nonTaxableAnnualIncomeKrw: nonNegativeInteger.default(0),
  additionalTaxCreditKrw: nonNegativeInteger.default(0),
  taxCredits: yearEndTaxCreditsSchema.optional(),
  annualIncomeTaxRate: rate.default(0.03),
  localIncomeTaxRate: rate.default(0.1)
});

export const recalculatePayrollYearEndSettlementSchema = previewPayrollYearEndSettlementSchema.extend({
  deductionItems: yearEndDeductionItemsSchema.default(defaultYearEndDeductionItems),
  deductionEligibility: yearEndDeductionEligibilitySchema.default(defaultYearEndDeductionEligibility)
});

export const finalizePayrollYearEndSettlementSchema = previewPayrollYearEndSettlementSchema.extend({
  deductionItems: yearEndDeductionItemsSchema.default(defaultYearEndDeductionItems),
  deductionEligibility: yearEndDeductionEligibilitySchema.default(defaultYearEndDeductionEligibility),
  apply: z.boolean().default(false),
  finalizedByNote: z.string().min(1).max(120).optional(),
  expectedSettlementHash: yearEndSettlementHashSchema.optional()
});

export const exportPayrollYearEndFilingDataSchema = z.object({
  year: payrollYearSchema,
  employeeId: z.string().min(1),
  format: z.enum(["json", "csv", "jsonl", "hometax_csv"]).default("json"),
  validationMode: z.enum(["basic", "strict"]).default("basic"),
  expectedSettlementHash: yearEndSettlementHashSchema.optional()
});

export const submitPayrollYearEndFilingPackageSchema = exportPayrollYearEndFilingDataSchema.extend({
  transport: z.enum(["manual_portal", "hometax_upload", "nts_api_mock"]).default("manual_portal"),
  submissionNote: z.string().min(1).max(240).optional()
});

export const acknowledgePayrollYearEndFilingPackageSchema = z.object({
  year: payrollYearSchema,
  employeeId: z.string().min(1),
  submissionId: z.string().min(1),
  ackStatus: z.enum(["accepted", "rejected"]),
  ackCode: z.string().min(1).max(80).optional(),
  ackNote: z.string().min(1).max(240).optional(),
  rejectionReasonCode: z.string().min(1).max(80).optional(),
  rejectionReasonDetail: z.string().min(1).max(240).optional()
});

export const resubmitPayrollYearEndFilingPackageSchema = submitPayrollYearEndFilingPackageSchema.extend({
  submissionId: z.string().min(1),
  resubmissionReason: z.string().min(1).max(240).optional()
});

export const cancelPayrollYearEndFilingPackageSchema = z.object({
  year: payrollYearSchema,
  employeeId: z.string().min(1),
  submissionId: z.string().min(1)
});

export const reopenPayrollYearEndFilingPackageSchema = z.object({
  year: payrollYearSchema,
  employeeId: z.string().min(1),
  submissionId: z.string().min(1)
});

export const listPayrollYearEndFilingSubmissionsQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  employeeId: z.string().min(1),
  status: z.enum(["submitted", "acknowledged", "canceled", "all"]).optional(),
  ackStatus: z.enum(["accepted", "rejected", "none", "all"]).optional(),
  validationStatus: z.enum(["pass", "fail", "all"]).optional(),
  transport: z
    .enum(["manual_portal", "hometax_upload", "nts_api_mock", "all"])
    .optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sortBy: z
    .enum(["submittedAt", "attempt", "status", "ackStatus", "validationStatus", "transport"])
    .optional(),
  sortDirection: z.enum(["asc", "desc"]).optional()
});

export const listPayrollYearEndFilingSubmissionTimelineQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  employeeId: z.string().min(1),
  submissionId: z.string().min(1)
});

export const addPayrollYearEndFilingEvidenceNoteSchema = z.object({
  year: payrollYearSchema,
  employeeId: z.string().min(1),
  submissionId: z.string().min(1),
  note: z.string().min(1).max(500)
});

export const issuePayrollYearEndWithholdingReceiptSchema = z.object({
  year: payrollYearSchema,
  employeeId: z.string().min(1),
  issue: z.boolean().default(false),
  issuerName: z.string().min(1).max(120).optional()
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
