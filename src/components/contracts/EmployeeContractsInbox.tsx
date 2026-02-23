"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ContractDocument = {
  id: string;
  title: string;
  employeeId: string;
  status: "DRAFT" | "APPROVAL_REQUESTED" | "SENT" | "SIGNED" | "REJECTED" | "EXPIRED" | "RENEWED";
  approvalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  documentHash: string;
  expiresAt: string | null;
  updatedAt: string;
  responseComment: string | null;
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
      await reload();
    } catch (responseError) {
      setError(responseError instanceof Error ? responseError.message : "response failed");
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
              </div>
            </>
          )}
        </article>
      </section>
    </main>
  );
}
