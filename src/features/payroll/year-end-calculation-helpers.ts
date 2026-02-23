import { createHash } from "node:crypto";

type ToKrwInteger = (value: number, fieldName: string) => number;

type YearEndTaxCreditItemsInput = {
  earnedIncomeTaxCreditKrw: number;
  childTaxCreditKrw: number;
  additionalTaxCreditKrw: number;
};

type YearEndDeductionItemsInput = {
  personalPensionKrw: number;
  insurancePremiumKrw: number;
  medicalExpenseKrw: number;
  educationExpenseKrw: number;
  donationKrw: number;
  housingSavingsKrw: number;
};

type YearEndDeductionEligibilityInput = {
  personalPensionEligible: boolean;
  insurancePremiumEligible: boolean;
  medicalExpenseEligible: boolean;
  educationExpenseEligible: boolean;
  donationEligible: boolean;
  housingSavingsEligible: boolean;
};

type YearEndTaxCreditItemKey = keyof YearEndTaxCreditItemsInput;
type YearEndDeductionItemKey = keyof YearEndDeductionItemsInput;
type YearEndAppliedReasonCode = "NO_INPUT" | "CAPPED_BY_RULE" | "APPLIED_AS_ENTERED";

type YearEndTaxCreditItemCapRule = {
  capKrw: number;
};

type YearEndDeductionItemCapRule = {
  capKrw: number;
};

type YearEndTaxCreditCapRulesKrw = Record<YearEndTaxCreditItemKey, YearEndTaxCreditItemCapRule>;
type YearEndDeductionCapRulesKrw = Record<YearEndDeductionItemKey, YearEndDeductionItemCapRule>;

type YearEndTaxCreditCapAppliedItemKrw = {
  inputKrw: number;
  capKrw: number;
  appliedKrw: number;
  capped: boolean;
  applicationReasonCode: YearEndAppliedReasonCode;
  applicationReason: string;
};

type YearEndDeductionCapAppliedItemKrw = {
  inputKrw: number;
  capKrw: number;
  appliedKrw: number;
  capped: boolean;
  applicationReasonCode: YearEndAppliedReasonCode;
  applicationReason: string;
};

type YearEndTaxCreditCapAppliedBreakdownKrw = Record<
  YearEndTaxCreditItemKey,
  YearEndTaxCreditCapAppliedItemKrw
>;

type YearEndDeductionCapAppliedBreakdownKrw = Record<
  YearEndDeductionItemKey,
  YearEndDeductionCapAppliedItemKrw
>;

type PreviewPayrollYearEndSettlementInputShape = {
  year: number;
  employeeId: string;
  nonTaxableAnnualIncomeKrw: number;
  additionalTaxCreditKrw: number;
  taxCredits?: Partial<YearEndTaxCreditItemsInput>;
  annualIncomeTaxRate: number;
  localIncomeTaxRate: number;
};

const yearEndTaxCreditCapRulesKrw: YearEndTaxCreditCapRulesKrw = {
  earnedIncomeTaxCreditKrw: { capKrw: 740_000 },
  childTaxCreditKrw: { capKrw: 900_000 },
  additionalTaxCreditKrw: { capKrw: 1_000_000 }
};

const yearEndDeductionCapRulesKrw: YearEndDeductionCapRulesKrw = {
  personalPensionKrw: { capKrw: 7_000_000 },
  insurancePremiumKrw: { capKrw: 1_000_000 },
  medicalExpenseKrw: { capKrw: 15_000_000 },
  educationExpenseKrw: { capKrw: 9_000_000 },
  donationKrw: { capKrw: 10_000_000 },
  housingSavingsKrw: { capKrw: 4_000_000 }
};

