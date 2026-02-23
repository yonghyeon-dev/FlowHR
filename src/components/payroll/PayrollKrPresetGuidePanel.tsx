"use client";

import { listPayrollKrIncomeTaxLookupPresets } from "@/features/payroll/kr-income-tax-lookup-presets";
import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";

type PayrollKrPresetGuidePanelProps = {
  selectedPresetId: string;
  onPresetChange: (nextPresetId: string) => void;
  presetAutoEnabled: boolean;
  onPresetAutoEnabledChange: (enabled: boolean) => void;
  presetAsOfInput: string;
  onPresetAsOfInputChange: (nextValue: string) => void;
};

type PresetGuideCopy = {
  modeLabel: string;
  modeManual: string;
  modeAuto: string;
  presetLabel: string;
  noneOption: string;
  asOfLabel: string;
  asOfHint: string;
  payloadGuideManual: string;
  payloadGuideAuto: string;
  conflictGuide: string;
  selectedPrefix: string;
  sourceLabel: string;
  effectiveFromLabel: string;
  notSelected: string;
  autoSummaryPrefix: string;
  autoDefaultAsOf: string;
};

const presetGuideCopy: Record<FlowLocale, PresetGuideCopy> = {
  ko: {
    modeLabel: "세액표 선택 방식",
    modeManual: "수동 프리셋 선택",
    modeAuto: "기준일 자동 선택",
    presetLabel: "수동 프리셋",
    noneOption: "프리셋 미사용(기본 비율 계산)",
    asOfLabel: "자동 선택 기준 시각(선택)",
    asOfHint: "비워두면 급여 기간 종료시각(periodEnd)을 기준으로 자동 선택합니다.",
    payloadGuideManual:
      "수동 모드에서는 incomeTaxLookupPresetId를 전송하고 서버가 해당 관리형 세액표를 적용합니다.",
    payloadGuideAuto:
      "자동 모드에서는 incomeTaxLookupPresetAuto=true를 전송하고 기준일에 맞는 최신 프리셋을 서버가 선택합니다.",
    conflictGuide:
      "가드 규칙: incomeTaxBrackets, incomeTaxLookupTable, incomeTaxLookupPresetId, incomeTaxLookupPresetAuto는 동시에 사용할 수 없습니다.",
    selectedPrefix: "선택된 프리셋",
    sourceLabel: "출처",
    effectiveFromLabel: "적용 시작일",
    notSelected: "현재 수동 프리셋이 선택되지 않았습니다.",
    autoSummaryPrefix: "자동 선택 기준",
    autoDefaultAsOf: "periodEnd 기준"
  },
  en: {
    modeLabel: "Tax lookup mode",
    modeManual: "Manual preset",
    modeAuto: "Auto by reference date",
    presetLabel: "Manual preset",
    noneOption: "Do not use preset (default rates)",
    asOfLabel: "Auto reference datetime (optional)",
    asOfHint: "If empty, auto selection falls back to payroll periodEnd.",
    payloadGuideManual:
      "Manual mode sends incomeTaxLookupPresetId so the server applies the managed lookup preset.",
    payloadGuideAuto:
      "Auto mode sends incomeTaxLookupPresetAuto=true and the server resolves the latest eligible preset by reference date.",
    conflictGuide:
      "Guard rule: incomeTaxBrackets, incomeTaxLookupTable, incomeTaxLookupPresetId, and incomeTaxLookupPresetAuto are mutually exclusive.",
    selectedPrefix: "Selected preset",
    sourceLabel: "source",
    effectiveFromLabel: "effective from",
    notSelected: "No manual preset is currently selected.",
    autoSummaryPrefix: "Auto reference",
    autoDefaultAsOf: "periodEnd fallback"
  }
};

const lookupPresets = listPayrollKrIncomeTaxLookupPresets();

export function PayrollKrPresetGuidePanel({
  selectedPresetId,
  onPresetChange,
  presetAutoEnabled,
  onPresetAutoEnabledChange,
  presetAsOfInput,
  onPresetAsOfInputChange
}: PayrollKrPresetGuidePanelProps) {
  const { locale } = useI18n();
  const copy = presetGuideCopy[locale];
  const selectedPreset =
    lookupPresets.find((preset) => preset.id === selectedPresetId.trim()) ?? null;

  return (
    <div>
      <label>
        {copy.modeLabel}
        <select
          value={presetAutoEnabled ? "auto" : "manual"}
          onChange={(event) => onPresetAutoEnabledChange(event.target.value === "auto")}
        >
          <option value="manual">{copy.modeManual}</option>
          <option value="auto">{copy.modeAuto}</option>
        </select>
      </label>

      {presetAutoEnabled ? (
        <>
          <label>
            {copy.asOfLabel}
            <input
              type="datetime-local"
              value={presetAsOfInput}
              onChange={(event) => onPresetAsOfInputChange(event.target.value)}
            />
          </label>
          <p className="small">{copy.payloadGuideAuto}</p>
          <p className="small">
            {copy.autoSummaryPrefix}:{" "}
            <strong>{presetAsOfInput.trim().length > 0 ? presetAsOfInput : copy.autoDefaultAsOf}</strong>
          </p>
          <p className="small muted">{copy.asOfHint}</p>
        </>
      ) : (
        <>
          <label>
            {copy.presetLabel}
            <select value={selectedPresetId} onChange={(event) => onPresetChange(event.target.value)}>
              <option value="">{copy.noneOption}</option>
              {lookupPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} / {preset.effectiveFrom}
                </option>
              ))}
            </select>
          </label>
          <p className="small">{copy.payloadGuideManual}</p>
          {selectedPreset ? (
            <p className="small">
              {copy.selectedPrefix}: <strong>{selectedPreset.id}</strong> / {copy.effectiveFromLabel}:{" "}
              {selectedPreset.effectiveFrom} / {copy.sourceLabel}: {selectedPreset.source}
            </p>
          ) : (
            <p className="small muted">{copy.notSelected}</p>
          )}
        </>
      )}

      <p className="small muted">{copy.conflictGuide}</p>
    </div>
  );
}
