import { findPayrollKrIncomeSplitItemCodeDictionaryEntry } from "@/features/payroll/kr-income-split-item-code-dictionary";
import { ServiceError } from "@/features/shared/service-error";

export type IncomeTaxBracketInput = {
  upToKrw: number | null;
  rate: number;
};

export type IncomeTaxLookupRowInput = {
  upToKrw: number | null;
  taxKrw: number;
  dependentTaxKrw?: Array<{
    dependentCount: number;
    taxKrw: number;
  }>;
};

export type StatutoryIncomeSplitItemInput = {
  code: string;
  category: string;
  amountKrw: number;
};

export type InsuranceRoundingModeInput = "round" | "floor" | "ceil";

export type InsuranceRoundingInputShape = {
  mode?: InsuranceRoundingModeInput;
  nationalPensionUnitKrw?: number;
  healthInsuranceUnitKrw?: number;
  longTermCareUnitKrw?: number;
  employmentInsuranceUnitKrw?: number;
};

export type InsuranceSettlementRoundingInputShape = InsuranceRoundingInputShape & {
  industrialAccidentUnitKrw?: number;
};

export type InsuranceRoundingRulesResult = {
  mode: InsuranceRoundingModeInput;
  nationalPensionUnitKrw: number;
  healthInsuranceUnitKrw: number;
  longTermCareUnitKrw: number;
  employmentInsuranceUnitKrw: number;
};

export type InsuranceSettlementRoundingRulesResult = InsuranceRoundingRulesResult & {
  industrialAccidentUnitKrw: number;
};

export type LookupIncomeTaxResolutionResult = {
  taxKrw: number;
  selectedIncomeTaxLookupRow: {
    upToKrw: number | null;
    taxKrw: number;
  };
  selectedIncomeTaxLookupDependentTier: {
    dependentCount: number;
    taxKrw: number;
  } | null;
};

function toPositiveKrwUnit(value: number | undefined, fieldName: string) {
  if (value === undefined) {
    return 1;
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw new ServiceError(400, `${fieldName} must be a positive integer`);
  }
  return value;
}

export function normalizeIncomeTaxBrackets(
  brackets: IncomeTaxBracketInput[] | undefined,
  toRateNumber: (value: number | null, fieldName: string) => number | null,
  toKrwInteger: (value: number, fieldName: string) => number
) {
  if (!brackets || brackets.length === 0) {
    return null;
  }

  const normalized: IncomeTaxBracketInput[] = [];
  let lastFiniteUpper = -1;
  let hasOpenEnded = false;
  for (const [index, bracket] of brackets.entries()) {
    const rate = toRateNumber(bracket.rate, `statutory.incomeTaxBrackets[${index}].rate`) ?? 0;
    if (bracket.upToKrw === null) {
      if (index !== brackets.length - 1) {
        throw new ServiceError(
          400,
          "statutory.incomeTaxBrackets open-ended bracket(upToKrw=null) must be last"
        );
      }
      hasOpenEnded = true;
      normalized.push({ upToKrw: null, rate });
      continue;
    }

    const upToKrw = toKrwInteger(
      bracket.upToKrw,
      `statutory.incomeTaxBrackets[${index}].upToKrw`
    );
    if (upToKrw <= lastFiniteUpper) {
      throw new ServiceError(400, "statutory.incomeTaxBrackets upToKrw must be strictly increasing");
    }
    lastFiniteUpper = upToKrw;
    normalized.push({ upToKrw, rate });
  }

  if (!hasOpenEnded) {
    throw new ServiceError(
      400,
      "statutory.incomeTaxBrackets must include open-ended bracket(upToKrw=null) as last entry"
    );
  }

  return normalized;
}

