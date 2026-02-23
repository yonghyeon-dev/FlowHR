import { getPayrollKrIncomeSplitItemPreset } from "@/features/payroll/kr-income-split-item-presets";

const NON_NEGATIVE_INTEGER_RE = /^\d+$/;

export type PayrollKrPresetShareContext = {
  presetId: string | null;
  taxableIncomeKrw: string | null;
  nonTaxableIncomeKrw: string | null;
};

function normalizeNonNegativeInteger(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (!NON_NEGATIVE_INTEGER_RE.test(trimmed)) {
    return null;
  }
  const normalized = trimmed.replace(/^0+/, "");
  return normalized.length > 0 ? normalized : "0";
}

export function parsePayrollKrPresetShareContext(search: string): PayrollKrPresetShareContext {
  const params = new URLSearchParams(search);
  const presetCandidate = (params.get("incomeSplitItemPresetId") ?? "").trim();
  const resolvedPreset = presetCandidate
    ? getPayrollKrIncomeSplitItemPreset(presetCandidate)?.id ?? null
    : null;

  return {
    presetId: resolvedPreset,
    taxableIncomeKrw: normalizeNonNegativeInteger(params.get("taxableIncomeKrw")),
    nonTaxableIncomeKrw: normalizeNonNegativeInteger(params.get("nonTaxableIncomeKrw"))
  };
}

export function hasPayrollKrPresetShareContext(context: PayrollKrPresetShareContext) {
  return Boolean(
    context.presetId || context.taxableIncomeKrw !== null || context.nonTaxableIncomeKrw !== null
  );
}
