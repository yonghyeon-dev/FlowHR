"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  contractApprovalStatusLabelByLocale,
  contractDocumentStatusLabelByLocale,
  employeeContractsCopyByLocale,
  toDateText
} from "@/components/contracts/copy";
import { EmployeeContractsResponsePanel } from "@/components/contracts/EmployeeContractsResponsePanel";
import { canEmployeeRespondToContractDocument } from "@/components/contracts/document-action-policy";
import {
  applyInboxDeadlineFilter,
  applyInboxStatusFilter,
  countDueSoonPending,
  countOverduePending,
  countPendingResponse,
  resolveDueSoonPendingDays,
  resolveOverduePendingDays,
  isDueSoonPendingDocument,
  isOverduePendingDocument,
  sortInboxDocumentsByRisk
} from "@/components/contracts/employee-inbox-filter-helpers";
import {
  normalizeContractsErrorMessageForRuntime,
  readJson,
  setContractsRuntimeLocale
} from "@/components/contracts/http";
import {
  normalizeContractsEntityTitle
} from "@/components/contracts/runtime-copy-helpers";
import {
  type ContractSignatureEvidenceResponse,
  type EmployeeContractDocument as ContractDocument
} from "@/components/contracts/types";
import { useI18n } from "@/lib/i18n/provider";

function isPendingResponseStatus(document: ContractDocument) {
  return canEmployeeRespondToContractDocument(document.status);
}

