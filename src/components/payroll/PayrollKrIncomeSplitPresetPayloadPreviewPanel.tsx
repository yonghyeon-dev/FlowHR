"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  presetModeOmittedLabel: string;
  taxableAmountExplicit: string;
  taxableAmountDerived: string;
  nonTaxableOmittedWhenZero: string;
  copyRequestButton: string;
  copyTemplateButton: string;
  copyCombinedButton: string;
  shareButton: string;
  copySuccess: string;
  shareSuccess: string;
  shareFallbackCopySuccess: string;
  actionFailed: string;
  shareUnavailable: string;
  shareSummaryLabel: string;
};

const defaultCopy: PresetPayloadPreviewCopy = {
  title: "Preset mode sample payload preview",
  notSelected: "Sample payload preview appears when an item preset is selected.",
  requestPreviewLabel: "Request payload (sample)",
  serverTemplateLabel: "Server template application (sample)",
  presetModeOmittedLabel: "(omitted in preset mode)",
  taxableAmountExplicit: "Uses explicit taxableIncomeKrw value",
  taxableAmountDerived: "Computed on server as grossPayKrw - nonTaxableIncomeKrw",
  nonTaxableOmittedWhenZero: "When nonTaxableIncomeKrw=0, non-taxable template row is not generated",
  copyRequestButton: "Copy request payload",
  copyTemplateButton: "Copy template preview",
  copyCombinedButton: "Copy combined preview",
  shareButton: "Share preview",
  copySuccess: "Copied sample payload preview to clipboard.",
  shareSuccess: "Shared sample payload preview.",
  shareFallbackCopySuccess: "Share is unavailable, so preview content was copied to clipboard.",
  actionFailed: "Failed to copy/share sample payload preview.",
  shareUnavailable: "This browser does not support share or clipboard APIs.",
  shareSummaryLabel: "Preset preview"
};

