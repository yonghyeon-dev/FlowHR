export type PayrollKrIncomeSplitItemCodeKind = "taxable" | "non_taxable";

export type PayrollKrIncomeSplitItemCodeDictionaryEntry = {
  code: string;
  kind: PayrollKrIncomeSplitItemCodeKind;
  category: string;
  label: string;
};

const payrollKrIncomeSplitItemCodeDictionary: PayrollKrIncomeSplitItemCodeDictionaryEntry[] = [
  {
    code: "TX_SALARY",
    kind: "taxable",
    category: "salary",
    label: "Base salary"
  },
  {
    code: "TX_BONUS",
    kind: "taxable",
    category: "bonus",
    label: "Bonus payout"
  },
  {
    code: "TX_ALLOWANCE",
    kind: "taxable",
    category: "allowance",
    label: "Taxable allowance"
  },
  {
    code: "NT_MEAL",
    kind: "non_taxable",
    category: "allowance",
    label: "Meal allowance"
  },
  {
    code: "NT_COMMUTE",
    kind: "non_taxable",
    category: "allowance",
    label: "Commute allowance"
  },
  {
    code: "NT_CHILDCARE",
    kind: "non_taxable",
    category: "allowance",
    label: "Childcare allowance"
  }
];

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

export function listPayrollKrIncomeSplitItemCodeDictionary(
  kind?: PayrollKrIncomeSplitItemCodeKind
) {
  if (!kind) {
    return payrollKrIncomeSplitItemCodeDictionary.slice();
  }
  return payrollKrIncomeSplitItemCodeDictionary.filter((entry) => entry.kind === kind);
}

export function findPayrollKrIncomeSplitItemCodeDictionaryEntry(
  code: string,
  kind?: PayrollKrIncomeSplitItemCodeKind
) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    return null;
  }
  return (
    payrollKrIncomeSplitItemCodeDictionary.find(
      (entry) =>
        normalizeCode(entry.code) === normalizedCode &&
        (kind === undefined || entry.kind === kind)
    ) ?? null
  );
}
