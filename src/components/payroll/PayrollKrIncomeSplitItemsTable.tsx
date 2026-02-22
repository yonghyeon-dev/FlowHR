"use client";

import {
  findPayrollKrIncomeSplitItemCodeDictionaryEntry,
  listPayrollKrIncomeSplitItemCodeDictionary,
  type PayrollKrIncomeSplitItemCodeDictionaryEntry,
  type PayrollKrIncomeSplitItemCodeKind
} from "@/features/payroll/kr-income-split-item-code-dictionary";
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
  codeAutocompleteGuide: string;
  categoryAutofillGuide: string;
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
    codeAutocompleteGuide: "코드 입력 시 사전 항목 autocomplete가 제공됩니다.",
    categoryAutofillGuide: "사전 코드 선택 시 카테고리가 자동으로 채워집니다.",
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
    codeAutocompleteGuide: "Code input provides dictionary autocomplete suggestions.",
    categoryAutofillGuide: "Category is auto-filled when a dictionary code is selected.",
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
  kind: PayrollKrIncomeSplitItemCodeKind;
  datalistId: string;
  codeDictionary: PayrollKrIncomeSplitItemCodeDictionaryEntry[];
  disabled: boolean;
};

function ItemRowsSection({
  title,
  items,
  onChange,
  copy,
  kind,
  datalistId,
  codeDictionary,
  disabled
}: ItemRowsSectionProps) {
  const safeItems = ensureAtLeastOneRow(items);

  return (
    <div>
      <p className="small">
        <strong>{title}</strong> ({copy.rowCountLabel}: {safeItems.length}/{incomeSplitItemRowLimit})
      </p>
      <div className="input-grid compact">
        {safeItems.map((item, index) => {
          const matchedEntry = findPayrollKrIncomeSplitItemCodeDictionaryEntry(item.code, kind);
          return (
            <div className="full" key={`${title}-${index}`}>
              <div className="input-grid compact">
                <label>
                  {copy.rowLabelPrefix} {index + 1} {copy.codeLabel}
                  <input
                    list={datalistId}
                    value={item.code}
                    onChange={(event) => {
                      const nextCode = event.target.value;
                      const nextDictionaryEntry = findPayrollKrIncomeSplitItemCodeDictionaryEntry(
                        nextCode,
                        kind
                      );
                      onChange(
                        updateItemAt(safeItems, index, {
                          code: nextCode,
                          category: nextDictionaryEntry ? nextDictionaryEntry.category : item.category
                        })
                      );
                    }}
                    disabled={disabled}
                  />
                  {matchedEntry ? (
                    <span className="small muted">
                      {matchedEntry.label} / {matchedEntry.category}
                    </span>
                  ) : null}
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
          );
        })}
      </div>
      <datalist id={datalistId}>
        {codeDictionary.map((entry) => (
          <option
            key={`${datalistId}-${entry.code}`}
            value={entry.code}
            label={`${entry.label} / ${entry.category}`}
          />
        ))}
      </datalist>
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
  const taxableCodeDictionary = listPayrollKrIncomeSplitItemCodeDictionary("taxable");
  const nonTaxableCodeDictionary = listPayrollKrIncomeSplitItemCodeDictionary("non_taxable");

  return (
    <div>
      <p className="small muted">{copy.guide}</p>
      <p className="small muted">
        {copy.codeAutocompleteGuide} {copy.categoryAutofillGuide}
      </p>
      {disabled ? <p className="small muted">{copy.disabledGuide}</p> : null}
      <ItemRowsSection
        title={copy.taxableTitle}
        items={taxableItems}
        onChange={onTaxableItemsChange}
        copy={copy}
        kind="taxable"
        datalistId="payroll-income-split-taxable-code-options"
        codeDictionary={taxableCodeDictionary}
        disabled={disabled}
      />
      <ItemRowsSection
        title={copy.nonTaxableTitle}
        items={nonTaxableItems}
        onChange={onNonTaxableItemsChange}
        copy={copy}
        kind="non_taxable"
        datalistId="payroll-income-split-non-taxable-code-options"
        codeDictionary={nonTaxableCodeDictionary}
        disabled={disabled}
      />
    </div>
  );
}
