export type PayrollKrInsurancePolicyPresetRates = {
  nationalPensionEmployeeRate: number;
  nationalPensionEmployerRate: number;
  healthInsuranceEmployeeRate: number;
  healthInsuranceEmployerRate: number;
  longTermCareRateOnHealth: number;
  employmentInsuranceEmployeeRate: number;
  employmentInsuranceEmployerRate: number;
  industrialAccidentEmployerRate: number;
};

export type PayrollKrInsurancePolicyPresetCaps = {
  nationalPensionCapKrw: number | null;
  healthInsuranceCapKrw: number | null;
  employmentInsuranceCapKrw: number | null;
};

export type PayrollKrInsurancePolicyPreset = {
  id: string;
  label: string;
  effectiveFrom: string;
  source: string;
  rates: PayrollKrInsurancePolicyPresetRates;
  capsKrw: PayrollKrInsurancePolicyPresetCaps;
};

const payrollKrInsurancePolicyPresets: PayrollKrInsurancePolicyPreset[] = [
  {
    id: "kr_insurance_policy_v2026_01",
    label: "KR Insurance Policy (2026-01)",
    effectiveFrom: "2026-01-01",
    source: "flowhr-curated-operations-dataset",
    rates: {
      nationalPensionEmployeeRate: 0.045,
      nationalPensionEmployerRate: 0.045,
      healthInsuranceEmployeeRate: 0.03545,
      healthInsuranceEmployerRate: 0.03545,
      longTermCareRateOnHealth: 0.1295,
      employmentInsuranceEmployeeRate: 0.009,
      employmentInsuranceEmployerRate: 0.0115,
      industrialAccidentEmployerRate: 0.015
    },
    capsKrw: {
      nationalPensionCapKrw: null,
      healthInsuranceCapKrw: null,
      employmentInsuranceCapKrw: null
    }
  },
  {
    id: "kr_insurance_policy_v2026_07",
    label: "KR Insurance Policy (2026-07)",
    effectiveFrom: "2026-07-01",
    source: "flowhr-curated-operations-dataset",
    rates: {
      nationalPensionEmployeeRate: 0.045,
      nationalPensionEmployerRate: 0.045,
      healthInsuranceEmployeeRate: 0.0362,
      healthInsuranceEmployerRate: 0.0362,
      longTermCareRateOnHealth: 0.132,
      employmentInsuranceEmployeeRate: 0.0095,
      employmentInsuranceEmployerRate: 0.012,
      industrialAccidentEmployerRate: 0.0155
    },
    capsKrw: {
      nationalPensionCapKrw: 90000,
      healthInsuranceCapKrw: 80000,
      employmentInsuranceCapKrw: 75000
    }
  }
];

export function getPayrollKrInsurancePolicyPreset(presetId: string) {
  return payrollKrInsurancePolicyPresets.find((preset) => preset.id === presetId) ?? null;
}

export function listPayrollKrInsurancePolicyPresets() {
  return payrollKrInsurancePolicyPresets.slice();
}

function toEffectiveFromTimestamp(value: string): number {
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(timestamp)) {
    return Number.NEGATIVE_INFINITY;
  }
  return timestamp;
}

export function resolvePayrollKrInsurancePolicyPresetByAsOf(asOf: Date) {
  const asOfTimestamp = asOf.getTime();
  if (!Number.isFinite(asOfTimestamp)) {
    return null;
  }

  const sorted = payrollKrInsurancePolicyPresets
    .slice()
    .sort(
      (left, right) =>
        toEffectiveFromTimestamp(left.effectiveFrom) - toEffectiveFromTimestamp(right.effectiveFrom)
    );

  let selected: PayrollKrInsurancePolicyPreset | null = null;
  for (const preset of sorted) {
    if (toEffectiveFromTimestamp(preset.effectiveFrom) <= asOfTimestamp) {
      selected = preset;
      continue;
    }
    break;
  }

  return selected;
}
