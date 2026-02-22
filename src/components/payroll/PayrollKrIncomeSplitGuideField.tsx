"use client";

import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";

type PayrollKrIncomeSplitGuideFieldProps = {
  taxableIncomeKrw: string;
  onTaxableIncomeKrwChange: (nextValue: string) => void;
};

type IncomeSplitGuideCopy = {
  label: string;
  guide: string;
};

const incomeSplitGuideCopy: Record<FlowLocale, IncomeSplitGuideCopy> = {
  ko: {
    label: "과세 소득(KRW, 선택)",
    guide:
      "입력 시 과세 + 비과세 = 총지급(grossPayKrw) 분리 규칙을 검증합니다. 비워두면 과세 소득은 자동 계산됩니다."
  },
  en: {
    label: "Taxable income (KRW, optional)",
    guide:
      "When set, taxable + non-taxable must equal grossPayKrw. If omitted, taxable income is derived automatically."
  }
};

export function PayrollKrIncomeSplitGuideField({
  taxableIncomeKrw,
  onTaxableIncomeKrwChange
}: PayrollKrIncomeSplitGuideFieldProps) {
  const { locale } = useI18n();
  const copy = incomeSplitGuideCopy[locale];

  return (
    <div>
      <label>
        {copy.label}
        <input
          type="number"
          min={0}
          value={taxableIncomeKrw}
          onChange={(event) => onTaxableIncomeKrwChange(event.target.value)}
        />
      </label>
      <p className="small muted">{copy.guide}</p>
    </div>
  );
}
