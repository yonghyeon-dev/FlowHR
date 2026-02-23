"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ContractDocument = {
  id: string;
  title: string;
  employeeId: string;
  status: "DRAFT" | "APPROVAL_REQUESTED" | "SENT" | "SIGNED" | "REJECTED" | "EXPIRED" | "RENEWED";
  approvalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
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

function toDateText(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString();
}

export default function EmployeeContractsInbox() {
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
      setError(loadError instanceof Error ? loadError.message : "failed to load inbox");
    });
  }, [reload]);

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

      setMessage(action === "SIGN" ? "Contract signed" : "Contract rejected");
      setSignatureInput("");
      setComment("");
      setSignatureEvidence(null);
      await reload();
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : "response failed");
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
      setMessage(`Signature evidence loaded: ${body.evidence.fileName}`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "signature evidence load failed");
    }
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">My Contracts</h1>
          <p className="page-subtitle">Review pending contracts and respond with signature hash verification.</p>
        </div>
      </header>

      {error ? <p className="inline-error">{error}</p> : null}
      {message ? <p className="small">{message}</p> : null}

      <section className="panel-grid">
        <article className="panel panel-contract-template-library">
          <h2>Inbox</h2>
          <ul className="contract-template-list" aria-label="employee contract inbox">
            {documents.map((document) => (
              <li
                key={document.id}
                className={`${selected?.id === document.id ? "is-selected " : ""}tone-${
                  document.status === "SIGNED" ? "ready" : document.status === "REJECTED" ? "risk" : "watch"
                }`}
              >
                <div className="contract-template-head">
                  <strong>{document.title}</strong>
                  <span className="queue-history-chip">{document.status}</span>
                </div>
                <p>
                  approval {document.approvalStatus} | expires {toDateText(document.expiresAt)}
                </p>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => setSelectedDocumentId(document.id)}>
                  Select
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel panel-contract-template-detail">
          <h2>Response</h2>
          {!selected ? (
            <p className="small muted">No document available.</p>
          ) : (
            <>
              <ul className="contract-template-detail-list" aria-label="selected employee contract detail">
                <li>
                  <span>ID</span>
                  <strong>{selected.id}</strong>
                </li>
                <li>
                  <span>Status</span>
                  <strong>{selected.status}</strong>
                </li>
                <li>
                  <span>Hash</span>
                  <strong>{selected.documentHash.slice(0, 16)}...</strong>
                </li>
                <li>
                  <span>Updated</span>
                  <strong>{toDateText(selected.updatedAt)}</strong>
                </li>
                <li>
                  <span>Responded</span>
                  <strong>{toDateText(selected.respondedAt)}</strong>
                </li>
                <li>
                  <span>Signature Hash</span>
                  <strong>{selected.signatureHash ? `${selected.signatureHash.slice(0, 16)}...` : "-"}</strong>
                </li>
                <li>
                  <span>Evidence Hash</span>
                  <strong>{selected.signatureEvidenceHash ? `${selected.signatureEvidenceHash.slice(0, 16)}...` : "-"}</strong>
                </li>
              </ul>

              <label>
                Signature Input (required for sign)
                <input value={signatureInput} onChange={(event) => setSignatureInput(event.target.value)} />
              </label>
              <label>
                Comment
                <textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} />
              </label>

              <div className="contract-action-row">
                <button type="button" className="btn" onClick={() => respond("SIGN")}>
                  Sign
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => respond("REJECT")}>
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void loadSignatureEvidence("json")}
                  disabled={selected.status !== "SIGNED"}
                >
                  Load Evidence JSON
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void loadSignatureEvidence("text")}
                  disabled={selected.status !== "SIGNED"}
                >
                  Load Evidence Text
                </button>
              </div>
              {signatureEvidence ? (
                <>
                  <ul className="simple-list">
                    <li>
                      <span>Evidence File</span>
                      <strong>{signatureEvidence.fileName}</strong>
                    </li>
                    <li>
                      <span>Generated At</span>
                      <strong>{toDateText(signatureEvidence.generatedAt)}</strong>
                    </li>
                    <li>
                      <span>Content SHA256</span>
                      <strong>{signatureEvidence.contentSha256.slice(0, 16)}...</strong>
                    </li>
                  </ul>
                  <div className="contract-action-row">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => downloadEvidence(signatureEvidence)}
                    >
                      Download Evidence
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
