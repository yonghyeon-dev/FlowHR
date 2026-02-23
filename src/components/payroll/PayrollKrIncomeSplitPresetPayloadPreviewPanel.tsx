"use client";

import { useMemo } from "react";
import { getPayrollKrIncomeSplitItemPreset } from "@/features/payroll/kr-income-split-item-presets";
import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";

type PayrollKrIncomeSplitPresetPayloadPreviewPanelProps = {
  selectedPresetId: string;
  taxableIncomeKrw: string;
  nonTaxableIncomeKrw: string;
};

type PresetPayloadPreviewCopy = {
  title: string;
  notSelected: string;
  requestPreviewLabel: string;
  serverTemplateLabel: string;
  taxableAmountExplicit: string;
  taxableAmountDerived: string;
  nonTaxableOmittedWhenZero: string;
};

const presetPayloadPreviewCopy: Record<FlowLocale, PresetPayloadPreviewCopy> = {
  ko: {
    title: "프리셋 모드 샘플 payload 프리뷰",
    notSelected: "항목 프리셋이 선택되면 샘플 payload 프리뷰가 표시됩니다.",
    requestPreviewLabel: "요청 payload(샘플)",
    serverTemplateLabel: "서버 템플릿 적용 결과(샘플)",
    taxableAmountExplicit: "taxableIncomeKrw 명시값 사용",
    taxableAmountDerived: "grossPayKrw - nonTaxableIncomeKrw 로 서버에서 계산",
    nonTaxableOmittedWhenZero: "nonTaxableIncomeKrw=0일 때 비과세 템플릿 행은 생성되지 않음"
  },
  en: {
    title: "Preset mode sample payload preview",
    notSelected: "Sample payload preview appears when an item preset is selected.",
    requestPreviewLabel: "Request payload (sample)",
    serverTemplateLabel: "Server template application (sample)",
    taxableAmountExplicit: "Uses explicit taxableIncomeKrw value",
    taxableAmountDerived: "Computed on server as grossPayKrw - nonTaxableIncomeKrw",
    nonTaxableOmittedWhenZero:
      "When nonTaxableIncomeKrw=0, non-taxable template row is not generated"
  }
};

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.trunc(parsed));
}

export function PayrollKrIncomeSplitPresetPayloadPreviewPanel({
  selectedPresetId,
  taxableIncomeKrw,
  nonTaxableIncomeKrw
}: PayrollKrIncomeSplitPresetPayloadPreviewPanelProps) {
  const { locale } = useI18n();
  const copy = presetPayloadPreviewCopy[locale];
  const selectedPreset = getPayrollKrIncomeSplitItemPreset(selectedPresetId.trim());
  const parsedTaxableIncomeKrw = parseOptionalInteger(taxableIncomeKrw);
  const parsedNonTaxableIncomeKrw = parseOptionalInteger(nonTaxableIncomeKrw) ?? 0;

  const requestPayloadPreview = useMemo(() => {
    if (!selectedPreset) {
      return null;
    }
    return {
      deductionMode: "statutory_kr_baseline",
      statutory: {
        incomeSplitItemPresetId: selectedPreset.id,
        taxableIncomeKrw: parsedTaxableIncomeKrw ?? undefined,
        nonTaxableIncomeKrw: parsedNonTaxableIncomeKrw,
        taxableIncomeItems: "(omitted in preset mode)",
        nonTaxableIncomeItems: "(omitted in preset mode)"
      }
    };
  }, [selectedPreset, parsedTaxableIncomeKrw, parsedNonTaxableIncomeKrw]);

  const serverTemplatePreview = useMemo(() => {
    if (!selectedPreset) {
      return null;
    }
    return {
      taxableTemplate: {
        code: selectedPreset.taxableTemplate.code,
        category: selectedPreset.taxableTemplate.category,
        amountKrw:
          parsedTaxableIncomeKrw !== null ? copy.taxableAmountExplicit : copy.taxableAmountDerived
      },
      nonTaxableTemplate:
        parsedNonTaxableIncomeKrw > 0
          ? {
              code: selectedPreset.nonTaxableTemplate.code,
              category: selectedPreset.nonTaxableTemplate.category,
              amountKrw: parsedNonTaxableIncomeKrw
            }
          : copy.nonTaxableOmittedWhenZero
    };
  }, [selectedPreset, parsedTaxableIncomeKrw, parsedNonTaxableIncomeKrw, copy]);

  return (
    <div>
      <p className="small">
        <strong>{copy.title}</strong>
      </p>
      {!selectedPreset ? (
        <p className="small muted">{copy.notSelected}</p>
      ) : (
        <div className="input-grid compact">
          <div className="full">
            <p className="small">{copy.requestPreviewLabel}</p>
            <pre className="small">{JSON.stringify(requestPayloadPreview, null, 2)}</pre>
          </div>
          <div className="full">
            <p className="small">{copy.serverTemplateLabel}</p>
            <pre className="small">{JSON.stringify(serverTemplatePreview, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
