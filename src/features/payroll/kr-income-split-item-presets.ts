export type PayrollKrIncomeSplitItemTemplate = {
  code: string;
  category: string;
};

export type PayrollKrIncomeSplitItemPreset = {
  id: string;
  label: string;
  effectiveFrom: string;
  source: string;
  taxableTemplate: PayrollKrIncomeSplitItemTemplate;
  nonTaxableTemplate: PayrollKrIncomeSplitItemTemplate;
};

const payrollKrIncomeSplitItemPresets: PayrollKrIncomeSplitItemPreset[] = [
  {
    id: "kr_income_split_template_v2026_01",
    label: "KR Income Split Template (2026-01)",
    effectiveFrom: "2026-01-01",
    source: "flowhr-curated-operations-dataset",
    taxableTemplate: {
      code: "TX_SALARY",
      category: "salary"
    },
    nonTaxableTemplate: {
      code: "NT_MEAL",
      category: "allowance"
    }
  }
];

export function getPayrollKrIncomeSplitItemPreset(presetId: string) {
  return payrollKrIncomeSplitItemPresets.find((preset) => preset.id === presetId) ?? null;
}

export function listPayrollKrIncomeSplitItemPresets() {
  return payrollKrIncomeSplitItemPresets.slice();
}
