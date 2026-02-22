"use client";

import { listPayrollKrIncomeTaxLookupPresets } from "@/features/payroll/kr-income-tax-lookup-presets";
import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";

type PayrollKrPresetGuidePanelProps = {
  selectedPresetId: string;
  onPresetChange: (nextPresetId: string) => void;
};

type PresetGuideCopy = {
  label: string;
  noneOption: string;
  payloadGuide: string;
  conflictGuide: string;
  selectedPrefix: string;
  sourceLabel: string;
  notSelected: string;
};

const presetGuideCopy: Record<FlowLocale, PresetGuideCopy> = {
  ko: {
    label: "세액표 프리셋",
    noneOption: "사용 안 함(기본 비율 사용)",
    payloadGuide:
      "프리셋을 선택하면 incomeTaxLookupPresetId가 함께 전달되어 서버가 고정 룩업 테이블을 적용합니다.",
    conflictGuide:
      "가드 규칙: incomeTaxBrackets, incomeTaxLookupTable, incomeTaxLookupPresetId는 동시에 사용할 수 없습니다.",
    selectedPrefix: "선택 프리셋",
    sourceLabel: "출처",
    notSelected: "현재 프리셋을 사용하지 않습니다."
  },
  en: {
    label: "Income-tax preset",
    noneOption: "Do not use preset (default rates)",
    payloadGuide:
      "When selected, incomeTaxLookupPresetId is sent so the server applies the managed lookup table.",
    conflictGuide:
      "Guard rule: incomeTaxBrackets, incomeTaxLookupTable, and incomeTaxLookupPresetId are mutually exclusive.",
    selectedPrefix: "Selected preset",
    sourceLabel: "source",
    notSelected: "No preset is currently selected."
  }
};

const lookupPresets = listPayrollKrIncomeTaxLookupPresets();

export function PayrollKrPresetGuidePanel({
  selectedPresetId,
  onPresetChange
}: PayrollKrPresetGuidePanelProps) {
  const { locale } = useI18n();
  const copy = presetGuideCopy[locale];
  const selectedPreset =
    lookupPresets.find((preset) => preset.id === selectedPresetId.trim()) ?? null;

  return (
    <div>
      <label>
        {copy.label}
        <select value={selectedPresetId} onChange={(event) => onPresetChange(event.target.value)}>
          <option value="">{copy.noneOption}</option>
          {lookupPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label} / {preset.effectiveFrom}
            </option>
          ))}
        </select>
      </label>
      <p className="small">
        {copy.payloadGuide}
      </p>
      <p className="small muted">
        {copy.conflictGuide}
      </p>
      {selectedPreset ? (
        <p className="small">
          {copy.selectedPrefix}: <strong>{selectedPreset.id}</strong> / {copy.sourceLabel}:{" "}
          {selectedPreset.source}
        </p>
      ) : (
        <p className="small muted">{copy.notSelected}</p>
      )}
    </div>
  );
}
