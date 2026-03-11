"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  contractApprovalStatusLabelByLocale,
  contractDocumentStatusLabelByLocale,
  employeeContractsCopyByLocale
} from "@/components/contracts/copy";
import { EmployeeContractsInboxHeader } from "@/components/contracts/EmployeeContractsInboxHeader";
import { EmployeeContractsInboxList } from "@/components/contracts/EmployeeContractsInboxList";
import { EmployeeContractsResponsePanel } from "@/components/contracts/EmployeeContractsResponsePanel";
import { canEmployeeRespondToContractDocument } from "@/components/contracts/document-action-policy";
import {
  applyInboxDeadlineFilter,
  applyInboxStatusFilter,
  countActionNeededPending,
  countPendingResponse,
  normalizeEmployeeInboxDeadlineFilter,
  normalizeEmployeeInboxStatusFilter,
  parseEmployeeContractsSearchQuery,
  type EmployeeInboxStatusFilter,
  type EmployeeInboxDeadlineFilter,
  isDueSoonPendingDocument,
  isOverduePendingDocument,
  sortInboxDocumentsByRisk
} from "@/components/contracts/employee-inbox-filter-helpers";
import { resolveEmployeeContractsNextActionHint } from "@/components/contracts/employee-inbox-journey-helpers";
import {
  normalizeContractsErrorMessageForRuntime,
  readJson,
  requireContractsAccessToken,
  setContractsRuntimeLocale
} from "@/components/contracts/http";
import { type ContractSignatureEvidenceResponse, type EmployeeContractDocument as ContractDocument } from "@/components/contracts/types";
import { resolveEmployeeContractsSourceEntry } from "@/components/contracts/employee-source-context";
import {
  copyContractEvidenceMetadata,
  downloadContractEvidence,
  loadContractSignatureEvidence
} from "@/components/contracts/evidence-actions";
import { EmployeeContractsInboxKpiStrip } from "@/components/contracts/EmployeeContractsInboxKpiStrip";
import { EmployeeContractsInboxQuickFilters } from "@/components/contracts/EmployeeContractsInboxQuickFilters";
import { resolveContractsWorkspaceMessageToneClass } from "@/components/contracts/workspace-visual-helpers";
import { useI18n } from "@/lib/i18n/provider";

type EmployeeContractsInboxProps = { accessToken: string };