export function normalizeIncomeTaxLookupTable(
  lookupTable: IncomeTaxLookupRowInput[] | undefined,
  toKrwInteger: (value: number, fieldName: string) => number
) {
  if (!lookupTable || lookupTable.length === 0) {
    return null;
  }

  const normalized: IncomeTaxLookupRowInput[] = [];
  let lastFiniteUpper = -1;
  let lastTaxKrw = -1;
  let hasOpenEnded = false;
  for (const [index, row] of lookupTable.entries()) {
    const taxKrw = toKrwInteger(row.taxKrw, `statutory.incomeTaxLookupTable[${index}].taxKrw`);
    if (taxKrw < lastTaxKrw) {
      throw new ServiceError(400, "statutory.incomeTaxLookupTable taxKrw must be non-decreasing");
    }
    lastTaxKrw = taxKrw;
    const dependentTaxKrw = row.dependentTaxKrw?.map((tier, tierIndex) => ({
      dependentCount: toKrwInteger(
        tier.dependentCount,
        `statutory.incomeTaxLookupTable[${index}].dependentTaxKrw[${tierIndex}].dependentCount`
      ),
      taxKrw: toKrwInteger(
        tier.taxKrw,
        `statutory.incomeTaxLookupTable[${index}].dependentTaxKrw[${tierIndex}].taxKrw`
      )
    }));

    if (dependentTaxKrw && dependentTaxKrw.length > 0) {
      if (dependentTaxKrw[0]?.dependentCount !== 0) {
        throw new ServiceError(
          400,
          "statutory.incomeTaxLookupTable dependentTaxKrw must start at dependentCount=0"
        );
      }
      let lastDependentCount = -1;
      let lastDependentTaxKrw = Number.POSITIVE_INFINITY;
      for (const tier of dependentTaxKrw) {
        if (tier.dependentCount <= lastDependentCount) {
          throw new ServiceError(
            400,
            "statutory.incomeTaxLookupTable dependentTaxKrw dependentCount must be strictly increasing"
          );
        }
        if (tier.taxKrw > lastDependentTaxKrw) {
          throw new ServiceError(
            400,
            "statutory.incomeTaxLookupTable dependentTaxKrw taxKrw must be non-increasing"
          );
        }
        lastDependentCount = tier.dependentCount;
        lastDependentTaxKrw = tier.taxKrw;
      }
    }

    if (row.upToKrw === null) {
      if (index !== lookupTable.length - 1) {
        throw new ServiceError(
          400,
          "statutory.incomeTaxLookupTable open-ended row(upToKrw=null) must be last"
        );
      }
      hasOpenEnded = true;
      normalized.push({
        upToKrw: null,
        taxKrw,
        dependentTaxKrw: dependentTaxKrw && dependentTaxKrw.length > 0 ? dependentTaxKrw : undefined
      });
      continue;
    }

    const upToKrw = toKrwInteger(row.upToKrw, `statutory.incomeTaxLookupTable[${index}].upToKrw`);
    if (upToKrw <= lastFiniteUpper) {
      throw new ServiceError(400, "statutory.incomeTaxLookupTable upToKrw must be strictly increasing");
    }
    lastFiniteUpper = upToKrw;
    normalized.push({
      upToKrw,
      taxKrw,
      dependentTaxKrw: dependentTaxKrw && dependentTaxKrw.length > 0 ? dependentTaxKrw : undefined
    });
  }

  if (!hasOpenEnded) {
    throw new ServiceError(
      400,
      "statutory.incomeTaxLookupTable must include open-ended row(upToKrw=null) as last entry"
    );
  }

  return normalized;
}

export function normalizeStatutoryIncomeSplitItems(
  items: StatutoryIncomeSplitItemInput[] | undefined,
  fieldName: "statutory.taxableIncomeItems" | "statutory.nonTaxableIncomeItems",
  toKrwInteger: (value: number, fieldName: string) => number
) {
  if (!items || items.length === 0) {
    return null;
  }

  const normalized: StatutoryIncomeSplitItemInput[] = [];
  const seenCodes = new Set<string>();
  const dictionaryKind = fieldName === "statutory.taxableIncomeItems" ? "taxable" : "non_taxable";
  for (const [index, item] of items.entries()) {
    const code = item.code.trim();
    const category = item.category.trim();
    const amountKrw = toKrwInteger(item.amountKrw, `${fieldName}[${index}].amountKrw`);
    if (!code) {
      throw new ServiceError(400, `${fieldName}[${index}].code must not be blank`);
    }
    if (!category) {
      throw new ServiceError(400, `${fieldName}[${index}].category must not be blank`);
    }
    const normalizedCode = code.toLowerCase();
    if (seenCodes.has(normalizedCode)) {
      throw new ServiceError(400, `${fieldName} contains duplicate code: ${code}`);
    }
    const dictionaryEntry = findPayrollKrIncomeSplitItemCodeDictionaryEntry(code, dictionaryKind);
    if (!dictionaryEntry) {
      throw new ServiceError(400, `${fieldName}[${index}].code is not supported by dictionary: ${code}`);
    }
    if (category.toLowerCase() !== dictionaryEntry.category.toLowerCase()) {
      throw new ServiceError(
        400,
        `${fieldName}[${index}].category must match dictionary category(${dictionaryEntry.category}) for code ${dictionaryEntry.code}`
      );
    }
    seenCodes.add(normalizedCode);
    normalized.push({
      code: dictionaryEntry.code,
      category: dictionaryEntry.category,
      amountKrw
    });
  }

  return normalized;
}