export function normalizeYearEndDeductionItems(
  deductionItems: YearEndDeductionItemsInput,
  toKrwInteger: ToKrwInteger
): YearEndDeductionItemsInput {
  return {
    personalPensionKrw: toKrwInteger(
      deductionItems.personalPensionKrw,
      "deductionItems.personalPensionKrw"
    ),
    insurancePremiumKrw: toKrwInteger(
      deductionItems.insurancePremiumKrw,
      "deductionItems.insurancePremiumKrw"
    ),
    medicalExpenseKrw: toKrwInteger(deductionItems.medicalExpenseKrw, "deductionItems.medicalExpenseKrw"),
    educationExpenseKrw: toKrwInteger(
      deductionItems.educationExpenseKrw,
      "deductionItems.educationExpenseKrw"
    ),
    donationKrw: toKrwInteger(deductionItems.donationKrw, "deductionItems.donationKrw"),
    housingSavingsKrw: toKrwInteger(deductionItems.housingSavingsKrw, "deductionItems.housingSavingsKrw")
  };
}

export function normalizeYearEndDeductionEligibility(
  deductionEligibility?: Partial<YearEndDeductionEligibilityInput>
): YearEndDeductionEligibilityInput {
  return {
    personalPensionEligible: deductionEligibility?.personalPensionEligible ?? true,
    insurancePremiumEligible: deductionEligibility?.insurancePremiumEligible ?? true,
    medicalExpenseEligible: deductionEligibility?.medicalExpenseEligible ?? true,
    educationExpenseEligible: deductionEligibility?.educationExpenseEligible ?? true,
    donationEligible: deductionEligibility?.donationEligible ?? true,
    housingSavingsEligible: deductionEligibility?.housingSavingsEligible ?? true
  };
}

export function collectYearEndDeductionEligibilityBlockingReasons(
  deductionItems: YearEndDeductionItemsInput,
  deductionEligibility: YearEndDeductionEligibilityInput
) {
  const blockingReasons: string[] = [];
  if (deductionItems.personalPensionKrw > 0 && !deductionEligibility.personalPensionEligible) {
    blockingReasons.push("personalPensionKrw deduction is not eligible for selected employee/year");
  }
  if (deductionItems.insurancePremiumKrw > 0 && !deductionEligibility.insurancePremiumEligible) {
    blockingReasons.push("insurancePremiumKrw deduction is not eligible for selected employee/year");
  }
  if (deductionItems.medicalExpenseKrw > 0 && !deductionEligibility.medicalExpenseEligible) {
    blockingReasons.push("medicalExpenseKrw deduction is not eligible for selected employee/year");
  }
  if (deductionItems.educationExpenseKrw > 0 && !deductionEligibility.educationExpenseEligible) {
    blockingReasons.push("educationExpenseKrw deduction is not eligible for selected employee/year");
  }
  if (deductionItems.donationKrw > 0 && !deductionEligibility.donationEligible) {
    blockingReasons.push("donationKrw deduction is not eligible for selected employee/year");
  }
  if (deductionItems.housingSavingsKrw > 0 && !deductionEligibility.housingSavingsEligible) {
    blockingReasons.push("housingSavingsKrw deduction is not eligible for selected employee/year");
  }
  return blockingReasons;
}

export function getYearEndDeductionTotalKrw(deductionItems: YearEndDeductionItemsInput) {
  return (
    deductionItems.personalPensionKrw +
    deductionItems.insurancePremiumKrw +
    deductionItems.medicalExpenseKrw +
    deductionItems.educationExpenseKrw +
    deductionItems.donationKrw +
    deductionItems.housingSavingsKrw
  );
}

export function normalizeYearEndTaxCreditItems(
  input: PreviewPayrollYearEndSettlementInputShape,
  toKrwInteger: ToKrwInteger
): YearEndTaxCreditItemsInput {
  return {
    earnedIncomeTaxCreditKrw: toKrwInteger(
      input.taxCredits?.earnedIncomeTaxCreditKrw ?? 0,
      "taxCredits.earnedIncomeTaxCreditKrw"
    ),
    childTaxCreditKrw: toKrwInteger(
      input.taxCredits?.childTaxCreditKrw ?? 0,
      "taxCredits.childTaxCreditKrw"
    ),
    additionalTaxCreditKrw: toKrwInteger(
      input.taxCredits?.additionalTaxCreditKrw ?? input.additionalTaxCreditKrw,
      "taxCredits.additionalTaxCreditKrw"
    )
  };
}

