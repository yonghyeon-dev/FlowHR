import {
  findPayrollKrIncomeSplitItemCodeDictionaryEntry,
  type PayrollKrIncomeSplitItemCodeKind
} from "@/features/payroll/kr-income-split-item-code-dictionary";

export type PayrollKrIncomeSplitItemDraftLike = {
  code: string;
  category: string;
  amountKrw: string;
};

export type PayrollKrIncomeSplitItemRowConsistency = {
  enteredRowCount: number;
  validRowCount: number;
  partialRowIndexes: number[];
  invalidAmountRowIndexes: number[];
  unsupportedCodeRowIndexes: number[];
  categoryMismatchRowIndexes: number[];
  duplicateCodeRowIndexes: number[];
};

export type PayrollKrIncomeSplitItemConsistencySummary = {
  taxable: PayrollKrIncomeSplitItemRowConsistency;
  nonTaxable: PayrollKrIncomeSplitItemRowConsistency;
  enteredManualRowCount: number;
  hasBlockingIssues: boolean;
};

function parseAmountKrw(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return Number.NaN;
  }
  return parsed;
}

function pushUnique(target: number[], index: number) {
  if (!target.includes(index)) {
    target.push(index);
  }
}

export function analyzePayrollKrIncomeSplitItemDraftRows(
  items: PayrollKrIncomeSplitItemDraftLike[],
  kind: PayrollKrIncomeSplitItemCodeKind
): PayrollKrIncomeSplitItemRowConsistency {
  const partialRowIndexes: number[] = [];
  const invalidAmountRowIndexes: number[] = [];
  const unsupportedCodeRowIndexes: number[] = [];
  const categoryMismatchRowIndexes: number[] = [];
  const duplicateCodeRowIndexes: number[] = [];

  const normalizedCodeToFirstIndex = new Map<string, number>();
  let enteredRowCount = 0;
  let validRowCount = 0;

  for (const [index, item] of items.entries()) {
    const code = item.code.trim();
    const category = item.category.trim();
    const amountText = item.amountKrw.trim();
    const isBlank = !code && !category && !amountText;

    if (isBlank) {
      continue;
    }
    enteredRowCount += 1;

    const isPartial = !code || !category || !amountText;
    if (isPartial) {
      partialRowIndexes.push(index);
      continue;
    }

    const parsedAmount = parseAmountKrw(amountText);
    if (parsedAmount === null || Number.isNaN(parsedAmount) || !Number.isFinite(parsedAmount)) {
      invalidAmountRowIndexes.push(index);
      continue;
    }

    const normalizedCode = code.toLowerCase();
    if (normalizedCodeToFirstIndex.has(normalizedCode)) {
      pushUnique(duplicateCodeRowIndexes, normalizedCodeToFirstIndex.get(normalizedCode)!);
      pushUnique(duplicateCodeRowIndexes, index);
    } else {
      normalizedCodeToFirstIndex.set(normalizedCode, index);
    }

    const dictionaryEntry = findPayrollKrIncomeSplitItemCodeDictionaryEntry(code, kind);
    if (!dictionaryEntry) {
      unsupportedCodeRowIndexes.push(index);
      continue;
    }

    if (category.toLowerCase() !== dictionaryEntry.category.toLowerCase()) {
      categoryMismatchRowIndexes.push(index);
      continue;
    }

    validRowCount += 1;
  }

  return {
    enteredRowCount,
    validRowCount,
    partialRowIndexes,
    invalidAmountRowIndexes,
    unsupportedCodeRowIndexes,
    categoryMismatchRowIndexes,
    duplicateCodeRowIndexes
  };
}

function hasRowBlockingIssue(summary: PayrollKrIncomeSplitItemRowConsistency) {
  return (
    summary.partialRowIndexes.length > 0 ||
    summary.invalidAmountRowIndexes.length > 0 ||
    summary.unsupportedCodeRowIndexes.length > 0 ||
    summary.categoryMismatchRowIndexes.length > 0 ||
    summary.duplicateCodeRowIndexes.length > 0
  );
}

export function analyzePayrollKrIncomeSplitDraftConsistency(input: {
  taxableItems: PayrollKrIncomeSplitItemDraftLike[];
  nonTaxableItems: PayrollKrIncomeSplitItemDraftLike[];
}) {
  const taxable = analyzePayrollKrIncomeSplitItemDraftRows(input.taxableItems, "taxable");
  const nonTaxable = analyzePayrollKrIncomeSplitItemDraftRows(input.nonTaxableItems, "non_taxable");
  const enteredManualRowCount = taxable.enteredRowCount + nonTaxable.enteredRowCount;
  const hasBlockingIssues = hasRowBlockingIssue(taxable) || hasRowBlockingIssue(nonTaxable);

  return {
    taxable,
    nonTaxable,
    enteredManualRowCount,
    hasBlockingIssues
  } satisfies PayrollKrIncomeSplitItemConsistencySummary;
}