export function calculateProgressiveIncomeTaxKrw(
  taxableBaseKrw: number,
  brackets: IncomeTaxBracketInput[],
  toKrwInteger: (value: number, fieldName: string) => number
) {
  let tax = 0;
  let lowerBound = 0;
  for (const bracket of brackets) {
    if (taxableBaseKrw <= lowerBound) {
      break;
    }
    const upperBound = bracket.upToKrw === null ? Number.POSITIVE_INFINITY : bracket.upToKrw;
    const segment = Math.min(taxableBaseKrw, upperBound) - lowerBound;
    if (segment > 0) {
      tax += segment * bracket.rate;
    }
    lowerBound = upperBound;
  }
  return toKrwInteger(Math.round(tax), "statutory.incomeTaxKrw");
}

export function calculateLookupIncomeTaxKrw(
  taxableBaseKrw: number,
  dependentCount: number,
  lookupTable: IncomeTaxLookupRowInput[]
): LookupIncomeTaxResolutionResult {
  for (const row of lookupTable) {
    if (row.upToKrw === null || taxableBaseKrw <= row.upToKrw) {
      if (!row.dependentTaxKrw || row.dependentTaxKrw.length === 0) {
        return {
          taxKrw: row.taxKrw,
          selectedIncomeTaxLookupRow: {
            upToKrw: row.upToKrw,
            taxKrw: row.taxKrw
          },
          selectedIncomeTaxLookupDependentTier: null
        };
      }

      let selectedTier = row.dependentTaxKrw[0];
      for (const tier of row.dependentTaxKrw) {
        if (tier.dependentCount <= dependentCount) {
          selectedTier = tier;
          continue;
        }
        break;
      }
      return {
        taxKrw: selectedTier.taxKrw,
        selectedIncomeTaxLookupRow: {
          upToKrw: row.upToKrw,
          taxKrw: row.taxKrw
        },
        selectedIncomeTaxLookupDependentTier: {
          dependentCount: selectedTier.dependentCount,
          taxKrw: selectedTier.taxKrw
        }
      };
    }
  }

  throw new ServiceError(400, "statutory.incomeTaxLookupTable does not include an applicable row");
}

export function applyContributionCap(
  baseKrw: number,
  capKrw: number | undefined,
  fieldName: string,
  toKrwInteger: (value: number, fieldName: string) => number
) {
  if (capKrw === undefined) {
    return baseKrw;
  }
  const normalizedCap = toKrwInteger(capKrw, fieldName);
  return Math.min(baseKrw, normalizedCap);
}

export function normalizeInsuranceRoundingRules(
  rules: InsuranceRoundingInputShape | undefined,
  fieldPrefix = "statutory.insuranceRounding"
): InsuranceRoundingRulesResult {
  return {
    mode: rules?.mode ?? "round",
    nationalPensionUnitKrw: toPositiveKrwUnit(
      rules?.nationalPensionUnitKrw,
      `${fieldPrefix}.nationalPensionUnitKrw`
    ),
    healthInsuranceUnitKrw: toPositiveKrwUnit(
      rules?.healthInsuranceUnitKrw,
      `${fieldPrefix}.healthInsuranceUnitKrw`
    ),
    longTermCareUnitKrw: toPositiveKrwUnit(
      rules?.longTermCareUnitKrw,
      `${fieldPrefix}.longTermCareUnitKrw`
    ),
    employmentInsuranceUnitKrw: toPositiveKrwUnit(
      rules?.employmentInsuranceUnitKrw,
      `${fieldPrefix}.employmentInsuranceUnitKrw`
    )
  };
}

export function normalizeSettlementInsuranceRoundingRules(
  rules: InsuranceSettlementRoundingInputShape | undefined
): InsuranceSettlementRoundingRulesResult {
  const normalized = normalizeInsuranceRoundingRules(rules, "settlement.insuranceRounding");
  return {
    ...normalized,
    industrialAccidentUnitKrw: toPositiveKrwUnit(
      rules?.industrialAccidentUnitKrw,
      "settlement.insuranceRounding.industrialAccidentUnitKrw"
    )
  };
}

export function roundKrwByRule(
  rawValueKrw: number,
  fieldName: string,
  mode: InsuranceRoundingModeInput,
  unitKrw: number,
  toKrwInteger: (value: number, fieldName: string) => number
) {
  if (!Number.isFinite(rawValueKrw) || rawValueKrw < 0) {
    throw new ServiceError(400, `${fieldName} must be a non-negative finite number before rounding`);
  }
  const scaled = rawValueKrw / unitKrw;
  const roundedScaled =
    mode === "floor" ? Math.floor(scaled) : mode === "ceil" ? Math.ceil(scaled) : Math.round(scaled);
  return toKrwInteger(roundedScaled * unitKrw, fieldName);
}