export function buildYearEndInputVectorHash(input: {
  year: number;
  employeeId: string;
  nonTaxableAnnualIncomeKrw: number;
  annualIncomeTaxRate: number;
  localIncomeTaxRate: number;
  taxCredits: YearEndTaxCreditItemsInput;
  deductionItems: YearEndDeductionItemsInput | null;
  deductionEligibility: YearEndDeductionEligibilityInput | null;
}) {
  const normalizedPayload = {
    version: "v1",
    year: input.year,
    employeeId: input.employeeId,
    nonTaxableAnnualIncomeKrw: input.nonTaxableAnnualIncomeKrw,
    annualIncomeTaxRate: input.annualIncomeTaxRate,
    localIncomeTaxRate: input.localIncomeTaxRate,
    taxCredits: input.taxCredits,
    deductionItems: input.deductionItems,
    deductionEligibility: input.deductionEligibility
  };
  return createHash("sha256").update(JSON.stringify(normalizedPayload)).digest("hex");
}

function applyYearEndTaxCreditCapRule(
  inputKrw: number,
  rule: YearEndTaxCreditItemCapRule
): YearEndTaxCreditCapAppliedItemKrw {
  const appliedKrw = Math.min(inputKrw, rule.capKrw);
  let applicationReasonCode: YearEndAppliedReasonCode = "APPLIED_AS_ENTERED";
  let applicationReason = "input applied as entered";
  if (inputKrw === 0) {
    applicationReasonCode = "NO_INPUT";
    applicationReason = "input amount is zero";
  } else if (appliedKrw !== inputKrw) {
    applicationReasonCode = "CAPPED_BY_RULE";
    applicationReason = "input exceeds annual cap rule";
  }
  return {
    inputKrw,
    capKrw: rule.capKrw,
    appliedKrw,
    capped: appliedKrw !== inputKrw,
    applicationReasonCode,
    applicationReason
  };
}

export function applyYearEndTaxCreditCaps(
  taxCredits: YearEndTaxCreditItemsInput,
  toKrwInteger: ToKrwInteger
) {
  const capAppliedByItemKrw: YearEndTaxCreditCapAppliedBreakdownKrw = {
    earnedIncomeTaxCreditKrw: applyYearEndTaxCreditCapRule(
      taxCredits.earnedIncomeTaxCreditKrw,
      yearEndTaxCreditCapRulesKrw.earnedIncomeTaxCreditKrw
    ),
    childTaxCreditKrw: applyYearEndTaxCreditCapRule(
      taxCredits.childTaxCreditKrw,
      yearEndTaxCreditCapRulesKrw.childTaxCreditKrw
    ),
    additionalTaxCreditKrw: applyYearEndTaxCreditCapRule(
      taxCredits.additionalTaxCreditKrw,
      yearEndTaxCreditCapRulesKrw.additionalTaxCreditKrw
    )
  };
  const totalInputTaxCreditKrw = toKrwInteger(
    capAppliedByItemKrw.earnedIncomeTaxCreditKrw.inputKrw +
      capAppliedByItemKrw.childTaxCreditKrw.inputKrw +
      capAppliedByItemKrw.additionalTaxCreditKrw.inputKrw,
    "taxCredits.totalInputTaxCreditKrw"
  );
  const totalAppliedTaxCreditKrw = toKrwInteger(
    capAppliedByItemKrw.earnedIncomeTaxCreditKrw.appliedKrw +
      capAppliedByItemKrw.childTaxCreditKrw.appliedKrw +
      capAppliedByItemKrw.additionalTaxCreditKrw.appliedKrw,
    "taxCredits.totalAppliedTaxCreditKrw"
  );
  const capRulesKrw: YearEndTaxCreditItemsInput = {
    earnedIncomeTaxCreditKrw: yearEndTaxCreditCapRulesKrw.earnedIncomeTaxCreditKrw.capKrw,
    childTaxCreditKrw: yearEndTaxCreditCapRulesKrw.childTaxCreditKrw.capKrw,
    additionalTaxCreditKrw: yearEndTaxCreditCapRulesKrw.additionalTaxCreditKrw.capKrw
  };
  return {
    totalInputTaxCreditKrw,
    totalAppliedTaxCreditKrw,
    capRulesKrw,
    capAppliedByItemKrw
  };
}