export default function EmployeeContractsInbox() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = employeeContractsCopyByLocale[locale];
  const documentStatusLabels = contractDocumentStatusLabelByLocale[locale];
  const approvalStatusLabels = contractApprovalStatusLabelByLocale[locale];
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inboxStatusFilter, setInboxStatusFilter] = useState<"all" | "pending_response" | "responded" | "expired">("pending_response");
  const [inboxDeadlineFilter, setInboxDeadlineFilter] = useState<"all" | "due_soon" | "overdue">("all");
  const [signatureInput, setSignatureInput] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signatureEvidence, setSignatureEvidence] = useState<ContractSignatureEvidenceResponse["evidence"] | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const statusFilteredDocuments = useMemo(() => {
    return applyInboxStatusFilter(documents, inboxStatusFilter);
  }, [documents, inboxStatusFilter]);
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
  const dueSoonCount = useMemo(() => countDueSoonPending(filteredDocuments), [filteredDocuments]);
  const overdueCount = useMemo(() => countOverduePending(filteredDocuments), [filteredDocuments]);
  const selected = useMemo(
    () => filteredDocuments.find((document) => document.id === selectedDocumentId) ?? filteredDocuments[0] ?? null,
    [filteredDocuments, selectedDocumentId]
  );
  const canRespondSelected = Boolean(selected && isPendingResponseStatus(selected));
  const nextActionHint = useMemo(() => {
    if (!selected) {
      return copy.nextActionNoDocument;
    }
    if (selected.status === "DRAFT" || selected.status === "APPROVAL_REQUESTED") {
      return copy.nextActionWaitAdminApproval;
    }
    if (selected.status === "SENT") {
      if (isOverduePendingDocument(selected)) {
        return copy.nextActionRespondOverdue;
      }
      if (isDueSoonPendingDocument(selected)) {
        return copy.nextActionRespondDueSoon;
      }
      return copy.nextActionRespondPending;
    }
    if (selected.status === "SIGNED") {
      return copy.nextActionReviewSigned;
    }
    if (selected.status === "REJECTED") {
      return copy.nextActionReviewRejected;
    }
    if (selected.status === "EXPIRED" || selected.status === "RENEWED") {
      return copy.nextActionRequestRenewal;
    }
    return copy.nextActionNoDocument;
  }, [
    copy.nextActionNoDocument,
    copy.nextActionRespondDueSoon,
    copy.nextActionRespondOverdue,
    copy.nextActionRespondPending,
    copy.nextActionRequestRenewal,
    copy.nextActionReviewRejected,
    copy.nextActionReviewSigned,
    copy.nextActionWaitAdminApproval,
    selected
  ]);
  const reload = useCallback(async () => {
    setError(null);
    const data = (await fetch("/api/contracts/documents", { cache: "no-store" }).then((response) =>
      readJson(response, copy.loadError)
    )) as { documents?: ContractDocument[] };
    setDocuments(data.documents ?? []);
  }, [copy.loadError]);
  useEffect(() => {
    setContractsRuntimeLocale(locale);
    return () => {
      setContractsRuntimeLocale(null);
    };
  }, [locale]);
  useEffect(() => {
    reload().catch((loadError) => {
      setError(
        loadError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(loadError.message, copy.loadError)
          : copy.loadError
      );
    });
  }, [copy.loadError, reload]);
  useEffect(() => {
    setSignatureEvidence(null);
  }, [selected?.id]);
  async function respond(action: "SIGN" | "REJECT") {
    if (!selected) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await fetch(`/api/contracts/documents/${selected.id}/respond`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          comment: comment.trim() || undefined,
          signatureInput: action === "SIGN" ? signatureInput : undefined,
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
  function downloadEvidence(
    evidence: ContractSignatureEvidenceResponse["evidence"],
    downloadFileName: string
  ) {
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
  async function loadSignatureEvidence(format: "json" | "text") {
    if (!selected) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/contracts/documents/${selected.id}/signature-evidence?format=${format}`,
        { method: "GET" }
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
                setInboxStatusFilter(
                  event.target.value as "all" | "pending_response" | "responded" | "expired"
                )
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
              onChange={(event) => setInboxDeadlineFilter(event.target.value as "all" | "due_soon" | "overdue")}
            >
              <option value="all">{copy.inboxDeadlineFilterAllOption}</option>
              <option value="due_soon">{copy.inboxDeadlineFilterDueSoonOption}</option>
              <option value="overdue">{copy.inboxDeadlineFilterOverdueOption}</option>
            </select>
          </label>
          <div className="contract-action-row">
            <span className="small muted">{copy.riskQuickFilterLabel}</span>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setInboxDeadlineFilter("all")}>{copy.riskQuickAllAction}</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setInboxDeadlineFilter("due_soon")}>{copy.riskQuickDueSoonAction}</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setInboxDeadlineFilter("overdue")}>{copy.riskQuickOverdueAction}</button>
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setSearchQuery("")}>
              {copy.clearSearchAction}
            </button>
            <p className="small muted">
              {copy.visibleCountLabel}: {filteredDocuments.length} / {documents.length}
            </p>
            <p className="small muted">
              {copy.pendingResponseCountLabel}: {pendingResponseCount}
            </p>
            <p className="small muted">
              {copy.dueSoonCountLabel}: {dueSoonCount}
            </p>
            <p className="small muted">
              {copy.overdueCountLabel}: {overdueCount}
            </p>
          </div>
          {selected && !canRespondSelected ? <p className="small muted">{copy.responseDisabledHint}</p> : null}
          {documents.length === 0 ? (
            <p className="small muted">{copy.noDocumentMessage}</p>
          ) : filteredDocuments.length === 0 ? (
            <p className="small muted">{copy.inboxFilteredEmpty}</p>
          ) : (
            <ul className="contract-template-list" aria-label={copy.inboxAria}>
              {filteredDocuments.map((document) => {
                const overdueDays = resolveOverduePendingDays(document);
                const dueSoonDays = resolveDueSoonPendingDays(document);
                return (
                  <li
                    key={document.id}
                    className={`${selected?.id === document.id ? "is-selected " : ""}tone-${
                      document.status === "SIGNED" ? "ready" : document.status === "REJECTED" ? "risk" : "watch"
                    }`}
                  >
                    <div className="contract-template-head">
                      <strong>{normalizeContractsEntityTitle(document.title, document.id, isKoLocale)}</strong>
                      <span className="queue-history-chip">{documentStatusLabels[document.status]}</span>
                    </div>
                    <p>
                      {copy.approvalPrefix} {approvalStatusLabels[document.approvalStatus]} | {copy.expiresPrefix}{" "}
                      {toDateText(document.expiresAt, runtimeLocale)}
                    </p>
                    {overdueDays !== null ? (
                      <p className="small" style={{ color: "var(--danger)" }}>
                        {copy.overdueBadgeLabel} (D+{overdueDays})
                      </p>
                    ) : dueSoonDays !== null ? (
                      <p className="small" style={{ color: "var(--danger)" }}>
                        {copy.dueSoonBadgeLabel} (D-{dueSoonDays})
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => setSelectedDocumentId(document.id)}
                    >
                      {copy.selectAction}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
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
        />
      </section>
    </main>
  );
}
