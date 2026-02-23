export type PayrollKrIncomeTaxLookupPresetRow = {
  upToKrw: number | null;
  taxKrw: number;
};

export type PayrollKrIncomeTaxLookupPreset = {
  id: string;
  label: string;
  effectiveFrom: string;
  source: string;
  rows: PayrollKrIncomeTaxLookupPresetRow[];
};

const payrollKrIncomeTaxLookupPresets: PayrollKrIncomeTaxLookupPreset[] = [
  {
    id: "kr_simple_monthly_v2026_01",
    label: "KR Simple Monthly Lookup (2026-01)",
    effectiveFrom: "2026-01-01",
    source: "flowhr-curated-operations-dataset",
    rows: [
      { upToKrw: 50000, taxKrw: 2500 },
      { upToKrw: 100000, taxKrw: 7200 },
      { upToKrw: 150000, taxKrw: 13500 },
      { upToKrw: 200000, taxKrw: 21500 },
      { upToKrw: null, taxKrw: 30000 }
    ]
  },
  {
    id: "kr_simple_monthly_v2026_07",
    label: "KR Simple Monthly Lookup (2026-07)",
    effectiveFrom: "2026-07-01",
    source: "flowhr-curated-operations-dataset",
    rows: [
      { upToKrw: 50000, taxKrw: 2700 },
      { upToKrw: 100000, taxKrw: 7600 },
      { upToKrw: 150000, taxKrw: 14100 },
      { upToKrw: 200000, taxKrw: 22300 },
      { upToKrw: null, taxKrw: 31200 }
    ]
  }
];

export function getPayrollKrIncomeTaxLookupPreset(presetId: string) {
  return payrollKrIncomeTaxLookupPresets.find((preset) => preset.id === presetId) ?? null;
}

export function listPayrollKrIncomeTaxLookupPresets() {
  return payrollKrIncomeTaxLookupPresets.slice();
}

function toEffectiveFromTimestamp(value: string): number {
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(timestamp)) {
    return Number.NEGATIVE_INFINITY;
  }
  return timestamp;
}

export function resolvePayrollKrIncomeTaxLookupPresetByAsOf(asOf: Date) {
  const asOfTimestamp = asOf.getTime();
  if (!Number.isFinite(asOfTimestamp)) {
    return null;
  }

  const sorted = payrollKrIncomeTaxLookupPresets
    .slice()
    .sort(
      (left, right) =>
        toEffectiveFromTimestamp(left.effectiveFrom) - toEffectiveFromTimestamp(right.effectiveFrom)
    );

  let selected: PayrollKrIncomeTaxLookupPreset | null = null;
  for (const preset of sorted) {
    if (toEffectiveFromTimestamp(preset.effectiveFrom) <= asOfTimestamp) {
      selected = preset;
      continue;
    }
    break;
  }

  return selected;
}