function applyYearEndDeductionCapRule(
  inputKrw: number,
  rule: YearEndDeductionItemCapRule
): YearEndDeductionCapAppliedItemKrw {
  const appliedKrw = Math.min(inputKrw, rule.capKrw);
  let applicationReasonCode: YearEndAppliedReasonCode = "APPLIED_AS_ENTERED";
  let applicationReason = "input applied as entered";
  if (inputKrw === 0) {
    applicationReasonCode = "NO_INPUT";
    applicationReason = "input amount is zero";
  } else if (appliedKrw !== inputKrw) {
    applicationReasonCode = "CAPPED_BY_RULE";
    applicationReason = "input exceeds annual cap rule";
  }
  return {
    inputKrw,
    capKrw: rule.capKrw,
    appliedKrw,
    capped: appliedKrw !== inputKrw,
    applicationReasonCode,
    applicationReason
  };
}

export function applyYearEndDeductionCaps(
  deductionItems: YearEndDeductionItemsInput,
  toKrwInteger: ToKrwInteger
) {
  const capAppliedByItemKrw: YearEndDeductionCapAppliedBreakdownKrw = {
    personalPensionKrw: applyYearEndDeductionCapRule(
      deductionItems.personalPensionKrw,
      yearEndDeductionCapRulesKrw.personalPensionKrw
    ),
    insurancePremiumKrw: applyYearEndDeductionCapRule(
      deductionItems.insurancePremiumKrw,
      yearEndDeductionCapRulesKrw.insurancePremiumKrw
    ),
    medicalExpenseKrw: applyYearEndDeductionCapRule(
      deductionItems.medicalExpenseKrw,
      yearEndDeductionCapRulesKrw.medicalExpenseKrw
    ),
    educationExpenseKrw: applyYearEndDeductionCapRule(
      deductionItems.educationExpenseKrw,
      yearEndDeductionCapRulesKrw.educationExpenseKrw
    ),
    donationKrw: applyYearEndDeductionCapRule(
      deductionItems.donationKrw,
      yearEndDeductionCapRulesKrw.donationKrw
    ),
    housingSavingsKrw: applyYearEndDeductionCapRule(
      deductionItems.housingSavingsKrw,
      yearEndDeductionCapRulesKrw.housingSavingsKrw
    )
  };
  const totalIncomeDeductionKrw = getYearEndDeductionTotalKrw(deductionItems);
  const cappedIncomeDeductionKrw = toKrwInteger(
    capAppliedByItemKrw.personalPensionKrw.appliedKrw +
      capAppliedByItemKrw.insurancePremiumKrw.appliedKrw +
      capAppliedByItemKrw.medicalExpenseKrw.appliedKrw +
      capAppliedByItemKrw.educationExpenseKrw.appliedKrw +
      capAppliedByItemKrw.donationKrw.appliedKrw +
      capAppliedByItemKrw.housingSavingsKrw.appliedKrw,
    "deductionItems.cappedIncomeDeductionKrw"
  );
  const capRulesKrw: YearEndDeductionItemsInput = {
    personalPensionKrw: yearEndDeductionCapRulesKrw.personalPensionKrw.capKrw,
    insurancePremiumKrw: yearEndDeductionCapRulesKrw.insurancePremiumKrw.capKrw,
    medicalExpenseKrw: yearEndDeductionCapRulesKrw.medicalExpenseKrw.capKrw,
    educationExpenseKrw: yearEndDeductionCapRulesKrw.educationExpenseKrw.capKrw,
    donationKrw: yearEndDeductionCapRulesKrw.donationKrw.capKrw,
    housingSavingsKrw: yearEndDeductionCapRulesKrw.housingSavingsKrw.capKrw
  };
  return {
    totalIncomeDeductionKrw,
    cappedIncomeDeductionKrw,
    capRulesKrw,
    capAppliedByItemKrw
  };
}
