"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminContractsCopyByLocale,
  contractApprovalStatusLabelByLocale,
  contractCategoryLabelByLocale,
  contractDocumentStatusLabelByLocale,
  contractTemplateStatusLabelByLocale,
  toDateText,
  type ContractCategory
} from "@/components/contracts/copy";
import { resolveContractDocumentActionRequest } from "@/components/contracts/action-payloads";
import { normalizeContractsErrorMessageForRuntime, readJson } from "@/components/contracts/http";
import { normalizeContractsEntityTitle } from "@/components/contracts/runtime-copy-helpers";
import {
  type AdminContractDocument as ContractDocument,
  type ContractDocumentAction,
  type ContractTemplate
} from "@/components/contracts/types";
import { useI18n } from "@/lib/i18n/provider";
export default function AdminContractsWorkspace() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = adminContractsCopyByLocale[locale];
  const categoryLabels = contractCategoryLabelByLocale[locale];
  const templateStatusLabels = contractTemplateStatusLabelByLocale[locale];
  const documentStatusLabels = contractDocumentStatusLabelByLocale[locale];
  const approvalStatusLabels = contractApprovalStatusLabelByLocale[locale];
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [templateName, setTemplateName] = useState(
    locale === "ko" ? "근로계약 기본" : "Employment Standard"
  );
  const [templateCategory, setTemplateCategory] = useState<ContractCategory>("employment");
  const [templateBody, setTemplateBody] = useState(
    locale === "ko"
      ? "직원은 직무, 보상, 기밀유지 조항에 동의합니다."
      : "Employee agrees to role, compensation, and confidentiality clauses."
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplateId = useMemo(() => templates[0]?.id ?? "", [templates]);
  const actionLabelByAction = useMemo<Record<ContractDocumentAction, string>>(
    () => ({
      request: copy.requestApprovalAction,
      approve: copy.approveAction,
      reject: copy.rejectAction,
      send: copy.sendAction,
      expire: copy.expireAction,
      renew: copy.renewAction
    }),
    [copy]
  );
  const reload = useCallback(async () => {
    setError(null);
    const [templateBodyRaw, documentBodyRaw] = await Promise.all([
      fetch("/api/contracts/templates", { cache: "no-store" }).then((response) =>
        readJson(response, copy.loadError)
      ),
      fetch("/api/contracts/documents", { cache: "no-store" }).then((response) =>
        readJson(response, copy.loadError)
      )
    ]);

    setTemplates((templateBodyRaw as { templates?: ContractTemplate[] }).templates ?? []);
    setDocuments((documentBodyRaw as { documents?: ContractDocument[] }).documents ?? []);
  }, [copy.loadError]);
  useEffect(() => {
    reload().catch((loadError) => {
      setError(
        loadError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(loadError.message, copy.loadError)
          : copy.loadError
      );
    });
  }, [copy.loadError, reload]);
  async function submitTemplate() {
    setError(null);
    setMessage(null);
    try {
      await fetch("/api/contracts/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          category: templateCategory,
          body: templateBody,
          status: "DRAFT"
        })
      }).then((response) => readJson(response, copy.templateCreateError));
      setMessage(copy.templateCreatedMessage);
      await reload();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(submitError.message, copy.templateCreateError)
          : copy.templateCreateError
      );
    }
  }
  async function createDraftDocument() {
    if (!selectedTemplateId || employeeId.trim().length === 0) {
      setError(copy.requiredTemplateAndEmployeeError);
      return;
    }

    setError(null);
    setMessage(null);
    try {
      await fetch("/api/contracts/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          employeeId: employeeId.trim(),
          title: `${copy.draftTitlePrefix} ${employeeId.trim()}`,
          requiresApproval: true
        })
      }).then((response) => readJson(response, copy.draftCreateError));
      setMessage(copy.draftCreatedMessage);
      await reload();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(createError.message, copy.draftCreateError)
          : copy.draftCreateError
      );
    }
  }
  async function runDocumentAction(documentId: string, action: ContractDocumentAction) {
    setError(null);
    setMessage(null);
    const request = resolveContractDocumentActionRequest(documentId, action, copy.manualExpireReason);

    try {
      await fetch(request.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.payload)
      }).then((response) =>
        readJson(response, `${copy.actionFailedPrefix}: ${actionLabelByAction[action]}`)
      );
      setMessage(`${copy.actionCompletedPrefix}: ${actionLabelByAction[action]}`);
      await reload();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(
              actionError.message,
              `${copy.actionFailedPrefix}: ${actionLabelByAction[action]}`
            )
          : `${copy.actionFailedPrefix}: ${actionLabelByAction[action]}`
        );
    }
  }
  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">{copy.heroEyebrow}</p>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-subtitle">{copy.description}</p>
          <div className="contract-action-row">
            <Link href="/admin/contracts/builder" className="btn btn-secondary btn-small">
              {copy.openTemplateBuilderAction}
            </Link>
          </div>
        </div>
      </header>
      {error ? <p className="inline-error">{error}</p> : null}
      {message ? <p className="small">{message}</p> : null}
      <section className="kpi-strip" aria-label={copy.summaryKpiAria}>
        <article className="kpi-card">
          <span>{copy.templatesKpiLabel}</span>
          <strong>{templates.length}</strong>
        </article>
        <article className="kpi-card">
          <span>{copy.documentsKpiLabel}</span>
          <strong>{documents.length}</strong>
        </article>
        <article className="kpi-card">
          <span>{copy.pendingApprovalKpiLabel}</span>
          <strong>{documents.filter((item) => item.approvalStatus === "PENDING").length}</strong>
        </article>
      </section>
      <section className="panel-grid">
        <article id="contract-template-library" className="panel panel-contract-template-library">
          <h2>{copy.templateLibraryTitle}</h2>
          <div className="contract-form-grid">
            <label>
              {copy.nameLabel}
              <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
            </label>
            <label>
              {copy.categoryLabel}
              <select
                value={templateCategory}
                onChange={(event) => setTemplateCategory(event.target.value as ContractCategory)}
              >
                <option value="employment">{categoryLabels.employment}</option>
                <option value="amendment">{categoryLabels.amendment}</option>
                <option value="nda">{categoryLabels.nda}</option>
                <option value="policy">{categoryLabels.policy}</option>
              </select>
            </label>
            <label className="contract-form-wide">
              {copy.bodyLabel}
              <textarea rows={4} value={templateBody} onChange={(event) => setTemplateBody(event.target.value)} />
            </label>
          </div>
          <div className="contract-action-row">
            <button type="button" className="btn" onClick={submitTemplate}>
              {copy.createTemplateAction}
            </button>
          </div>
          <ul className="contract-template-list" aria-label={copy.templateListAria}>
            {templates.map((template) => (
              <li key={template.id} className={`tone-${template.status === "ACTIVE" ? "ready" : template.status === "DRAFT" ? "watch" : "risk"}`}>
                <div className="contract-template-head">
                  <strong>{normalizeContractsEntityTitle(template.name, template.id, isKoLocale)}</strong>
                  <span className="queue-history-chip">v{template.version}</span>
                </div>
                <div className="contract-template-meta">
                  <span className="queue-history-chip">{template.id}</span>
                  <span className="queue-history-chip">{categoryLabels[template.category]}</span>
                  <span className="queue-history-chip">{templateStatusLabels[template.status]}</span>
                  <span className="queue-history-chip">
                    {copy.updatedPrefix} {toDateText(template.updatedAt, runtimeLocale)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </article>
        <article id="contract-signature-readiness" className="panel panel-contract-signature-readiness">
          <h2>{copy.documentLifecycleTitle}</h2>
          <div className="contract-form-grid">
            <label>
              {copy.employeeIdLabel}
              <input
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                placeholder={copy.employeeIdPlaceholder}
              />
            </label>
            <label>
              {copy.selectedTemplateLabel}
              <input value={selectedTemplateId} disabled />
            </label>
          </div>
          <div className="contract-action-row">
            <button type="button" className="btn" onClick={createDraftDocument}>
              {copy.createDraftAction}
            </button>
          </div>
          <ul className="contract-signature-readiness-list" aria-label={copy.documentListAria}>
            {documents.map((document) => (
              <li key={document.id} className={`tone-${document.status === "SIGNED" ? "ready" : document.status === "REJECTED" ? "risk" : "watch"}`}>
                <div className="contract-signature-readiness-head">
                  <strong>{normalizeContractsEntityTitle(document.title, document.id, isKoLocale)}</strong>
                  <span className="queue-history-chip">{documentStatusLabels[document.status]}</span>
                </div>
                <p>
                  {document.id} | {copy.employeePrefix} {document.employeeId} | {copy.approvalPrefix}{" "}
                  {approvalStatusLabels[document.approvalStatus]} | {copy.expiresPrefix}{" "}
                  {toDateText(document.expiresAt, runtimeLocale)}
                </p>
                <div className="contract-action-row">
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "request")}>
                    {copy.requestApprovalAction}
                  </button>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "approve")}>
                    {copy.approveAction}
                  </button>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "reject")}>
                    {copy.rejectAction}
                  </button>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "send")}>
                    {copy.sendAction}
                  </button>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "expire")}>
                    {copy.expireAction}
                  </button>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "renew")}>
                    {copy.renewAction}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
