"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  contractApprovalStatusLabelByLocale,
  contractDocumentStatusLabelByLocale,
  employeeContractsCopyByLocale,
  toDateText
} from "@/components/contracts/copy";
import { EmployeeContractJourneyPanel } from "@/components/contracts/EmployeeContractJourneyPanel";
import {
  normalizeContractsErrorMessageForRuntime,
  readJson,
  setContractsRuntimeLocale
} from "@/components/contracts/http";
import {
  normalizeContractsEntityTitle,
  normalizeContractsEvidenceFileName
} from "@/components/contracts/runtime-copy-helpers";
import {
  type ContractSignatureEvidenceResponse,
  type EmployeeContractDocument as ContractDocument
} from "@/components/contracts/types";
import { useI18n } from "@/lib/i18n/provider";
function isPendingResponseStatus(document: ContractDocument) {
  return document.status === "SENT" || document.status === "RENEWED";
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
  const [inboxStatusFilter, setInboxStatusFilter] = useState<
    "all" | "pending_response" | "responded" | "expired"
  >("pending_response");
  const [signatureInput, setSignatureInput] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signatureEvidence, setSignatureEvidence] =
    useState<ContractSignatureEvidenceResponse["evidence"] | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const statusFilteredDocuments = useMemo(() => {
    if (inboxStatusFilter === "pending_response") {
      return documents.filter((document) => isPendingResponseStatus(document));
    }
    if (inboxStatusFilter === "responded") {
      return documents.filter(
        (document) => document.status === "SIGNED" || document.status === "REJECTED"
      );
    }
    if (inboxStatusFilter === "expired") {
      return documents.filter((document) => document.status === "EXPIRED");
    }
    return documents;
  }, [documents, inboxStatusFilter]);
  const filteredDocuments = useMemo(() => {
    if (!normalizedSearchQuery) {
      return statusFilteredDocuments;
    }
    return statusFilteredDocuments.filter((document) =>
      `${document.id} ${document.title} ${document.status} ${document.approvalStatus} ${document.responseComment ?? ""}`
        .toLowerCase()
        .includes(normalizedSearchQuery)
    );
  }, [statusFilteredDocuments, normalizedSearchQuery]);
  const pendingResponseCount = useMemo(
    () => filteredDocuments.filter((document) => isPendingResponseStatus(document)).length,
    [filteredDocuments]
  );
  const selected = useMemo(
    () => filteredDocuments.find((document) => document.id === selectedDocumentId) ?? filteredDocuments[0] ?? null,
    [filteredDocuments, selectedDocumentId]
  );
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
  function clearSearch() {
    setSearchQuery("");
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
          <div className="contract-action-row">
            <button type="button" className="btn btn-secondary btn-small" onClick={clearSearch}>
              {copy.clearSearchAction}
            </button>
            <p className="small muted">
              {copy.visibleCountLabel}: {filteredDocuments.length} / {documents.length}
            </p>
            <p className="small muted">
              {copy.pendingResponseCountLabel}: {pendingResponseCount}
            </p>
          </div>
          {documents.length === 0 ? (
            <p className="small muted">{copy.noDocumentMessage}</p>
          ) : filteredDocuments.length === 0 ? (
            <p className="small muted">{copy.inboxFilteredEmpty}</p>
          ) : (
            <ul className="contract-template-list" aria-label={copy.inboxAria}>
              {filteredDocuments.map((document) => (
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
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => setSelectedDocumentId(document.id)}>
                    {copy.selectAction}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="panel panel-contract-template-detail">
          <h2>{copy.responseTitle}</h2>
          {!selected ? (
            <p className="small muted">{copy.noDocumentMessage}</p>
          ) : (
            <>
              <ul className="contract-template-detail-list" aria-label={copy.detailAria}>
                <li><span>{copy.idLabel}</span><strong>{selected.id}</strong></li>
                <li><span>{copy.statusLabel}</span><strong>{documentStatusLabels[selected.status]}</strong></li>
                <li><span>{copy.hashLabel}</span><strong>{selected.documentHash.slice(0, 16)}...</strong></li>
                <li><span>{copy.updatedLabel}</span><strong>{toDateText(selected.updatedAt, runtimeLocale)}</strong></li>
                <li><span>{copy.respondedLabel}</span><strong>{toDateText(selected.respondedAt, runtimeLocale)}</strong></li>
                <li><span>{copy.signatureHashLabel}</span><strong>{selected.signatureHash ? `${selected.signatureHash.slice(0, 16)}...` : "-"}</strong></li>
                <li><span>{copy.evidenceHashLabel}</span><strong>{selected.signatureEvidenceHash ? `${selected.signatureEvidenceHash.slice(0, 16)}...` : "-"}</strong></li>
              </ul>
              <EmployeeContractJourneyPanel selected={selected} isKoLocale={isKoLocale} runtimeLocale={runtimeLocale} />
              <label>{copy.signatureInputLabel}<input value={signatureInput} onChange={(event) => setSignatureInput(event.target.value)} /></label>
              <label>{copy.commentLabel}<textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
              <div className="contract-action-row">
                <button type="button" className="btn" onClick={() => respond("SIGN")}>{copy.signAction}</button>
                <button type="button" className="btn btn-secondary" onClick={() => respond("REJECT")}>{copy.rejectAction}</button>
                <button type="button" className="btn btn-secondary" onClick={() => void loadSignatureEvidence("json")} disabled={selected.status !== "SIGNED"}>{copy.loadEvidenceJsonAction}</button>
                <button type="button" className="btn btn-secondary" onClick={() => void loadSignatureEvidence("text")} disabled={selected.status !== "SIGNED"}>{copy.loadEvidenceTextAction}</button>
              </div>
              {signatureEvidence ? (
                <>
                  <ul className="simple-list">
                    <li><span>{copy.evidenceFileLabel}</span><strong>{normalizeContractsEvidenceFileName(signatureEvidence.fileName, selected.id, isKoLocale)}</strong></li>
                    <li><span>{copy.generatedAtLabel}</span><strong>{toDateText(signatureEvidence.generatedAt, runtimeLocale)}</strong></li>
                    <li><span>{copy.contentShaLabel}</span><strong>{signatureEvidence.contentSha256.slice(0, 16)}...</strong></li>
                  </ul>
                  <div className="contract-action-row">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => downloadEvidence(signatureEvidence, normalizeContractsEvidenceFileName(signatureEvidence.fileName, selected.id, isKoLocale))}
                    >
                      {copy.downloadEvidenceAction}
                    </button>
                  </div>
                </>
              ) : null}
            </>
          )}
        </article>
      </section>
    </main>
  );
}
