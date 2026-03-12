"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminContractsWorkspaceHeader } from "@/components/contracts/AdminContractsWorkspaceHeader";
import { isAdminHubSource, isAdminPayrollSource } from "@/app/admin/source-context";
import {
  adminContractsCopyByLocale,
  contractApprovalStatusLabelByLocale,
  contractCategoryLabelByLocale,
  contractDocumentStatusLabelByLocale,
  contractTemplateStatusLabelByLocale,
  toDateText,
  type ContractCategory
} from "@/components/contracts/copy";
import type { ContractDocumentAction } from "@/components/contracts/types";
import { AdminContractsDocumentFilterControls } from "@/components/contracts/AdminContractsDocumentFilterControls";
import { normalizeContractsAnalyticsFocusMetric, resolveContractsAnalyticsBackHref } from "@/components/contracts/admin-contracts-analytics-context";
import { useAdminContractsWorkspaceActions } from "@/components/contracts/useAdminContractsWorkspaceActions";
import {
  parseContractBooleanFilter,
  parseContractDocumentSearchQuery,
  useAdminContractsDocumentFilters,
  normalizeContractDocumentExpirationWindow,
  normalizeContractDocumentNextStepFilter,
  normalizeContractDocumentSlaRiskFilter,
  normalizeContractDocumentStatusFilter
} from "@/components/contracts/useAdminContractsDocumentFilters";
import { setContractsRuntimeLocale } from "@/components/contracts/http";
import { resolveAdminContractDocumentNextStep, resolveAllowedContractDocumentActions, type ContractDocumentNextStepKey } from "@/components/contracts/document-action-policy";
import {
  formatContractsPublicReference,
  normalizeContractsEntityTitle
} from "@/components/contracts/runtime-copy-helpers";
import { resolveContractApprovalStatusLabel, resolveContractDocumentStatusLabel } from "@/components/contracts/status-label-helpers";
import { resolveContractsWorkspaceMessageToneClass } from "@/components/contracts/workspace-visual-helpers";
import { formatEmployeeIdForLocaleDisplay, normalizeEmployeeIdForApi } from "@/lib/i18n/employee-id-locale";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminContractsWorkspace({ accessToken }: { accessToken: string }) {
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = adminContractsCopyByLocale[locale];
  const analyticsSource = searchParams.get("source");
  const analyticsFocusMetric = searchParams.get("focusMetric");
  const analyticsFocus = normalizeContractsAnalyticsFocusMetric(searchParams.get("analyticsFocus"));
  const analyticsBackHref = resolveContractsAnalyticsBackHref(analyticsSource, analyticsFocus);
  const analyticsBackLabel = locale === "ko" ? "분석으로 돌아가기" : "Back to analytics";
  const payrollBackHref = isAdminPayrollSource(analyticsSource) ? "/admin/payroll" : "";
  const payrollFocusLabel = locale === "ko" ? "문서 후속" : "Document follow-up";
  const analyticsFocusLabel = analyticsFocusMetric === "contractSlaOverdueCount" ? copy.overdueSlaCountLabel : analyticsFocusMetric === "contractDecisionQueueCount" ? copy.decisionQueueCountLabel : copy.documentsKpiLabel;
  const categoryLabels = contractCategoryLabelByLocale[locale];
  const templateStatusLabels = contractTemplateStatusLabelByLocale[locale];
  const documentStatusLabels = contractDocumentStatusLabelByLocale[locale];
  const approvalStatusLabels = contractApprovalStatusLabelByLocale[locale];
  const [employeeId, setEmployeeId] = useState("");
  const [templateName, setTemplateName] = useState(locale === "ko" ? "근로계약 기본" : "Employment Standard");
  const [templateCategory, setTemplateCategory] = useState<ContractCategory>("employment");
  const [templateBody, setTemplateBody] = useState(locale === "ko" ? "직원은 직무, 보상, 기밀 유지 조항에 동의합니다." : "Employee agrees to role, compensation, and confidentiality clauses.");
  const normalizedEmployeeIdForApi = normalizeEmployeeIdForApi(employeeId, locale);
  const actionLabelByAction = useMemo<Record<ContractDocumentAction, string>>(() => ({
    request: copy.requestApprovalAction,
    approve: copy.approveAction,
    reject: copy.rejectAction,
    send: copy.sendAction,
    expire: copy.expireAction,
    renew: copy.renewAction
  }), [copy]);
  const nextStepLabelByKey = useMemo<Record<ContractDocumentNextStepKey, string>>(() => ({ REQUEST_APPROVAL: copy.nextStepRequestApproval, APPROVE_OR_REJECT: copy.nextStepApproveOrReject, SEND_DOCUMENT: copy.nextStepSendDocument, WAIT_EMPLOYEE_RESPONSE: copy.nextStepWaitEmployeeResponse, RENEW_DOCUMENT: copy.nextStepRenewDocument, NO_ACTION: copy.nextStepNoAction }), [copy]);
  const {
    templates,
    selectedTemplateId,
    documents,
    message,
    error,
    submitTemplate,
    createDraftDocument,
    runDocumentAction
  } = useAdminContractsWorkspaceActions({
    accessToken,
    copy,
    locale,
    templateName,
    templateCategory,
    templateBody,
    normalizedEmployeeIdForApi,
    actionLabelByAction
  });
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;
  const { documentSearchQuery, setDocumentSearchQuery, documentStatusFilter, setDocumentStatusFilter, expirationWindowDays, setExpirationWindowDays, slaRiskFilter, setSlaRiskFilter, renewalCandidateOnly, setRenewalCandidateOnly, decisionQueueOnly, setDecisionQueueOnly, nextStepFilter, setNextStepFilter, expiringSoonCount, dueSoonSlaCount, overdueSlaCount, decisionQueueCount, nextStepCounts, renewalCandidateCount, visibleDocuments, isDueSoonSlaRisk, isOverdueSlaRisk } = useAdminContractsDocumentFilters({
    documents,
    locale,
    initialFilters: {
      searchQuery: parseContractDocumentSearchQuery(searchParams.get("q")),
      statusFilter: normalizeContractDocumentStatusFilter(
        searchParams.get("status")
      ),
      expirationWindowDays: normalizeContractDocumentExpirationWindow(
        searchParams.get("expiresInDays")
      ),
      slaRiskFilter: normalizeContractDocumentSlaRiskFilter(
        searchParams.get("slaRisk")
      ),
      renewalCandidateOnly: parseContractBooleanFilter(
        searchParams.get("renewalCandidateOnly")
      ),
      decisionQueueOnly: parseContractBooleanFilter(
        searchParams.get("decisionQueueOnly")
      ),
      nextStepFilter: normalizeContractDocumentNextStepFilter(
        searchParams.get("nextStep")
      )
    }
  });
  const dashboardFocusLabel = decisionQueueOnly ? copy.decisionQueueCountLabel : documentStatusFilter === "SENT" ? copy.pendingResponseQueueLabel : slaRiskFilter === "OVERDUE" ? copy.overdueSlaCountLabel : copy.documentsKpiLabel;
  const messageToneClass = resolveContractsWorkspaceMessageToneClass(message, error);
  useEffect(() => {
    setContractsRuntimeLocale(locale);
    return () => {
      setContractsRuntimeLocale(null);
    };
  }, [locale]);
  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <AdminContractsWorkspaceHeader
        heroEyebrow={copy.heroEyebrow}
        title={copy.title}
        description={copy.description}
        analyticsSource={
          isAdminHubSource(analyticsSource)
            ? "admin-hub"
            : isAdminPayrollSource(analyticsSource)
              ? "admin-payroll"
              : analyticsSource
        }
        analyticsFocusLabel={analyticsFocusLabel}
        analyticsSourceBanner={copy.analyticsSourceBanner}
        analyticsSourceFocusLabel={copy.analyticsSourceFocusLabel}
        dashboardSourceBanner={copy.dashboardSourceBanner}
        dashboardSourceFocusLabel={copy.dashboardSourceFocusLabel}
        dashboardFocusLabel={dashboardFocusLabel}
        payrollSourceBanner={copy.payrollSourceBanner}
        payrollSourceFocusLabel={copy.payrollSourceFocusLabel}
        payrollFocusLabel={payrollFocusLabel}
        payrollBackHref={payrollBackHref}
        payrollBackLabel={copy.payrollBackLabel}
        analyticsBackHref={analyticsBackHref}
        analyticsBackLabel={analyticsBackLabel}
        openTemplateBuilderAction={copy.openTemplateBuilderAction}
        summaryKpiAria={copy.summaryKpiAria}
        templatesKpiLabel={copy.templatesKpiLabel}
        templatesCount={templates.length}
        documentsKpiLabel={copy.documentsKpiLabel}
        documentsCount={documents.length}
        pendingApprovalKpiLabel={copy.pendingApprovalKpiLabel}
        pendingApprovalCount={documents.filter((item) => item.approvalStatus === "PENDING").length}
      />
      {error ? <p className="inline-error">{error}</p> : null}
      {message ? <p className={messageToneClass}>{message}</p> : null}
      <section className="panel-grid workspace-panel-grid">
        <article id="contract-template-library" className="panel panel-contract-template-library workspace-section-card workspace-toolbar-card">
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
              <li
                key={template.id}
                className={`tone-${template.status === "ACTIVE" ? "ready" : template.status === "DRAFT" ? "watch" : "risk"}`}
              >
                <div className="contract-template-head">
                  <strong>{normalizeContractsEntityTitle(template.name, template.id, isKoLocale)}</strong>
                  <span className="queue-history-chip">v{template.version}</span>
                </div>
                <div className="contract-template-meta">
                  <span className="queue-history-chip">
                    {formatContractsPublicReference(template.id, "template", isKoLocale)}
                  </span>
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
        <article id="contract-signature-readiness" className="panel panel-contract-signature-readiness workspace-section-card workspace-note-card">
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
              <input
                value={
                  selectedTemplate
                    ? normalizeContractsEntityTitle(selectedTemplate.name, selectedTemplate.id, isKoLocale)
                    : ""
                }
                placeholder={copy.selectedTemplateLabel}
                disabled
              />
            </label>
          </div>
          <div className="contract-action-row">
            <button type="button" className="btn" onClick={createDraftDocument}>
              {copy.createDraftAction}
            </button>
          </div>
          <AdminContractsDocumentFilterControls
            copy={copy}
            searchQuery={documentSearchQuery}
            onSearchQueryChange={setDocumentSearchQuery}
            statusFilter={documentStatusFilter}
            onStatusFilterChange={setDocumentStatusFilter}
            expirationWindowDays={expirationWindowDays}
            onExpirationWindowDaysChange={setExpirationWindowDays}
            slaRiskFilter={slaRiskFilter}
            onSlaRiskFilterChange={setSlaRiskFilter}
            renewalCandidateOnly={renewalCandidateOnly}
            onRenewalCandidateOnlyChange={setRenewalCandidateOnly}
            decisionQueueOnly={decisionQueueOnly}
            onDecisionQueueOnlyChange={setDecisionQueueOnly}
            nextStepFilter={nextStepFilter}
            onNextStepFilterChange={setNextStepFilter}
            statusLabels={documentStatusLabels}
            visibleCount={visibleDocuments.length}
            totalCount={documents.length}
            expiringSoonCount={expiringSoonCount}
            dueSoonSlaCount={dueSoonSlaCount}
            overdueSlaCount={overdueSlaCount}
            decisionQueueCount={decisionQueueCount}
            nextStepCounts={nextStepCounts}
            renewalCandidateCount={renewalCandidateCount}
          />
          <ul className="contract-signature-readiness-list" aria-label={copy.documentListAria}>
            {visibleDocuments.map((document) => {
              const policyInput = { status: document.status, approvalStatus: document.approvalStatus, requiresApproval: document.requiresApproval };
              const availableActions = resolveAllowedContractDocumentActions(policyInput);
              const nextStep = resolveAdminContractDocumentNextStep(policyInput);
              return (
                <li
                  key={document.id}
                  className={`tone-${document.status === "SIGNED" ? "ready" : document.status === "REJECTED" ? "risk" : "watch"}`}
                >
                  <div className="contract-signature-readiness-head">
                    <strong>{normalizeContractsEntityTitle(document.title, document.id, isKoLocale)}</strong>
                    <span className="queue-history-chip">{resolveContractDocumentStatusLabel(document.status, documentStatusLabels, isKoLocale)}</span>
                  </div>
                  <p>
                    {formatContractsPublicReference(document.id, "document", isKoLocale)} | {copy.employeePrefix}{" "}
                    {formatEmployeeIdForLocaleDisplay(document.employeeId, locale)} | {copy.approvalPrefix}{" "}
                    {resolveContractApprovalStatusLabel(document.approvalStatus, approvalStatusLabels, isKoLocale)} | {copy.expiresPrefix}{" "}
                    {toDateText(document.expiresAt, runtimeLocale)}
                  </p>
                  <p className="small muted">{copy.nextStepLabel}: {nextStepLabelByKey[nextStep]}</p>
                  {isOverdueSlaRisk(document) ? (
                    <p className="small" style={{ color: "var(--danger)" }}>{copy.slaOverdueBadgeLabel}</p>
                  ) : isDueSoonSlaRisk(document) ? (
                    <p className="small" style={{ color: "var(--danger)" }}>{copy.slaDueSoonBadgeLabel}</p>
                  ) : null}
                  <div className="contract-action-row">
                    {availableActions.map((action) => (
                      <button key={action} type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, action)}>
                        {actionLabelByAction[action]}
                      </button>
                    ))}
                    {availableActions.length === 0 ? <span className="small muted">{copy.nextStepNoAction}</span> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </section>
    </main>
  );
}
