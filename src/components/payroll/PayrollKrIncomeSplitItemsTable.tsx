"use client";

import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";

const incomeSplitItemRowLimit = 20;

export type PayrollKrIncomeSplitItemDraft = {
  code: string;
  category: string;
  amountKrw: string;
};

type PayrollKrIncomeSplitItemsTableProps = {
  taxableItems: PayrollKrIncomeSplitItemDraft[];
  onTaxableItemsChange: (nextItems: PayrollKrIncomeSplitItemDraft[]) => void;
  nonTaxableItems: PayrollKrIncomeSplitItemDraft[];
  onNonTaxableItemsChange: (nextItems: PayrollKrIncomeSplitItemDraft[]) => void;
  disabled?: boolean;
};

type IncomeSplitItemsTableCopy = {
  taxableTitle: string;
  nonTaxableTitle: string;
  codeLabel: string;
  categoryLabel: string;
  amountLabel: string;
  addRowLabel: string;
  removeRowLabel: string;
  rowLabelPrefix: string;
  guide: string;
  disabledGuide: string;
  rowCountLabel: string;
};

const incomeSplitItemsTableCopy: Record<FlowLocale, IncomeSplitItemsTableCopy> = {
  ko: {
    taxableTitle: "과세 항목",
    nonTaxableTitle: "비과세 항목",
    codeLabel: "코드",
    categoryLabel: "카테고리",
    amountLabel: "금액(KRW)",
    addRowLabel: "행 추가",
    removeRowLabel: "행 삭제",
    rowLabelPrefix: "행",
    guide:
      "코드/카테고리/금액이 모두 입력된 행만 payload에 포함됩니다. 부분 입력 행은 서버 검증에서 거부됩니다.",
    disabledGuide: "항목 프리셋 사용 중에는 수동 항목 테이블 입력이 비활성화됩니다.",
    rowCountLabel: "행 수"
  },
  en: {
    taxableTitle: "Taxable items",
    nonTaxableTitle: "Non-taxable items",
    codeLabel: "Code",
    categoryLabel: "Category",
    amountLabel: "Amount (KRW)",
    addRowLabel: "Add row",
    removeRowLabel: "Remove row",
    rowLabelPrefix: "Row",
    guide:
      "Only rows with code/category/amount are included in payload. Partial rows are rejected by server validation.",
    disabledGuide: "Manual item table inputs are disabled while an item preset is selected.",
    rowCountLabel: "Rows"
  }
};

export function createEmptyPayrollKrIncomeSplitItemDraft(): PayrollKrIncomeSplitItemDraft {
  return {
    code: "",
    category: "",
    amountKrw: ""
  };
}

function ensureAtLeastOneRow(items: PayrollKrIncomeSplitItemDraft[]) {
  if (items.length > 0) {
    return items;
  }
  return [createEmptyPayrollKrIncomeSplitItemDraft()];
}

function updateItemAt(
  items: PayrollKrIncomeSplitItemDraft[],
  index: number,
  patch: Partial<PayrollKrIncomeSplitItemDraft>
) {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

function removeItemAt(items: PayrollKrIncomeSplitItemDraft[], index: number) {
  if (items.length <= 1) {
    return [createEmptyPayrollKrIncomeSplitItemDraft()];
  }
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function addItem(items: PayrollKrIncomeSplitItemDraft[]) {
  if (items.length >= incomeSplitItemRowLimit) {
    return items;
  }
  return [...items, createEmptyPayrollKrIncomeSplitItemDraft()];
}

type ItemRowsSectionProps = {
  title: string;
  items: PayrollKrIncomeSplitItemDraft[];
  onChange: (nextItems: PayrollKrIncomeSplitItemDraft[]) => void;
  copy: IncomeSplitItemsTableCopy;
  disabled: boolean;
};

function ItemRowsSection({ title, items, onChange, copy, disabled }: ItemRowsSectionProps) {
  const safeItems = ensureAtLeastOneRow(items);

  return (
    <div>
      <p className="small">
        <strong>{title}</strong> ({copy.rowCountLabel}: {safeItems.length}/{incomeSplitItemRowLimit})
      </p>
      <div className="input-grid compact">
        {safeItems.map((item, index) => (
          <div className="full" key={`${title}-${index}`}>
            <div className="input-grid compact">
              <label>
                {copy.rowLabelPrefix} {index + 1} {copy.codeLabel}
                <input
                  value={item.code}
                  onChange={(event) =>
                    onChange(updateItemAt(safeItems, index, { code: event.target.value }))
                  }
                  disabled={disabled}
                />
              </label>
              <label>
                {copy.rowLabelPrefix} {index + 1} {copy.categoryLabel}
                <input
                  value={item.category}
                  onChange={(event) =>
                    onChange(updateItemAt(safeItems, index, { category: event.target.value }))
                  }
                  disabled={disabled}
                />
              </label>
              <label>
                {copy.rowLabelPrefix} {index + 1} {copy.amountLabel}
                <input
                  type="number"
                  min={0}
                  value={item.amountKrw}
                  onChange={(event) =>
                    onChange(updateItemAt(safeItems, index, { amountKrw: event.target.value }))
                  }
                  disabled={disabled}
                />
              </label>
              <div>
                <button
                  type="button"
                  onClick={() => onChange(removeItemAt(safeItems, index))}
                  disabled={disabled || safeItems.length <= 1}
                >
                  {copy.removeRowLabel}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div>
        <button
          type="button"
          onClick={() => onChange(addItem(safeItems))}
          disabled={disabled || safeItems.length >= incomeSplitItemRowLimit}
        >
          {copy.addRowLabel}
        </button>
      </div>
    </div>
  );
}

export function PayrollKrIncomeSplitItemsTable({
  taxableItems,
  onTaxableItemsChange,
  nonTaxableItems,
  onNonTaxableItemsChange,
  disabled = false
}: PayrollKrIncomeSplitItemsTableProps) {
  const { locale } = useI18n();
  const copy = incomeSplitItemsTableCopy[locale];

  return (
    <div>
      <p className="small muted">{copy.guide}</p>
      {disabled ? <p className="small muted">{copy.disabledGuide}</p> : null}
      <ItemRowsSection
        title={copy.taxableTitle}
        items={taxableItems}
        onChange={onTaxableItemsChange}
        copy={copy}
        disabled={disabled}
      />
      <ItemRowsSection
        title={copy.nonTaxableTitle}
        items={nonTaxableItems}
        onChange={onNonTaxableItemsChange}
        copy={copy}
        disabled={disabled}
      />
    </div>
  );
}
