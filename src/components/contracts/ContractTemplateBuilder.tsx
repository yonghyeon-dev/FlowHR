"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type TemplateCategory = "employment" | "amendment" | "nda" | "policy";

type ClauseDraft = {
  id: string;
  title: string;
  body: string;
  required: boolean;
};

type CreatedTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  version: number;
};

function createClauseId(index: number) {
  return `clause-${Date.now()}-${index}`;
}

function normalizeClause(value: ClauseDraft) {
  return {
    ...value,
    title: value.title.trim(),
    body: value.body.trim()
  };
}

function buildTemplateBody(clauses: ClauseDraft[]) {
  return clauses
    .map(normalizeClause)
    .filter((clause) => clause.title.length > 0 || clause.body.length > 0)
    .map((clause, index) => {
      const badge = clause.required ? "[required]" : "[optional]";
      return `## ${index + 1}. ${clause.title || "Untitled Clause"} ${badge}\n${clause.body || "-"}`;
    })
    .join("\n\n");
}

async function readJson(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(body?.error ?? `request failed (${response.status})`);
  }
  return body;
}

export default function ContractTemplateBuilder() {
  const [templateName, setTemplateName] = useState("Employment Contract v1");
  const [category, setCategory] = useState<TemplateCategory>("employment");
  const [clauses, setClauses] = useState<ClauseDraft[]>([
    {
      id: createClauseId(1),
      title: "Role and Responsibilities",
      body: "The employee agrees to perform assigned duties and follow internal policy.",
      required: true
    },
    {
      id: createClauseId(2),
      title: "Compensation",
      body: "Monthly compensation and payroll schedule follow company policy.",
      required: true
    },
    {
      id: createClauseId(3),
      title: "Confidentiality",
      body: "The employee must protect confidential company information.",
      required: true
    }
  ]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState<CreatedTemplate | null>(null);

  const templateBody = useMemo(() => buildTemplateBody(clauses), [clauses]);

  function updateClause(id: string, patch: Partial<ClauseDraft>) {
    setClauses((prev) => prev.map((clause) => (clause.id === id ? { ...clause, ...patch } : clause)));
  }

  function addClause() {
    setClauses((prev) => [
      ...prev,
      {
        id: createClauseId(prev.length + 1),
        title: "",
        body: "",
        required: true
      }
    ]);
  }

  function removeClause(id: string) {
    setClauses((prev) => prev.filter((clause) => clause.id !== id));
  }

  async function createTemplate() {
    setPending(true);
    setError(null);
    setStatusMessage(null);
    setCreatedTemplate(null);
    try {
      const payload = {
        name: templateName.trim(),
        category,
        status: "DRAFT",
        body: templateBody
      };
      const response = await fetch("/api/contracts/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = (await readJson(response)) as {
        template: CreatedTemplate;
      };
      setCreatedTemplate(body.template);
      setStatusMessage(`Template created: ${body.template.id} (v${body.template.version})`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "template create failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">Contract Template Builder</h1>
          <p className="page-subtitle">Compose clause blocks, generate a deterministic template body, and create a draft template.</p>
        </div>
      </header>
      {error ? <p className="inline-error">{error}</p> : null}
      {statusMessage ? <p className="small">{statusMessage}</p> : null}
      <section className="panel-grid">
        <article className="panel">
          <h2>Builder</h2>
          <div className="contract-form-grid">
            <label>
              Template Name
              <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
            </label>
            <label>
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value as TemplateCategory)}>
                <option value="employment">employment</option>
                <option value="amendment">amendment</option>
                <option value="nda">nda</option>
                <option value="policy">policy</option>
              </select>
            </label>
          </div>
          <div className="contract-action-row">
            <button type="button" className="btn btn-secondary" onClick={addClause} disabled={pending}>
              Add Clause
            </button>
            <button type="button" className="btn" onClick={() => void createTemplate()} disabled={pending}>
              Create Template
            </button>
          </div>
          <ul className="contract-template-list" aria-label="contract template clause builder">
            {clauses.map((clause, index) => (
              <li key={clause.id}>
                <div className="contract-template-head">
                  <strong>Clause {index + 1}</strong>
                  <span className="queue-history-chip">{clause.required ? "required" : "optional"}</span>
                </div>
                <div className="contract-form-grid">
                  <label>
                    Title
                    <input
                      value={clause.title}
                      onChange={(event) => updateClause(clause.id, { title: event.target.value })}
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={clause.required}
                      onChange={(event) => updateClause(clause.id, { required: event.target.checked })}
                    />
                    Required
                  </label>
                  <label className="contract-form-wide">
                    Body
                    <textarea
                      rows={3}
                      value={clause.body}
                      onChange={(event) => updateClause(clause.id, { body: event.target.value })}
                    />
                  </label>
                </div>
                <div className="contract-action-row">
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => removeClause(clause.id)}
                    disabled={pending || clauses.length <= 1}
                  >
                    Remove Clause
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <h2>Generated Body Preview</h2>
          <pre className="small">{templateBody || "No clause content."}</pre>
          {createdTemplate ? (
            <ul className="simple-list">
              <li><span>Template ID</span><strong>{createdTemplate.id}</strong></li>
              <li><span>Version</span><strong>{createdTemplate.version}</strong></li>
              <li><span>Status</span><strong>{createdTemplate.status}</strong></li>
              <li><span>Category</span><strong>{createdTemplate.category}</strong></li>
            </ul>
          ) : (
            <p className="small">Create a template to confirm saved metadata.</p>
          )}
          <div className="panel-actions">
            <Link href="/admin/contracts" className="btn btn-secondary">Back to Contracts</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
