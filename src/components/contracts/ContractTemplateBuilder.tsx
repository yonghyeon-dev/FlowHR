"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  contractCategoryLabelByLocale,
  contractTemplateStatusLabelByLocale,
  contractTemplateBuilderCopyByLocale,
  type ContractCategory
} from "@/components/contracts/copy";
import {
  normalizeContractsErrorMessageForRuntime,
  readJson,
  requireContractsAccessToken,
  setContractsRuntimeLocale
} from "@/components/contracts/http";
import { formatContractsPublicReference } from "@/components/contracts/runtime-copy-helpers";
import {
  buildTemplateBody,
  buildTemplateBodyDiffSummary,
  createClauseId,
  createInitialClauses
} from "@/components/contracts/template-builder-helpers";
import {
  buildTemplateValidationChecklist,
  ContractTemplateValidationChecklist,
  type TemplateClauseDraft
} from "@/components/contracts/template-builder-checklist";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type ClauseDraft = TemplateClauseDraft;

type CreatedTemplate = {
  id: string;
  name: string;
  category: ContractCategory;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  version: number;
};

export default function ContractTemplateBuilder() {
  const { locale } = useI18n();
  const { snapshot } = useSupabaseSession();
  const accessToken = snapshot?.accessToken?.trim() ?? "";
  const copy = contractTemplateBuilderCopyByLocale[locale];
  const categoryLabels = contractCategoryLabelByLocale[locale];
  const templateStatusLabels = contractTemplateStatusLabelByLocale[locale];

  const [templateName, setTemplateName] = useState(copy.defaultTemplateName);
  const [category, setCategory] = useState<ContractCategory>("employment");
  const [clauses, setClauses] = useState<ClauseDraft[]>(() => createInitialClauses(copy));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState<CreatedTemplate | null>(null);
  const [baselineBody, setBaselineBody] = useState("");

  useEffect(() => {
    setContractsRuntimeLocale(locale);
    return () => {
      setContractsRuntimeLocale(null);
    };
  }, [locale]);

  const templateBody = useMemo(
    () =>
      buildTemplateBody(clauses, {
        requiredChip: copy.requiredChip,
        optionalChip: copy.optionalChip,
        untitledClause: copy.untitledClause,
        emptyClauseBody: copy.emptyClauseBody
      }),
    [clauses, copy.emptyClauseBody, copy.optionalChip, copy.requiredChip, copy.untitledClause]
  );
  const validationChecklist = useMemo(
    () =>
      buildTemplateValidationChecklist(templateName, clauses, {
        checklistNameRule: copy.checklistNameRule,
        checklistClauseRule: copy.checklistClauseRule,
        checklistRequiredRule: copy.checklistRequiredRule,
        checklistDuplicateRule: copy.checklistDuplicateRule
      }),
    [
      clauses,
      copy.checklistClauseRule,
      copy.checklistDuplicateRule,
      copy.checklistNameRule,
      copy.checklistRequiredRule,
      templateName
    ]
  );
  const canCreateTemplate = validationChecklist.every((item) => item.passed);
  const templateDiff = useMemo(() => {
    if (!baselineBody.trim()) return { addedLines: [], removedLines: [] };
    return buildTemplateBodyDiffSummary(baselineBody, templateBody);
  }, [baselineBody, templateBody]);

  function updateClause(id: string, patch: Partial<ClauseDraft>) {
    setClauses((prev) => prev.map((clause) => (clause.id === id ? { ...clause, ...patch } : clause)));
  }

  function addClause() {
    setClauses((prev) => [...prev, { id: createClauseId(prev.length + 1), title: "", body: "", required: true }]);
  }

  function removeClause(id: string) {
    setClauses((prev) => prev.filter((clause) => clause.id !== id));
  }

  function captureBaseline() {
    setBaselineBody(templateBody);
    setStatusMessage(copy.baselineCapturedMessage);
    setError(null);
  }

  async function createTemplate() {
    if (!canCreateTemplate) {
      setError(copy.validationFailedMessage);
      return;
    }
    setPending(true);
    setError(null);
    setStatusMessage(null);
    setCreatedTemplate(null);
    try {
      const sessionToken = requireContractsAccessToken(accessToken);
      const payload = {
        name: templateName.trim(),
        category,
        status: "DRAFT",
        body: templateBody
      };
      const response = await fetch("/api/contracts/templates", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify(payload)
      });
      const body = (await readJson(response, copy.templateCreateError)) as {
        template: CreatedTemplate;
      };
      setCreatedTemplate(body.template);
      setStatusMessage(
        `${copy.templateCreatedPrefix}: ${formatContractsPublicReference(body.template.id, "template", locale === "ko")} (v${body.template.version})`
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(createError.message, copy.templateCreateError)
          : copy.templateCreateError
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">{copy.heroEyebrow}</p>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-subtitle">{copy.description}</p>
        </div>
      </header>
      {error ? <p className="inline-error">{error}</p> : null}
      {statusMessage ? <p className="small">{statusMessage}</p> : null}
      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.builderTitle}</h2>
          <div className="contract-form-grid">
            <label>
              {copy.templateNameLabel}
              <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
            </label>
            <label>
              {copy.categoryLabel}
              <select value={category} onChange={(event) => setCategory(event.target.value as ContractCategory)}>
                <option value="employment">{categoryLabels.employment}</option>
                <option value="amendment">{categoryLabels.amendment}</option>
                <option value="nda">{categoryLabels.nda}</option>
                <option value="policy">{categoryLabels.policy}</option>
              </select>
            </label>
          </div>
          <div className="contract-action-row">
            <button type="button" className="btn btn-secondary" onClick={addClause} disabled={pending}>
              {copy.addClauseAction}
            </button>
            <button type="button" className="btn btn-secondary" onClick={captureBaseline} disabled={pending}>
              {copy.captureBaselineAction}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setBaselineBody("")}
              disabled={pending || !baselineBody}
            >
              {copy.resetBaselineAction}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void createTemplate()}
              disabled={pending || !canCreateTemplate}
            >
              {copy.createTemplateAction}
            </button>
          </div>
          <ContractTemplateValidationChecklist
            title={copy.checklistTitle}
            readyLabel={copy.checklistReadyLabel}
            needsFixLabel={copy.checklistNeedsFixLabel}
            items={validationChecklist}
          />
          <ul className="contract-template-list" aria-label={copy.clauseBuilderAria}>
            {clauses.map((clause, index) => (
              <li key={clause.id}>
                <div className="contract-template-head">
                  <strong>
                    {copy.clausePrefix} {index + 1}
                  </strong>
                  <span className="queue-history-chip">{clause.required ? copy.requiredChip : copy.optionalChip}</span>
                </div>
                <div className="contract-form-grid">
                  <label>
                    {copy.titleLabel}
                    <input
                      value={clause.title}
                      onChange={(event) => updateClause(clause.id, { title: event.target.value })}
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={clause.required}
                      onChange={(event) => updateClause(clause.id, { required: event.target.checked })}
                    />
                    {copy.requiredLabel}
                  </label>
                  <label className="contract-form-wide">
                    {copy.bodyLabel}
                    <textarea
                      rows={3}
                      value={clause.body}
                      onChange={(event) => updateClause(clause.id, { body: event.target.value })}
                    />
                  </label>
                </div>
                <div className="contract-action-row">
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => removeClause(clause.id)}
                    disabled={pending || clauses.length <= 1}
                  >
                    {copy.removeClauseAction}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <h2>{copy.generatedBodyTitle}</h2>
          <pre className="small">{templateBody || copy.noClauseContent}</pre>
          <h3>{copy.diffPanelTitle}</h3>
          {!baselineBody ? (
            <p className="small muted">{copy.noBaselineMessage}</p>
          ) : (
            <>
              <p className="small muted">
                {copy.diffAddedCountLabel}: {templateDiff.addedLines.length} / {copy.diffRemovedCountLabel}:{" "}
                {templateDiff.removedLines.length}
              </p>
              {templateDiff.addedLines.length === 0 && templateDiff.removedLines.length === 0 ? (
                <p className="small muted">{copy.diffNoChangesLabel}</p>
              ) : (
                <ul className="simple-list">
                  {templateDiff.addedLines.slice(0, 5).map((line, index) => (
                    <li key={`added-${index}`}>
                      <span className="small">+ {line}</span>
                    </li>
                  ))}
                  {templateDiff.removedLines.slice(0, 5).map((line, index) => (
                    <li key={`removed-${index}`}>
                      <span className="small">- {line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {createdTemplate ? (
            <ul className="simple-list">
              <li>
                <span>{copy.templateIdLabel}</span>
                <strong>{formatContractsPublicReference(createdTemplate.id, "template", locale === "ko")}</strong>
              </li>
              <li><span>{copy.versionLabel}</span><strong>{createdTemplate.version}</strong></li>
              <li><span>{copy.statusLabel}</span><strong>{templateStatusLabels[createdTemplate.status]}</strong></li>
              <li><span>{copy.categoryValueLabel}</span><strong>{categoryLabels[createdTemplate.category]}</strong></li>
            </ul>
          ) : (
            <p className="small">{copy.noTemplateMessage}</p>
          )}
          <div className="panel-actions">
            <Link href="/admin/contracts" className="btn btn-secondary">
              {copy.backToContractsAction}
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
