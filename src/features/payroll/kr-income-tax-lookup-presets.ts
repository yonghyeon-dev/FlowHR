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
  }
];

export function getPayrollKrIncomeTaxLookupPreset(presetId: string) {
  return payrollKrIncomeTaxLookupPresets.find((preset) => preset.id === presetId) ?? null;
}

export function listPayrollKrIncomeTaxLookupPresets() {
  return payrollKrIncomeTaxLookupPresets.slice();
}
