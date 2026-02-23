"use client";

import { useMemo } from "react";
import {
  analyzePayrollKrIncomeSplitDraftConsistency,
  type PayrollKrIncomeSplitItemRowConsistency
} from "@/features/payroll/kr-income-split-item-consistency";
import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";
import type { PayrollKrIncomeSplitItemDraft } from "@/components/payroll/PayrollKrIncomeSplitItemsTable";

type PayrollKrIncomeSplitConsistencyGuidePanelProps = {
  taxableItems: PayrollKrIncomeSplitItemDraft[];
  nonTaxableItems: PayrollKrIncomeSplitItemDraft[];
  selectedPresetId: string;
  onClearManualItems?: () => void;
};

type ConsistencyGuideCopy = {
  title: string;
  presetModeGuide: string;
  presetManualIgnoredPrefix: string;
  manualModeGuide: string;
  noBlockingIssues: string;
  blockingIssuesTitle: string;
  clearManualItems: string;
  taxableLabel: string;
  nonTaxableLabel: string;
  enteredRowsLabel: string;
  validRowsLabel: string;
  partialRowsLabel: string;
  invalidAmountRowsLabel: string;
  unsupportedCodeRowsLabel: string;
  categoryMismatchRowsLabel: string;
  duplicateCodeRowsLabel: string;
};

const consistencyGuideCopy: Record<FlowLocale, ConsistencyGuideCopy> = {
  ko: {
    title: "항목 입력 정합성 가이드",
    presetModeGuide:
      "항목 프리셋이 선택되어 수동 항목 배열은 payload에서 제외됩니다. 서버는 preset 템플릿 코드/카테고리를 적용합니다.",
    presetManualIgnoredPrefix: "프리셋 모드에서 무시될 수동 입력 행 수",
    manualModeGuide:
      "수동 입력 모드에서는 코드/카테고리/금액을 모두 입력해야 하며, 코드 사전(kind별)과 카테고리 일치가 필요합니다.",
    noBlockingIssues: "제출 전 차단 이슈가 없습니다.",
    blockingIssuesTitle: "제출 전 수정이 필요한 항목",
    clearManualItems: "수동 입력 행 초기화",
    taxableLabel: "과세",
    nonTaxableLabel: "비과세",
    enteredRowsLabel: "입력 행",
    validRowsLabel: "정상 행",
    partialRowsLabel: "부분 입력 행",
    invalidAmountRowsLabel: "금액 형식 오류 행",
    unsupportedCodeRowsLabel: "사전 미지원 코드 행",
    categoryMismatchRowsLabel: "카테고리 불일치 행",
    duplicateCodeRowsLabel: "중복 코드 행"
  },
  en: {
    title: "Split-item consistency guide",
    presetModeGuide:
      "Item preset is selected, so manual item arrays are excluded from payload. Server applies preset code/category templates.",
    presetManualIgnoredPrefix: "Manual rows ignored in preset mode",
    manualModeGuide:
      "In manual mode, code/category/amount are all required and code/category must match dictionary entries by kind.",
    noBlockingIssues: "No blocking issue found before submit.",
    blockingIssuesTitle: "Fix these items before submit",
    clearManualItems: "Clear manual rows",
    taxableLabel: "Taxable",
    nonTaxableLabel: "Non-taxable",
    enteredRowsLabel: "Entered rows",
    validRowsLabel: "Valid rows",
    partialRowsLabel: "Partial rows",
    invalidAmountRowsLabel: "Invalid amount rows",
    unsupportedCodeRowsLabel: "Unsupported code rows",
    categoryMismatchRowsLabel: "Category mismatch rows",
    duplicateCodeRowsLabel: "Duplicate code rows"
  }
};

function toHumanRowIndexes(indexes: number[]) {
  if (indexes.length === 0) {
    return "-";
  }
  return indexes
    .slice()
    .sort((a, b) => a - b)
    .map((index) => index + 1)
    .join(", ");
}

type RowSummaryLineProps = {
  label: string;
  value: string | number;
};

function RowSummaryLine({ label, value }: RowSummaryLineProps) {
  return (
    <p className="small">
      {label}: <strong>{value}</strong>
    </p>
  );
}

type RowIssueBlockProps = {
  copy: ConsistencyGuideCopy;
  title: string;
  summary: PayrollKrIncomeSplitItemRowConsistency;
};

function RowIssueBlock({ copy, title, summary }: RowIssueBlockProps) {
  return (
    <div>
      <p className="small">
        <strong>{title}</strong>
      </p>
      <RowSummaryLine label={copy.enteredRowsLabel} value={summary.enteredRowCount} />
      <RowSummaryLine label={copy.validRowsLabel} value={summary.validRowCount} />
      <RowSummaryLine
        label={copy.partialRowsLabel}
        value={toHumanRowIndexes(summary.partialRowIndexes)}
      />
      <RowSummaryLine
        label={copy.invalidAmountRowsLabel}
        value={toHumanRowIndexes(summary.invalidAmountRowIndexes)}
      />
      <RowSummaryLine
        label={copy.unsupportedCodeRowsLabel}
        value={toHumanRowIndexes(summary.unsupportedCodeRowIndexes)}
      />
      <RowSummaryLine
        label={copy.categoryMismatchRowsLabel}
        value={toHumanRowIndexes(summary.categoryMismatchRowIndexes)}
      />
      <RowSummaryLine
        label={copy.duplicateCodeRowsLabel}
        value={toHumanRowIndexes(summary.duplicateCodeRowIndexes)}
      />
    </div>
  );
}

export function PayrollKrIncomeSplitConsistencyGuidePanel({
  taxableItems,
  nonTaxableItems,
  selectedPresetId,
  onClearManualItems
}: PayrollKrIncomeSplitConsistencyGuidePanelProps) {
  const { locale } = useI18n();
  const copy = consistencyGuideCopy[locale];
  const summary = useMemo(
    () =>
      analyzePayrollKrIncomeSplitDraftConsistency({
        taxableItems,
        nonTaxableItems
      }),
    [taxableItems, nonTaxableItems]
  );
  const usesPreset = selectedPresetId.trim().length > 0;

  return (
    <div>
      <p className="small">
        <strong>{copy.title}</strong>
      </p>
      {usesPreset ? (
        <div>
          <p className="small muted">{copy.presetModeGuide}</p>
          <p className="small">
            {copy.presetManualIgnoredPrefix}: <strong>{summary.enteredManualRowCount}</strong>
          </p>
          {onClearManualItems && summary.enteredManualRowCount > 0 ? (
            <button type="button" onClick={onClearManualItems}>
              {copy.clearManualItems}
            </button>
          ) : null}
        </div>
      ) : (
        <div>
          <p className="small muted">{copy.manualModeGuide}</p>
          {summary.hasBlockingIssues ? (
            <div>
              <p className="small" style={{ color: "var(--danger)" }}>
                {copy.blockingIssuesTitle}
              </p>
              <div className="input-grid compact">
                <RowIssueBlock copy={copy} title={copy.taxableLabel} summary={summary.taxable} />
                <RowIssueBlock copy={copy} title={copy.nonTaxableLabel} summary={summary.nonTaxable} />
              </div>
            </div>
          ) : (
            <p className="small">{copy.noBlockingIssues}</p>
          )}
        </div>
      )}
    </div>
  );
}
