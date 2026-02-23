"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ContractTemplate = {
  id: string;
  organizationId: string;
  name: string;
  category: "employment" | "amendment" | "nda" | "policy";
  body: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  version: number;
  createdAt: string;
  updatedAt: string;
};

type ContractDocument = {
  id: string;
  organizationId: string;
  templateId: string;
  templateVersion: number;
  title: string;
  employeeId: string;
  status: "DRAFT" | "APPROVAL_REQUESTED" | "SENT" | "SIGNED" | "REJECTED" | "EXPIRED" | "RENEWED";
  approvalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  approvalExecutionId: string | null;
  requiresApproval: boolean;
  documentHash: string;
  expiresAt: string | null;
  updatedAt: string;
};

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

export default function AdminContractsWorkspace() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [templateName, setTemplateName] = useState("Employment Standard");
  const [templateCategory, setTemplateCategory] = useState<ContractTemplate["category"]>("employment");
  const [templateBody, setTemplateBody] = useState("Employee agrees to role, compensation, and confidentiality clauses.");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplateId = useMemo(() => templates[0]?.id ?? "", [templates]);

  const reload = useCallback(async () => {
    setError(null);
    const [templateBodyRaw, documentBodyRaw] = await Promise.all([
      fetch("/api/contracts/templates", { cache: "no-store" }).then(readJson),
      fetch("/api/contracts/documents", { cache: "no-store" }).then(readJson)
    ]);

    setTemplates((templateBodyRaw as { templates?: ContractTemplate[] }).templates ?? []);
    setDocuments((documentBodyRaw as { documents?: ContractDocument[] }).documents ?? []);
  }, []);

  useEffect(() => {
    reload().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "failed to load contracts");
    });
  }, [reload]);

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
      }).then(readJson);
      setMessage("Template created");
      await reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "template create failed");
    }
  }

  async function createDraftDocument() {
    if (!selectedTemplateId || employeeId.trim().length === 0) {
      setError("template and employeeId are required");
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
          title: `Contract ${employeeId.trim()}`,
          requiresApproval: true
        })
      }).then(readJson);
      setMessage("Draft document created");
      await reload();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "document create failed");
    }
  }

  async function runDocumentAction(documentId: string, action: "request" | "approve" | "reject" | "send" | "expire" | "renew") {
    setError(null);
    setMessage(null);

    const endpointMap: Record<typeof action, string> = {
      request: `/api/contracts/documents/${documentId}/request-approval`,
      approve: `/api/contracts/documents/${documentId}/approval`,
      reject: `/api/contracts/documents/${documentId}/approval`,
      send: `/api/contracts/documents/${documentId}/send`,
      expire: `/api/contracts/documents/${documentId}/expire`,
      renew: `/api/contracts/documents/${documentId}/renew`
    };

    const payloadMap: Record<typeof action, Record<string, unknown>> = {
      request: {},
      approve: { action: "APPROVE" },
      reject: { action: "REJECT" },
      send: {},
      expire: { reason: "manual admin expire" },
      renew: {}
    };

    try {
      await fetch(endpointMap[action], {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payloadMap[action])
      }).then(readJson);
      setMessage(`Action completed: ${action}`);
      await reload();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `action failed: ${action}`);
    }
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">E-Contract Workspace</h1>
          <p className="page-subtitle">Template CRUD, approval-gated send, employee signature, and renewal lifecycle.</p>
        </div>
      </header>

      {error ? <p className="inline-error">{error}</p> : null}
      {message ? <p className="small">{message}</p> : null}

      <section className="kpi-strip" aria-label="contract summary kpi">
        <article className="kpi-card">
          <span>Templates</span>
          <strong>{templates.length}</strong>
        </article>
        <article className="kpi-card">
          <span>Documents</span>
          <strong>{documents.length}</strong>
        </article>
        <article className="kpi-card">
          <span>Pending Approval</span>
          <strong>{documents.filter((item) => item.approvalStatus === "PENDING").length}</strong>
        </article>
      </section>

      <section className="panel-grid">
        <article id="contract-template-library" className="panel panel-contract-template-library">
          <h2>Contract Template Library</h2>
          <div className="contract-form-grid">
            <label>
              Name
              <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
            </label>
            <label>
              Category
              <select value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value as ContractTemplate["category"])}>
                <option value="employment">employment</option>
                <option value="amendment">amendment</option>
                <option value="nda">nda</option>
                <option value="policy">policy</option>
              </select>
            </label>
            <label className="contract-form-wide">
              Body
              <textarea rows={4} value={templateBody} onChange={(event) => setTemplateBody(event.target.value)} />
            </label>
          </div>
          <div className="contract-action-row">
            <button type="button" className="btn" onClick={submitTemplate}>Create Template</button>
          </div>
          <ul className="contract-template-list" aria-label="contract template list">
            {templates.map((template) => (
              <li key={template.id} className={`tone-${template.status === "ACTIVE" ? "ready" : template.status === "DRAFT" ? "watch" : "risk"}`}>
                <div className="contract-template-head">
                  <strong>{template.name}</strong>
                  <span className="queue-history-chip">v{template.version}</span>
                </div>
                <div className="contract-template-meta">
                  <span className="queue-history-chip">{template.id}</span>
                  <span className="queue-history-chip">{template.category}</span>
                  <span className="queue-history-chip">{template.status}</span>
                  <span className="queue-history-chip">updated {toDateText(template.updatedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article id="contract-signature-readiness" className="panel panel-contract-signature-readiness">
          <h2>Document Lifecycle</h2>
          <div className="contract-form-grid">
            <label>
              Employee ID
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} placeholder="EMP-0001" />
            </label>
            <label>
              Selected Template
              <input value={selectedTemplateId} disabled />
            </label>
          </div>
          <div className="contract-action-row">
            <button type="button" className="btn" onClick={createDraftDocument}>Create Draft</button>
          </div>
          <ul className="contract-signature-readiness-list" aria-label="contract document list">
            {documents.map((document) => (
              <li key={document.id} className={`tone-${document.status === "SIGNED" ? "ready" : document.status === "REJECTED" ? "risk" : "watch"}`}>
                <div className="contract-signature-readiness-head">
                  <strong>{document.title}</strong>
                  <span className="queue-history-chip">{document.status}</span>
                </div>
                <p>
                  {document.id} | employee {document.employeeId} | approval {document.approvalStatus} | expires {toDateText(document.expiresAt)}
                </p>
                <div className="contract-action-row">
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "request")}>Request Approval</button>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "approve")}>Approve</button>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "reject")}>Reject</button>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "send")}>Send</button>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "expire")}>Expire</button>
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => runDocumentAction(document.id, "renew")}>Renew</button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
