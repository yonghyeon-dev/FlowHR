"use client";

import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";

type PayrollKrIncomeSplitItemFieldsProps = {
  taxableCode: string;
  onTaxableCodeChange: (nextValue: string) => void;
  taxableCategory: string;
  onTaxableCategoryChange: (nextValue: string) => void;
  taxableAmountKrw: string;
  onTaxableAmountKrwChange: (nextValue: string) => void;
  nonTaxableCode: string;
  onNonTaxableCodeChange: (nextValue: string) => void;
  nonTaxableCategory: string;
  onNonTaxableCategoryChange: (nextValue: string) => void;
  nonTaxableAmountKrw: string;
  onNonTaxableAmountKrwChange: (nextValue: string) => void;
};

type IncomeSplitItemCopy = {
  taxableTitle: string;
  nonTaxableTitle: string;
  codeLabel: string;
  categoryLabel: string;
  amountLabel: string;
  guide: string;
};

const incomeSplitItemCopy: Record<FlowLocale, IncomeSplitItemCopy> = {
  ko: {
    taxableTitle: "과세 항목(선택)",
    nonTaxableTitle: "비과세 항목(선택)",
    codeLabel: "코드",
    categoryLabel: "카테고리",
    amountLabel: "금액(KRW)",
    guide:
      "코드/카테고리/금액 3개를 모두 입력하면 항목 배열에 포함됩니다. 항목 합계는 분리 총액 규칙과 함께 검증됩니다."
  },
  en: {
    taxableTitle: "Taxable item (optional)",
    nonTaxableTitle: "Non-taxable item (optional)",
    codeLabel: "Code",
    categoryLabel: "Category",
    amountLabel: "Amount (KRW)",
    guide:
      "An item is included only when code/category/amount are all provided. Item totals are validated with split totals."
  }
};

export function PayrollKrIncomeSplitItemFields({
  taxableCode,
  onTaxableCodeChange,
  taxableCategory,
  onTaxableCategoryChange,
  taxableAmountKrw,
  onTaxableAmountKrwChange,
  nonTaxableCode,
  onNonTaxableCodeChange,
  nonTaxableCategory,
  onNonTaxableCategoryChange,
  nonTaxableAmountKrw,
  onNonTaxableAmountKrwChange
}: PayrollKrIncomeSplitItemFieldsProps) {
  const { locale } = useI18n();
  const copy = incomeSplitItemCopy[locale];

  return (
    <div>
      <p className="small muted">{copy.guide}</p>
      <div className="input-grid compact">
        <label>
          {copy.taxableTitle} {copy.codeLabel}
          <input value={taxableCode} onChange={(event) => onTaxableCodeChange(event.target.value)} />
        </label>
        <label>
          {copy.taxableTitle} {copy.categoryLabel}
          <input
            value={taxableCategory}
            onChange={(event) => onTaxableCategoryChange(event.target.value)}
          />
        </label>
        <label>
          {copy.taxableTitle} {copy.amountLabel}
          <input
            type="number"
            min={0}
            value={taxableAmountKrw}
            onChange={(event) => onTaxableAmountKrwChange(event.target.value)}
          />
        </label>
        <label>
          {copy.nonTaxableTitle} {copy.codeLabel}
          <input
            value={nonTaxableCode}
            onChange={(event) => onNonTaxableCodeChange(event.target.value)}
          />
        </label>
        <label>
          {copy.nonTaxableTitle} {copy.categoryLabel}
          <input
            value={nonTaxableCategory}
            onChange={(event) => onNonTaxableCategoryChange(event.target.value)}
          />
        </label>
        <label>
          {copy.nonTaxableTitle} {copy.amountLabel}
          <input
            type="number"
            min={0}
            value={nonTaxableAmountKrw}
            onChange={(event) => onNonTaxableAmountKrwChange(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
