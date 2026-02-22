"use client";

import { listPayrollKrIncomeSplitItemPresets } from "@/features/payroll/kr-income-split-item-presets";
import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";

type PayrollKrIncomeSplitItemPresetFieldProps = {
  selectedPresetId: string;
  onPresetChange: (nextPresetId: string) => void;
};

type IncomeSplitItemPresetCopy = {
  label: string;
  noneOption: string;
  payloadGuide: string;
  conflictGuide: string;
  selectedPrefix: string;
  sourceLabel: string;
  taxableTemplateLabel: string;
  nonTaxableTemplateLabel: string;
  notSelected: string;
};

const incomeSplitItemPresetCopy: Record<FlowLocale, IncomeSplitItemPresetCopy> = {
  ko: {
    label: "항목 프리셋",
    noneOption: "사용 안 함(수동 항목 입력)",
    payloadGuide:
      "프리셋을 선택하면 incomeSplitItemPresetId가 전달되고, 서버가 과세/비과세 항목 코드/카테고리를 자동 구성합니다.",
    conflictGuide:
      "가드 규칙: incomeSplitItemPresetId와 taxableIncomeItems/nonTaxableIncomeItems는 동시에 사용할 수 없습니다.",
    selectedPrefix: "선택 프리셋",
    sourceLabel: "출처",
    taxableTemplateLabel: "과세 템플릿",
    nonTaxableTemplateLabel: "비과세 템플릿",
    notSelected: "현재 항목 프리셋을 사용하지 않습니다."
  },
  en: {
    label: "Income split item preset",
    noneOption: "Do not use preset (manual item input)",
    payloadGuide:
      "When selected, incomeSplitItemPresetId is sent and server-side taxable/non-taxable item code/category templates are applied.",
    conflictGuide:
      "Guard rule: incomeSplitItemPresetId cannot be combined with taxableIncomeItems/nonTaxableIncomeItems.",
    selectedPrefix: "Selected preset",
    sourceLabel: "source",
    taxableTemplateLabel: "Taxable template",
    nonTaxableTemplateLabel: "Non-taxable template",
    notSelected: "No income split item preset is selected."
  }
};

const incomeSplitItemPresets = listPayrollKrIncomeSplitItemPresets();

export function PayrollKrIncomeSplitItemPresetField({
  selectedPresetId,
  onPresetChange
}: PayrollKrIncomeSplitItemPresetFieldProps) {
  const { locale } = useI18n();
  const copy = incomeSplitItemPresetCopy[locale];
  const selectedPreset =
    incomeSplitItemPresets.find((preset) => preset.id === selectedPresetId.trim()) ?? null;

  return (
    <div>
      <label>
        {copy.label}
        <select value={selectedPresetId} onChange={(event) => onPresetChange(event.target.value)}>
          <option value="">{copy.noneOption}</option>
          {incomeSplitItemPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label} / {preset.effectiveFrom}
            </option>
          ))}
        </select>
      </label>
      <p className="small">{copy.payloadGuide}</p>
      <p className="small muted">{copy.conflictGuide}</p>
      {selectedPreset ? (
        <p className="small">
          {copy.selectedPrefix}: <strong>{selectedPreset.id}</strong> / {copy.sourceLabel}:{" "}
          {selectedPreset.source} / {copy.taxableTemplateLabel}: {selectedPreset.taxableTemplate.code}
          ({selectedPreset.taxableTemplate.category}) / {copy.nonTaxableTemplateLabel}:{" "}
          {selectedPreset.nonTaxableTemplate.code}({selectedPreset.nonTaxableTemplate.category})
        </p>
      ) : (
        <p className="small muted">{copy.notSelected}</p>
      )}
    </div>
  );
}