const presetPayloadPreviewCopy: Record<FlowLocale, PresetPayloadPreviewCopy> = {
  ko: {
    title: "프리셋 모드 샘플 페이로드 미리보기",
    notSelected: "아이템 프리셋을 선택하면 샘플 페이로드 미리보기가 표시됩니다.",
    requestPreviewLabel: "요청 페이로드(샘플)",
    serverTemplateLabel: "서버 템플릿 적용 결과(샘플)",
    presetModeOmittedLabel: "(프리셋 모드에서는 생략)",
    taxableAmountExplicit: "taxableIncomeKrw 입력값을 그대로 사용",
    taxableAmountDerived: "서버에서 grossPayKrw - nonTaxableIncomeKrw로 계산",
    nonTaxableOmittedWhenZero: "nonTaxableIncomeKrw=0이면 비과세 템플릿 행을 생성하지 않음",
    copyRequestButton: "요청 페이로드 복사",
    copyTemplateButton: "템플릿 미리보기 복사",
    copyCombinedButton: "통합 미리보기 복사",
    shareButton: "미리보기 공유",
    copySuccess: "샘플 페이로드 미리보기를 클립보드에 복사했습니다.",
    shareSuccess: "샘플 페이로드 미리보기를 공유했습니다.",
    shareFallbackCopySuccess: "공유를 사용할 수 없어 미리보기 내용을 클립보드에 복사했습니다.",
    actionFailed: "샘플 페이로드 미리보기 복사 또는 공유에 실패했습니다.",
    shareUnavailable: "이 브라우저는 공유 또는 클립보드 API를 지원하지 않습니다.",
    shareSummaryLabel: "프리셋 미리보기"
  },
  en: defaultCopy
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

function buildPreviewShareHref(params: {
  presetId: string;
  taxableIncomeKrw: number | null;
  nonTaxableIncomeKrw: number;
}) {
  const search = new URLSearchParams();
  search.set("source", "payroll-preview-share");
  search.set("incomeSplitItemPresetId", params.presetId);
  if (params.taxableIncomeKrw !== null) {
    search.set("taxableIncomeKrw", String(params.taxableIncomeKrw));
  }
  search.set("nonTaxableIncomeKrw", String(params.nonTaxableIncomeKrw));
  return `/admin/payroll-close/preview-builder?${search.toString()}`;
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
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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
        taxableIncomeItems: copy.presetModeOmittedLabel,
        nonTaxableIncomeItems: copy.presetModeOmittedLabel
      }
    };
  }, [selectedPreset, parsedTaxableIncomeKrw, parsedNonTaxableIncomeKrw, copy.presetModeOmittedLabel]);

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

  const requestPayloadText = useMemo(
    () => (requestPayloadPreview ? JSON.stringify(requestPayloadPreview, null, 2) : ""),
    [requestPayloadPreview]
  );
  const serverTemplateText = useMemo(
    () => (serverTemplatePreview ? JSON.stringify(serverTemplatePreview, null, 2) : ""),
    [serverTemplatePreview]
  );

  const combinedPreviewText = useMemo(() => {
    if (!requestPayloadText || !serverTemplateText) {
      return "";
    }
    return [copy.requestPreviewLabel, requestPayloadText, copy.serverTemplateLabel, serverTemplateText].join(
      "\n\n"
    );
  }, [copy.requestPreviewLabel, copy.serverTemplateLabel, requestPayloadText, serverTemplateText]);

  const sharePreviewText = useMemo(() => {
    if (!selectedPreset || !combinedPreviewText) {
      return "";
    }
    const shareHref = buildPreviewShareHref({
      presetId: selectedPreset.id,
      taxableIncomeKrw: parsedTaxableIncomeKrw,
      nonTaxableIncomeKrw: parsedNonTaxableIncomeKrw
    });
    return [`${copy.shareSummaryLabel}: ${selectedPreset.id}`, shareHref, combinedPreviewText].join("\n\n");
  }, [
    combinedPreviewText,
    copy.shareSummaryLabel,
    parsedNonTaxableIncomeKrw,
    parsedTaxableIncomeKrw,
    selectedPreset
  ]);

  useEffect(() => {
    if (!actionMessage) {
      return;
    }
    const timer = window.setTimeout(() => setActionMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const writeClipboard = useCallback(async (content: string) => {
    if (!content.trim()) {
      return false;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      return false;
    }
  }, []);

  const copyPreview = useCallback(
    async (content: string) => {
      const copied = await writeClipboard(content);
      setActionMessage(copied ? copy.copySuccess : copy.actionFailed);
    },
    [copy.actionFailed, copy.copySuccess, writeClipboard]
  );

  const sharePresetPreview = useCallback(async () => {
    if (!sharePreviewText) {
      return;
    }
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: selectedPreset ? `${copy.shareSummaryLabel}: ${selectedPreset.id}` : copy.shareSummaryLabel,
          text: sharePreviewText
        });
        setActionMessage(copy.shareSuccess);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    const copied = await writeClipboard(sharePreviewText);
    setActionMessage(copied ? copy.shareFallbackCopySuccess : copy.shareUnavailable);
  }, [
    copy.shareFallbackCopySuccess,
    copy.shareSuccess,
    copy.shareSummaryLabel,
    copy.shareUnavailable,
    selectedPreset,
    sharePreviewText,
    writeClipboard
  ]);

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
            <pre className="small">{requestPayloadText}</pre>
          </div>
          <div className="full">
            <p className="small">{copy.serverTemplateLabel}</p>
            <pre className="small">{serverTemplateText}</pre>
          </div>
          <div className="full actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={() => void copyPreview(requestPayloadText)} disabled={!requestPayloadText}>
              {copy.copyRequestButton}
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => void copyPreview(serverTemplateText)} disabled={!serverTemplateText}>
              {copy.copyTemplateButton}
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => void copyPreview(combinedPreviewText)} disabled={!combinedPreviewText}>
              {copy.copyCombinedButton}
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => void sharePresetPreview()} disabled={!sharePreviewText}>
              {copy.shareButton}
            </button>
          </div>
          {actionMessage ? (
            <p className="small muted full" role="status" aria-live="polite">
              {actionMessage}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
