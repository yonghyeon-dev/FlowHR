import type { ContractTemplateBuilderCopy } from "@/components/contracts/copy";
import type { TemplateClauseDraft } from "@/components/contracts/template-builder-checklist";

type ClauseDraft = TemplateClauseDraft;

type BuildTemplateBodyCopyInput = Pick<
  ContractTemplateBuilderCopy,
  "requiredChip" | "optionalChip" | "untitledClause" | "emptyClauseBody"
>;

export function createClauseId(index: number) {
  return `clause-${Date.now()}-${index}`;
}

function normalizeClause(value: ClauseDraft) {
  return {
    ...value,
    title: value.title.trim(),
    body: value.body.trim()
  };
}

export function buildTemplateBody(clauses: ClauseDraft[], copy: BuildTemplateBodyCopyInput) {
  return clauses
    .map(normalizeClause)
    .filter((clause) => clause.title.length > 0 || clause.body.length > 0)
    .map((clause, index) => {
      const badge = clause.required ? `[${copy.requiredChip}]` : `[${copy.optionalChip}]`;
      return `## ${index + 1}. ${clause.title || copy.untitledClause} ${badge}\n${clause.body || copy.emptyClauseBody}`;
    })
    .join("\n\n");
}

export function createInitialClauses(copy: ContractTemplateBuilderCopy): ClauseDraft[] {
  return copy.defaultClauses.map((clause, index) => ({
    id: createClauseId(index + 1),
    title: clause.title,
    body: clause.body,
    required: true
  }));
}

export type TemplateBodyDiffSummary = {
  addedLines: string[];
  removedLines: string[];
};

export function buildTemplateBodyDiffSummary(baselineBody: string, currentBody: string): TemplateBodyDiffSummary {
  const baselineLines = baselineBody
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const currentLines = currentBody
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const baselineSet = new Set(baselineLines);
  const currentSet = new Set(currentLines);

  const addedLines = currentLines.filter((line) => !baselineSet.has(line));
  const removedLines = baselineLines.filter((line) => !currentSet.has(line));

  return { addedLines, removedLines };
}
