export type PayrollKrIncomeTaxLookupPresetRow = {
  upToKrw: number | null;
  taxKrw: number;
  dependentTaxKrw?: Array<{
    dependentCount: number;
    taxKrw: number;
  }>;
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
      {
        upToKrw: 50000,
        taxKrw: 2500,
        dependentTaxKrw: [
          { dependentCount: 0, taxKrw: 2500 },
          { dependentCount: 1, taxKrw: 2500 },
          { dependentCount: 2, taxKrw: 2300 },
          { dependentCount: 3, taxKrw: 2100 }
        ]
      },
      {
        upToKrw: 100000,
        taxKrw: 7200,
        dependentTaxKrw: [
          { dependentCount: 0, taxKrw: 7200 },
          { dependentCount: 1, taxKrw: 7200 },
          { dependentCount: 2, taxKrw: 6800 },
          { dependentCount: 3, taxKrw: 6400 }
        ]
      },
      {
        upToKrw: 150000,
        taxKrw: 13500,
        dependentTaxKrw: [
          { dependentCount: 0, taxKrw: 13500 },
          { dependentCount: 1, taxKrw: 13500 },
          { dependentCount: 2, taxKrw: 12900 },
          { dependentCount: 3, taxKrw: 12300 }
        ]
      },
      {
        upToKrw: 200000,
        taxKrw: 21500,
        dependentTaxKrw: [
          { dependentCount: 0, taxKrw: 21500 },
          { dependentCount: 1, taxKrw: 21500 },
          { dependentCount: 2, taxKrw: 20700 },
          { dependentCount: 3, taxKrw: 19900 }
        ]
      },
      {
        upToKrw: null,
        taxKrw: 30000,
        dependentTaxKrw: [
          { dependentCount: 0, taxKrw: 30000 },
          { dependentCount: 1, taxKrw: 30000 },
          { dependentCount: 2, taxKrw: 29000 },
          { dependentCount: 3, taxKrw: 28000 }
        ]
      }
    ]
  },
  {
    id: "kr_simple_monthly_v2026_07",
    label: "KR Simple Monthly Lookup (2026-07)",
    effectiveFrom: "2026-07-01",
    source: "flowhr-curated-operations-dataset",
    rows: [
      {
        upToKrw: 50000,
        taxKrw: 2700,
        dependentTaxKrw: [
          { dependentCount: 0, taxKrw: 2700 },
          { dependentCount: 1, taxKrw: 2700 },
          { dependentCount: 2, taxKrw: 2500 },
          { dependentCount: 3, taxKrw: 2300 }
        ]
      },
      {
        upToKrw: 100000,
        taxKrw: 7600,
        dependentTaxKrw: [
          { dependentCount: 0, taxKrw: 7600 },
          { dependentCount: 1, taxKrw: 7600 },
          { dependentCount: 2, taxKrw: 7200 },
          { dependentCount: 3, taxKrw: 6800 }
        ]
      },
      {
        upToKrw: 150000,
        taxKrw: 14100,
        dependentTaxKrw: [
          { dependentCount: 0, taxKrw: 14100 },
          { dependentCount: 1, taxKrw: 14100 },
          { dependentCount: 2, taxKrw: 13500 },
          { dependentCount: 3, taxKrw: 12900 }
        ]
      },
      {
        upToKrw: 200000,
        taxKrw: 22300,
        dependentTaxKrw: [
          { dependentCount: 0, taxKrw: 22300 },
          { dependentCount: 1, taxKrw: 22300 },
          { dependentCount: 2, taxKrw: 21500 },
          { dependentCount: 3, taxKrw: 20700 }
        ]
      },
      {
        upToKrw: null,
        taxKrw: 31200,
        dependentTaxKrw: [
          { dependentCount: 0, taxKrw: 31200 },
          { dependentCount: 1, taxKrw: 31200 },
          { dependentCount: 2, taxKrw: 30200 },
          { dependentCount: 3, taxKrw: 29200 }
        ]
      }
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
