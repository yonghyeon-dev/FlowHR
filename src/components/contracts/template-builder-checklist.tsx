"use client";

import type { ContractTemplateBuilderCopy } from "@/components/contracts/copy";

export type TemplateClauseDraft = {
  id: string;
  title: string;
  body: string;
  required: boolean;
};

export type TemplateValidationChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
};

function normalizeClause(clause: TemplateClauseDraft) {
  return {
    ...clause,
    title: clause.title.trim(),
    body: clause.body.trim()
  };
}

export function buildTemplateValidationChecklist(
  templateName: string,
  clauses: TemplateClauseDraft[],
  copy: Pick<
    ContractTemplateBuilderCopy,
    | "checklistNameRule"
    | "checklistClauseRule"
    | "checklistRequiredRule"
    | "checklistDuplicateRule"
  >
): TemplateValidationChecklistItem[] {
  const normalizedClauses = clauses.map(normalizeClause);
  const clausesWithContent = normalizedClauses.filter(
    (clause) => clause.title.length > 0 && clause.body.length > 0
  );
  const requiredClauses = normalizedClauses.filter((clause) => clause.required);
  const titleCounts = new Map<string, number>();
  for (const clause of normalizedClauses) {
    const key = clause.title.toLowerCase();
    if (!key) {
      continue;
    }
    titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  }
  const hasDuplicateTitle = Array.from(titleCounts.values()).some((count) => count > 1);

  return [
    { id: "template-name", label: copy.checklistNameRule, passed: templateName.trim().length >= 2 },
    { id: "clause-content", label: copy.checklistClauseRule, passed: clausesWithContent.length > 0 },
    { id: "required-clause", label: copy.checklistRequiredRule, passed: requiredClauses.length > 0 },
    { id: "duplicate-title", label: copy.checklistDuplicateRule, passed: !hasDuplicateTitle }
  ];
}

type ContractTemplateValidationChecklistProps = {
  title: string;
  readyLabel: string;
  needsFixLabel: string;
  items: TemplateValidationChecklistItem[];
};

export function ContractTemplateValidationChecklist({
  title,
  readyLabel,
  needsFixLabel,
  items
}: ContractTemplateValidationChecklistProps) {
  const ready = items.every((item) => item.passed);
  return (
    <section className="panel" style={{ marginTop: 12 }}>
      <h3>{title}</h3>
      <p className="small">{ready ? readyLabel : needsFixLabel}</p>
      <ul className="log-list">
        {items.map((item) => (
          <li key={item.id}>
            <span className={item.passed ? "ok" : "fail"}>{item.passed ? readyLabel : needsFixLabel}</span>{" "}
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
