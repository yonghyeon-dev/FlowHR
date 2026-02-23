"use client";

import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";

export type PayrollKrPresetShareLinkFeedback = {
  hasAnyQuery: boolean;
  applied: {
    presetId: string | null;
    taxableIncomeKrw: string | null;
    nonTaxableIncomeKrw: string | null;
  };
  invalid: {
    presetId: string | null;
    taxableIncomeKrw: string | null;
    nonTaxableIncomeKrw: string | null;
  };
};

type ShareLinkFeedbackCopy = {
  title: string;
  appliedLabel: string;
  invalidLabel: string;
  noneApplied: string;
  noneInvalid: string;
  resetButton: string;
  reapplyButton: string;
  presetField: string;
  taxableField: string;
  nonTaxableField: string;
};

const defaultCopy: ShareLinkFeedbackCopy = {
  title: "Preset share-link query feedback",
  appliedLabel: "Applied values",
  invalidLabel: "Ignored invalid query values",
  noneApplied: "No applicable query values were applied.",
  noneInvalid: "No invalid query values.",
  resetButton: "Reset share-applied values",
  reapplyButton: "Re-apply query values",
  presetField: "incomeSplitItemPresetId",
  taxableField: "taxableIncomeKrw",
  nonTaxableField: "nonTaxableIncomeKrw"
};

const shareLinkFeedbackCopy: Record<FlowLocale, ShareLinkFeedbackCopy> = {
  ko: {
    ...defaultCopy,
    title: "프리셋 공유 링크 쿼리 피드백",
    appliedLabel: "적용된 값",
    invalidLabel: "무시된 invalid 쿼리 값",
    noneApplied: "적용 가능한 쿼리 값이 없습니다.",
    noneInvalid: "무시된 invalid 쿼리 값이 없습니다.",
    resetButton: "공유값 초기화",
    reapplyButton: "쿼리값 재적용"
  },
  en: defaultCopy
};

function buildPairs(copy: ShareLinkFeedbackCopy, values: PayrollKrPresetShareLinkFeedback["applied"]) {
  return [
    values.presetId ? `${copy.presetField}=${values.presetId}` : null,
    values.taxableIncomeKrw !== null ? `${copy.taxableField}=${values.taxableIncomeKrw}` : null,
    values.nonTaxableIncomeKrw !== null
      ? `${copy.nonTaxableField}=${values.nonTaxableIncomeKrw}`
      : null
  ].filter((item): item is string => Boolean(item));
}

export function PayrollKrPresetShareLinkFeedbackPanel({
  feedback,
  onResetAppliedValues,
  onReapplyQueryValues
}: {
  feedback: PayrollKrPresetShareLinkFeedback | null;
  onResetAppliedValues?: () => void;
  onReapplyQueryValues?: () => void;
}) {
  const { locale } = useI18n();
  const copy = shareLinkFeedbackCopy[locale];

  if (!feedback || !feedback.hasAnyQuery) {
    return null;
  }

  const appliedPairs = buildPairs(copy, feedback.applied);
  const invalidPairs = buildPairs(copy, feedback.invalid);

  return (
    <div>
      <p className="small">
        <strong>{copy.title}</strong>
      </p>
      <p className="small">
        {copy.appliedLabel}:{" "}
        {appliedPairs.length > 0 ? appliedPairs.join(" / ") : <span className="muted">{copy.noneApplied}</span>}
      </p>
      <p className="small muted">
        {copy.invalidLabel}: {invalidPairs.length > 0 ? invalidPairs.join(" / ") : copy.noneInvalid}
      </p>
      {onResetAppliedValues || onReapplyQueryValues ? (
        <div className="actions">
          {onResetAppliedValues ? (
            <button type="button" className="btn btn-secondary btn-small" onClick={onResetAppliedValues}>
              {copy.resetButton}
            </button>
          ) : null}
          {onReapplyQueryValues ? (
            <button type="button" className="btn btn-secondary btn-small" onClick={onReapplyQueryValues}>
              {copy.reapplyButton}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