export default function EmployeeContractsInbox({ accessToken }: EmployeeContractsInboxProps) {
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = employeeContractsCopyByLocale[locale];
  const sourceEntry = resolveEmployeeContractsSourceEntry(searchParams.get("source"), isKoLocale);
  const documentStatusLabels = contractDocumentStatusLabelByLocale[locale];
  const approvalStatusLabels = contractApprovalStatusLabelByLocale[locale];
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [searchQuery, setSearchQuery] = useState(parseEmployeeContractsSearchQuery(searchParams.get("q")));
  const [inboxStatusFilter, setInboxStatusFilter] = useState<EmployeeInboxStatusFilter>(normalizeEmployeeInboxStatusFilter(searchParams.get("status")));
  const [inboxDeadlineFilter, setInboxDeadlineFilter] = useState<EmployeeInboxDeadlineFilter>(normalizeEmployeeInboxDeadlineFilter(searchParams.get("deadline")));
  const [signatureInput, setSignatureInput] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signatureEvidence, setSignatureEvidence] = useState<ContractSignatureEvidenceResponse["evidence"] | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const statusFilteredDocuments = useMemo(() => applyInboxStatusFilter(documents, inboxStatusFilter), [documents, inboxStatusFilter]);
  const deadlineFilteredDocuments = useMemo(
    () => applyInboxDeadlineFilter(statusFilteredDocuments, inboxDeadlineFilter),
    [statusFilteredDocuments, inboxDeadlineFilter]
  );
  const filteredDocuments = useMemo(() => {
    const baseDocuments = !normalizedSearchQuery
      ? deadlineFilteredDocuments
      : deadlineFilteredDocuments.filter((document) =>
          `${document.id} ${document.title} ${document.status} ${document.approvalStatus} ${document.responseComment ?? ""}`
            .toLowerCase()
            .includes(normalizedSearchQuery)
        );
    return sortInboxDocumentsByRisk(baseDocuments);
  }, [deadlineFilteredDocuments, normalizedSearchQuery]);
  const pendingResponseCount = useMemo(() => countPendingResponse(filteredDocuments), [filteredDocuments]);
  const actionNeededCount = useMemo(() => countActionNeededPending(filteredDocuments), [filteredDocuments]);
  const dueSoonCount = useMemo(() => filteredDocuments.filter((document) => isDueSoonPendingDocument(document)).length, [filteredDocuments]);
  const overdueCount = useMemo(() => filteredDocuments.filter((document) => isOverduePendingDocument(document)).length, [filteredDocuments]);
  const messageToneClass = resolveContractsWorkspaceMessageToneClass(message, error);
  const canRespondDocument = useCallback((document: ContractDocument) => canEmployeeRespondToContractDocument(document.status), []);
  const selected = useMemo(
    () => filteredDocuments.find((document) => document.id === selectedDocumentId) ?? filteredDocuments[0] ?? null,
    [filteredDocuments, selectedDocumentId]
  );
  const canRespondSelected = Boolean(selected && canRespondDocument(selected));
  const nextActionHint = useMemo(() => resolveEmployeeContractsNextActionHint(selected, copy), [copy, selected]);
  const reload = useCallback(async () => {
    setError(null);
    const sessionToken = requireContractsAccessToken(accessToken);
    const data = (await fetch("/api/contracts/documents", {
      cache: "no-store",
      headers: { authorization: `Bearer ${sessionToken}` }
    }).then((response) => readJson(response, copy.loadError))) as { documents?: ContractDocument[] };
    setDocuments(data.documents ?? []);
  }, [accessToken, copy.loadError]);
  useEffect(() => {
    setContractsRuntimeLocale(locale);
    return () => setContractsRuntimeLocale(null);
  }, [locale]);
  useEffect(() => {
    if (!accessToken) return;
    reload().catch((loadError) => {
      setError(loadError instanceof Error ? normalizeContractsErrorMessageForRuntime(loadError.message, copy.loadError) : copy.loadError);
    });
  }, [copy.loadError, reload]);
  useEffect(() => setSignatureEvidence(null), [selected?.id]);
  async function respond(action: "SIGN" | "REJECT") {
    if (!selected) return;
    const normalizedSignatureInput = signatureInput.trim();
    setError(null);
    setMessage(null);
    if (action === "SIGN" && !normalizedSignatureInput) {
      setError(copy.signatureInputRequiredError);
      return;
    }
    try {
      const sessionToken = requireContractsAccessToken(accessToken);
      await fetch(`/api/contracts/documents/${selected.id}/respond`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          action,
          comment: comment.trim() || undefined,
          signatureInput: action === "SIGN" ? normalizedSignatureInput : undefined,
          expectedDocumentHash: selected.documentHash
        })
      }).then((response) => readJson(response, copy.respondError));
      setMessage(action === "SIGN" ? copy.signedMessage : copy.rejectedMessage);
      setSignatureInput("");
      setComment("");
      setSignatureEvidence(null);
      await reload();
    } catch (responseError) {
      setError(
        responseError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(responseError.message, copy.respondError)
          : copy.respondError
      );
    }
  }
  async function copyEvidenceMetadata(evidence: ContractSignatureEvidenceResponse["evidence"], displayFileName: string) {
    const result = await copyContractEvidenceMetadata({ copy, evidence, displayFileName, runtimeLocale });
    setError(result.error);
    setMessage(result.message);
  }
  async function loadSignatureEvidence(format: "json" | "text") {
    if (!selected) return;
    setError(null);
    setMessage(null);
    try {
      const body = await loadContractSignatureEvidence({
        accessToken,
        documentId: selected.id,
        format,
        evidenceLoadError: copy.evidenceLoadError
      });
      setSignatureEvidence(body.evidence);
      setMessage(isKoLocale ? copy.evidenceLoadedPrefix : `${copy.evidenceLoadedPrefix}: ${body.evidence.fileName}`);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(loadError.message, copy.evidenceLoadError)
          : copy.evidenceLoadError
      );
    }
  }
  return (
    <main className="saas-content workspace-shell employee-workspace-shell">
      <EmployeeContractsInboxHeader
        title={copy.title}
        description={copy.description}
        sourceHint={sourceEntry?.hint ?? null}
        returnLabel={sourceEntry?.returnLabel ?? null}
      />
      {error ? <p className="inline-error">{error}</p> : null}
      {message ? <p className={messageToneClass}>{message}</p> : null}
      <section className="panel-grid workspace-panel-grid">
        <article className="panel panel-contract-template-library workspace-section-card workspace-toolbar-card">
          <h2>{copy.inboxTitle}</h2>
          <EmployeeContractsInboxKpiStrip
            visibleCountLabel={copy.visibleCountLabel}
            actionNeededCountLabel={copy.actionNeededCountLabel}
            pendingResponseCountLabel={copy.pendingResponseCountLabel}
            dueSoonCountLabel={copy.dueSoonCountLabel}
            overdueCountLabel={copy.overdueCountLabel}
            visibleCount={filteredDocuments.length}
            actionNeededCount={actionNeededCount}
            pendingResponseCount={pendingResponseCount}
            dueSoonCount={dueSoonCount}
            overdueCount={overdueCount}
          />
          <label>
            {copy.inboxSearchLabel}
            <input
              value={searchQuery}
              placeholder={copy.inboxSearchPlaceholder}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <label>
            {copy.inboxStatusFilterLabel}
            <select
              value={inboxStatusFilter}
              onChange={(event) =>
                setInboxStatusFilter(event.target.value as EmployeeInboxStatusFilter)
              }
            >
              <option value="all">{copy.inboxStatusFilterAllOption}</option>
              <option value="pending_response">{copy.inboxStatusFilterPendingOption}</option>
              <option value="responded">{copy.inboxStatusFilterRespondedOption}</option>
              <option value="expired">{copy.inboxStatusFilterExpiredOption}</option>
            </select>
          </label>
          <label>
            {copy.inboxDeadlineFilterLabel}
            <select
              value={inboxDeadlineFilter}
              onChange={(event) => setInboxDeadlineFilter(event.target.value as EmployeeInboxDeadlineFilter)}
            >
              <option value="all">{copy.inboxDeadlineFilterAllOption}</option>
              <option value="action_needed">{copy.inboxDeadlineFilterActionNeededOption}</option>
              <option value="due_soon">{copy.inboxDeadlineFilterDueSoonOption}</option>
              <option value="overdue">{copy.inboxDeadlineFilterOverdueOption}</option>
            </select>
          </label>
          <EmployeeContractsInboxQuickFilters
            dueSoonBadgeLabel={copy.dueSoonBadgeLabel}
            overdueBadgeLabel={copy.overdueBadgeLabel}
            riskQuickFilterLabel={copy.riskQuickFilterLabel}
            riskQuickAllAction={copy.riskQuickAllAction}
            riskQuickActionNeededAction={copy.riskQuickActionNeededAction}
            riskQuickDueSoonAction={copy.riskQuickDueSoonAction}
            riskQuickOverdueAction={copy.riskQuickOverdueAction}
            clearSearchAction={copy.clearSearchAction}
            visibleCountLabel={copy.visibleCountLabel}
            actionNeededCountLabel={copy.actionNeededCountLabel}
            pendingResponseCountLabel={copy.pendingResponseCountLabel}
            dueSoonCountLabel={copy.dueSoonCountLabel}
            overdueCountLabel={copy.overdueCountLabel}
            filteredCount={filteredDocuments.length}
            totalCount={documents.length}
            actionNeededCount={actionNeededCount}
            pendingResponseCount={pendingResponseCount}
            dueSoonCount={dueSoonCount}
            overdueCount={overdueCount}
            onChangeDeadlineFilter={setInboxDeadlineFilter}
            onClearSearch={() => setSearchQuery("")}
          />
          {selected && !canRespondSelected ? <p className="small muted">{copy.responseDisabledHint}</p> : null}
          <EmployeeContractsInboxList
            documents={documents}
            filteredDocuments={filteredDocuments}
            selectedDocumentId={selected?.id ?? null}
            copy={copy}
            approvalStatusLabels={approvalStatusLabels}
            documentStatusLabels={documentStatusLabels}
            runtimeLocale={runtimeLocale}
            isKoLocale={isKoLocale}
            onSelectDocument={setSelectedDocumentId}
          />
        </article>
        <EmployeeContractsResponsePanel
          // disabled={!canRespondSelected} is enforced inside the response panel actions.
          copy={copy}
          selected={selected}
          documentStatusLabels={documentStatusLabels}
          runtimeLocale={runtimeLocale}
          isKoLocale={isKoLocale}
          nextActionHint={nextActionHint}
          signatureInput={signatureInput}
          comment={comment}
          onSignatureInputChange={setSignatureInput}
          onCommentChange={setComment}
          canRespondSelected={canRespondSelected}
          onRespond={respond}
          onLoadSignatureEvidence={loadSignatureEvidence}
          signatureEvidence={signatureEvidence}
          onDownloadEvidence={downloadContractEvidence}
          onCopyEvidenceMetadata={copyEvidenceMetadata}
        />
      </section>
    </main>
  );
}
