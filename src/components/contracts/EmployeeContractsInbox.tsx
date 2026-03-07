"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  contractApprovalStatusLabelByLocale,
  contractDocumentStatusLabelByLocale,
  employeeContractsCopyByLocale,
  toDateText
} from "@/components/contracts/copy";
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
import { normalizeContractsErrorMessageForRuntime, readJson, setContractsRuntimeLocale } from "@/components/contracts/http";
import { type ContractSignatureEvidenceResponse, type EmployeeContractDocument as ContractDocument } from "@/components/contracts/types";
import { resolveEmployeeContractsSourceEntry } from "@/components/contracts/employee-source-context";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

export default function EmployeeContractsInbox() {
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const { snapshot } = useSupabaseSession();
  const accessToken = snapshot?.accessToken?.trim() ?? "";
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
  const canRespondDocument = useCallback((document: ContractDocument) => canEmployeeRespondToContractDocument(document.status), []);
  const selected = useMemo(
    () => filteredDocuments.find((document) => document.id === selectedDocumentId) ?? filteredDocuments[0] ?? null,
    [filteredDocuments, selectedDocumentId]
  );
  const canRespondSelected = Boolean(selected && canRespondDocument(selected));
  const nextActionHint = useMemo(() => resolveEmployeeContractsNextActionHint(selected, copy), [copy, selected]);
  const reload = useCallback(async () => {
    setError(null);
    const data = (await fetch("/api/contracts/documents", {
      cache: "no-store",
      headers: accessToken.length > 0 ? { authorization: `Bearer ${accessToken}` } : {}
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
      setError(
        loadError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(loadError.message, copy.loadError)
          : copy.loadError
      );
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
      await fetch(`/api/contracts/documents/${selected.id}/respond`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(accessToken.length > 0 ? { authorization: `Bearer ${accessToken}` } : {})
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
  function downloadEvidence(evidence: ContractSignatureEvidenceResponse["evidence"], downloadFileName: string) {
    const blob = new Blob([evidence.content], { type: evidence.contentType });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = downloadFileName;
    window.document.body.appendChild(anchor);
    anchor.click();
    window.document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }
  async function copyEvidenceMetadata(evidence: ContractSignatureEvidenceResponse["evidence"], displayFileName: string) {
    const metadataText = [
      `${copy.evidenceFileLabel}: ${displayFileName}`,
      `${copy.generatedAtLabel}: ${toDateText(evidence.generatedAt, runtimeLocale)}`,
      `${copy.contentShaLabel}: ${evidence.contentSha256}`
    ].join("\n");
    try {
      await navigator.clipboard.writeText(metadataText);
      setError(null);
      setMessage(copy.copiedEvidenceMetadataStatus);
    } catch {
      setMessage(null);
      setError(copy.copyEvidenceMetadataError);
    }
  }
  async function loadSignatureEvidence(format: "json" | "text") {
    if (!selected) return;
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/contracts/documents/${selected.id}/signature-evidence?format=${format}`,
        {
          method: "GET",
          headers: accessToken.length > 0 ? { authorization: `Bearer ${accessToken}` } : {}
        }
      );
      const body = (await readJson(response, copy.evidenceLoadError)) as ContractSignatureEvidenceResponse;
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
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-subtitle">{copy.description}</p>
          {sourceEntry ? <p className="small muted">{sourceEntry.hint}</p> : null}
        </div>
        <div className="page-actions">
          {sourceEntry ? (
            <Link className="btn btn-secondary" href="/employee">
              {sourceEntry.returnLabel}
            </Link>
          ) : null}
        </div>
      </header>
      {error ? <p className="inline-error">{error}</p> : null}
      {message ? <p className="small">{message}</p> : null}
      <section className="panel-grid">
        <article className="panel panel-contract-template-library">
          <h2>{copy.inboxTitle}</h2>
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
          <div className="contract-action-row">
            <span className="small muted" title={`${copy.dueSoonBadgeLabel} / ${copy.overdueBadgeLabel}`}>{copy.riskQuickFilterLabel}</span>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setInboxDeadlineFilter("all")}>{copy.riskQuickAllAction}</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setInboxDeadlineFilter("action_needed")}>{copy.riskQuickActionNeededAction}</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setInboxDeadlineFilter("due_soon")}>{copy.riskQuickDueSoonAction}</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setInboxDeadlineFilter("overdue")}>{copy.riskQuickOverdueAction}</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setSearchQuery("")}>
              {copy.clearSearchAction}
            </button>
            <p className="small muted">{copy.visibleCountLabel}: {filteredDocuments.length} / {documents.length}</p>
            <p className="small muted">{copy.actionNeededCountLabel}: {actionNeededCount}</p>
            <p className="small muted">{copy.pendingResponseCountLabel}: {pendingResponseCount}</p>
            <p className="small muted">{copy.dueSoonCountLabel}: {dueSoonCount}</p>
            <p className="small muted">{copy.overdueCountLabel}: {overdueCount}</p>
          </div>
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
          onDownloadEvidence={downloadEvidence}
          onCopyEvidenceMetadata={copyEvidenceMetadata}
        />
      </section>
    </main>
  );
}
