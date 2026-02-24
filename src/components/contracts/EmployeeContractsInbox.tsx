"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  contractApprovalStatusLabelByLocale,
  contractDocumentStatusLabelByLocale,
  employeeContractsCopyByLocale,
  toDateText,
  type ContractApprovalStatus,
  type ContractDocumentStatus
} from "@/components/contracts/copy";
import { useI18n } from "@/lib/i18n/provider";

type ContractDocument = {
  id: string;
  title: string;
  employeeId: string;
  status: ContractDocumentStatus;
  approvalStatus: ContractApprovalStatus;
  documentHash: string;
  respondedAt: string | null;
  signatureHash: string | null;
  signatureEvidenceHash: string | null;
  expiresAt: string | null;
  updatedAt: string;
  responseComment: string | null;
};

type ContractSignatureEvidenceResponse = {
  evidence: {
    documentId: string;
    employeeId: string;
    status: "SIGNED";
    respondedAt: string;
    signatureHash: string;
    signatureEvidenceHash: string;
    documentHash: string;
    format: "json" | "text";
    fileName: string;
    contentType: string;
    contentSha256: string;
    generatedAt: string;
    content: string;
  };
};

async function readJson(response: Response) {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

export default function EmployeeContractsInbox() {
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = employeeContractsCopyByLocale[locale];
  const documentStatusLabels = contractDocumentStatusLabelByLocale[locale];
  const approvalStatusLabels = contractApprovalStatusLabelByLocale[locale];

  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [signatureInput, setSignatureInput] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signatureEvidence, setSignatureEvidence] = useState<ContractSignatureEvidenceResponse["evidence"] | null>(null);

  const selected = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? documents[0] ?? null,
    [documents, selectedDocumentId]
  );

  const reload = useCallback(async () => {
    setError(null);
    const data = (await fetch("/api/contracts/documents", { cache: "no-store" }).then(readJson)) as {
      documents?: ContractDocument[];
    };
    setDocuments(data.documents ?? []);
  }, []);

  useEffect(() => {
    reload().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : copy.loadError);
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
      }).then(readJson);

      setMessage(action === "SIGN" ? copy.signedMessage : copy.rejectedMessage);
      setSignatureInput("");
      setComment("");
      setSignatureEvidence(null);
      await reload();
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : copy.respondError);
    }
  }

  function downloadEvidence(evidence: ContractSignatureEvidenceResponse["evidence"]) {
    const blob = new Blob([evidence.content], { type: evidence.contentType });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = evidence.fileName;
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
      const body = (await readJson(response)) as ContractSignatureEvidenceResponse;
      setSignatureEvidence(body.evidence);
      setMessage(`${copy.evidenceLoadedPrefix}: ${body.evidence.fileName}`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.evidenceLoadError);
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
          <ul className="contract-template-list" aria-label={copy.inboxAria}>
            {documents.map((document) => (
              <li
                key={document.id}
                className={`${selected?.id === document.id ? "is-selected " : ""}tone-${
                  document.status === "SIGNED" ? "ready" : document.status === "REJECTED" ? "risk" : "watch"
                }`}
              >
                <div className="contract-template-head">
                  <strong>{document.title}</strong>
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
        </article>

        <article className="panel panel-contract-template-detail">
          <h2>{copy.responseTitle}</h2>
          {!selected ? (
            <p className="small muted">{copy.noDocumentMessage}</p>
          ) : (
            <>
              <ul className="contract-template-detail-list" aria-label={copy.detailAria}>
                <li>
                  <span>{copy.idLabel}</span>
                  <strong>{selected.id}</strong>
                </li>
                <li>
                  <span>{copy.statusLabel}</span>
                  <strong>{documentStatusLabels[selected.status]}</strong>
                </li>
                <li>
                  <span>{copy.hashLabel}</span>
                  <strong>{selected.documentHash.slice(0, 16)}...</strong>
                </li>
                <li>
                  <span>{copy.updatedLabel}</span>
                  <strong>{toDateText(selected.updatedAt, runtimeLocale)}</strong>
                </li>
                <li>
                  <span>{copy.respondedLabel}</span>
                  <strong>{toDateText(selected.respondedAt, runtimeLocale)}</strong>
                </li>
                <li>
                  <span>{copy.signatureHashLabel}</span>
                  <strong>{selected.signatureHash ? `${selected.signatureHash.slice(0, 16)}...` : "-"}</strong>
                </li>
                <li>
                  <span>{copy.evidenceHashLabel}</span>
                  <strong>{selected.signatureEvidenceHash ? `${selected.signatureEvidenceHash.slice(0, 16)}...` : "-"}</strong>
                </li>
              </ul>

              <label>
                {copy.signatureInputLabel}
                <input value={signatureInput} onChange={(event) => setSignatureInput(event.target.value)} />
              </label>
              <label>
                {copy.commentLabel}
                <textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} />
              </label>

              <div className="contract-action-row">
                <button type="button" className="btn" onClick={() => respond("SIGN")}>
                  {copy.signAction}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => respond("REJECT")}>
                  {copy.rejectAction}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void loadSignatureEvidence("json")}
                  disabled={selected.status !== "SIGNED"}
                >
                  {copy.loadEvidenceJsonAction}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void loadSignatureEvidence("text")}
                  disabled={selected.status !== "SIGNED"}
                >
                  {copy.loadEvidenceTextAction}
                </button>
              </div>
              {signatureEvidence ? (
                <>
                  <ul className="simple-list">
                    <li>
                      <span>{copy.evidenceFileLabel}</span>
                      <strong>{signatureEvidence.fileName}</strong>
                    </li>
                    <li>
                      <span>{copy.generatedAtLabel}</span>
                      <strong>{toDateText(signatureEvidence.generatedAt, runtimeLocale)}</strong>
                    </li>
                    <li>
                      <span>{copy.contentShaLabel}</span>
                      <strong>{signatureEvidence.contentSha256.slice(0, 16)}...</strong>
                    </li>
                  </ul>
                  <div className="contract-action-row">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => downloadEvidence(signatureEvidence)}
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
