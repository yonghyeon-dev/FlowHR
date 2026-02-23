import { getPayrollKrIncomeSplitItemPreset } from "@/features/payroll/kr-income-split-item-presets";

const NON_NEGATIVE_INTEGER_RE = /^\d+$/;

export type PayrollKrPresetShareContext = {
  presetId: string | null;
  taxableIncomeKrw: string | null;
  nonTaxableIncomeKrw: string | null;
};

export type PayrollKrPresetShareContextResolution = {
  context: PayrollKrPresetShareContext;
  query: PayrollKrPresetShareContext;
  invalid: PayrollKrPresetShareContext;
  hasAnyQuery: boolean;
};

function normalizeNonNegativeInteger(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!NON_NEGATIVE_INTEGER_RE.test(trimmed)) {
    return null;
  }
  const normalized = trimmed.replace(/^0+/, "");
  return normalized.length > 0 ? normalized : "0";
}

function normalizeOptionalQueryValue(value: string | null) {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolvePayrollKrPresetShareContext(search: string): PayrollKrPresetShareContextResolution {
  const params = new URLSearchParams(search);
  const query: PayrollKrPresetShareContext = {
    presetId: normalizeOptionalQueryValue(params.get("incomeSplitItemPresetId")),
    taxableIncomeKrw: normalizeOptionalQueryValue(params.get("taxableIncomeKrw")),
    nonTaxableIncomeKrw: normalizeOptionalQueryValue(params.get("nonTaxableIncomeKrw"))
  };

  const resolvedPreset = query.presetId
    ? getPayrollKrIncomeSplitItemPreset(query.presetId)?.id ?? null
    : null;
  const normalizedTaxableIncomeKrw = query.taxableIncomeKrw
    ? normalizeNonNegativeInteger(query.taxableIncomeKrw)
    : null;
  const normalizedNonTaxableIncomeKrw = query.nonTaxableIncomeKrw
    ? normalizeNonNegativeInteger(query.nonTaxableIncomeKrw)
    : null;

  const context: PayrollKrPresetShareContext = {
    presetId: resolvedPreset,
    taxableIncomeKrw: normalizedTaxableIncomeKrw,
    nonTaxableIncomeKrw: normalizedNonTaxableIncomeKrw
  };

  return {
    context,
    query,
    invalid: {
      presetId: query.presetId && !resolvedPreset ? query.presetId : null,
      taxableIncomeKrw:
        query.taxableIncomeKrw && normalizedTaxableIncomeKrw === null ? query.taxableIncomeKrw : null,
      nonTaxableIncomeKrw:
        query.nonTaxableIncomeKrw && normalizedNonTaxableIncomeKrw === null
          ? query.nonTaxableIncomeKrw
          : null
    },
    hasAnyQuery: Boolean(query.presetId || query.taxableIncomeKrw || query.nonTaxableIncomeKrw)
  };
}

export function parsePayrollKrPresetShareContext(search: string): PayrollKrPresetShareContext {
  return resolvePayrollKrPresetShareContext(search).context;
}

export function hasPayrollKrPresetShareContext(context: PayrollKrPresetShareContext) {
  return Boolean(
    context.presetId || context.taxableIncomeKrw !== null || context.nonTaxableIncomeKrw !== null
  );
}

export function hasPayrollKrPresetShareInvalidValues(
  resolution: PayrollKrPresetShareContextResolution
) {
  return Boolean(
    resolution.invalid.presetId ||
      resolution.invalid.taxableIncomeKrw ||
      resolution.invalid.nonTaxableIncomeKrw
  );
}
