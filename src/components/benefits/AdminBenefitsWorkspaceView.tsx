import Link from "next/link";

import { resolveAdminBenefitsCopy } from "@/components/benefits/copy";
import type { BenefitCatalogItem, BenefitRequestItem } from "@/features/benefits/types";

type RequestSummary = {
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
};

type AdminBenefitsCopy = ReturnType<typeof resolveAdminBenefitsCopy>;

type AdminBenefitsWorkspaceViewProps = {
  copy: AdminBenefitsCopy;
  runtimeLocale: string;
  organizationId: string;
  actorId: string;
  accessToken: string;
  catalogName: string;
  catalogDescription: string;
  annualLimitKrw: string;
  decisionNote: string;
  catalog: BenefitCatalogItem[];
  requests: BenefitRequestItem[];
  requestSummary: RequestSummary;
  catalogStats: {
    total: number;
    active: number;
    inactive: number;
  };
  pendingLabel: string | null;
  statusMessage: string;
  logs: string[];
  onOrganizationIdChange: (value: string) => void;
  onActorIdChange: (value: string) => void;
  onAccessTokenChange: (value: string) => void;
  onCatalogNameChange: (value: string) => void;
  onCatalogDescriptionChange: (value: string) => void;
  onAnnualLimitChange: (value: string) => void;
  onDecisionNoteChange: (value: string) => void;
  onLoadWorkspace: () => void;
  onCreateCatalogItem: () => void;
  onDecideRequest: (requestId: string, decision: "APPROVED" | "REJECTED") => void;
};

export default function AdminBenefitsWorkspaceView({
  copy,
  runtimeLocale,
  organizationId,
  actorId,
  accessToken,
  catalogName,
  catalogDescription,
  annualLimitKrw,
  decisionNote,
  catalog,
  requests,
  requestSummary,
  catalogStats,
  pendingLabel,
  statusMessage,
  logs,
  onOrganizationIdChange,
  onActorIdChange,
  onAccessTokenChange,
  onCatalogNameChange,
  onCatalogDescriptionChange,
  onAnnualLimitChange,
  onDecisionNoteChange,
  onLoadWorkspace,
  onCreateCatalogItem,
  onDecideRequest
}: AdminBenefitsWorkspaceViewProps) {
  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin">
            /admin
          </Link>
          <Link className="btn btn-secondary" href="/employee/benefits">
            /employee/benefits
          </Link>
        </div>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.sessionTitle}</h2>
          <label>
            {copy.organizationIdLabel}
            <input value={organizationId} onChange={(event) => onOrganizationIdChange(event.target.value)} />
          </label>
          <label>
            {copy.actorIdLabel}
            <input value={actorId} onChange={(event) => onActorIdChange(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <textarea rows={2} value={accessToken} onChange={(event) => onAccessTokenChange(event.target.value)} />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={onLoadWorkspace}>
              {copy.refreshAction}
            </button>
          </div>
          <p className="small muted">
            {copy.statsLabel}: {catalogStats.total} (A {catalogStats.active} / I {catalogStats.inactive})
          </p>
          <p className="small muted">
            {copy.requestStatsLabel}: {requestSummary.total} (S {requestSummary.submitted} / A{" "}
            {requestSummary.approved} / R {requestSummary.rejected})
            {pendingLabel ? ` · ${pendingLabel}` : ""}
          </p>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.createCatalogTitle}</h2>
          <label>
            {copy.nameLabel}
            <input value={catalogName} onChange={(event) => onCatalogNameChange(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.descriptionLabel}
            <textarea
              rows={4}
              value={catalogDescription}
              onChange={(event) => onCatalogDescriptionChange(event.target.value)}
              maxLength={1000}
            />
          </label>
          <label>
            {copy.annualLimitLabel}
            <input
              value={annualLimitKrw}
              onChange={(event) => onAnnualLimitChange(event.target.value)}
              inputMode="numeric"
            />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={onCreateCatalogItem}>
              {copy.createCatalogAction}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.catalogTitle}</h2>
          {catalog.length === 0 ? (
            <p className="small muted">{copy.emptyCatalog}</p>
          ) : (
            <ul className="simple-list">
              {catalog.map((item) => (
                <li key={item.id}>
                  <span>
                    <strong>{item.name}</strong>
                    <br />
                    <span className="small muted">{item.description}</span>
                    <br />
                    <span className="small muted">
                      {copy.annualLimitLabel}: {item.annualLimitKrw.toLocaleString(runtimeLocale)} ·{" "}
                      {copy.statusLabel}: {copy.catalogStatus[item.status]}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.requestTitle}</h2>
          <label>
            {copy.decisionNoteLabel}
            <input value={decisionNote} onChange={(event) => onDecisionNoteChange(event.target.value)} maxLength={1000} />
          </label>
          {requests.length === 0 ? (
            <p className="small muted">{copy.emptyRequests}</p>
          ) : (
            <ul className="simple-list">
              {requests.map((request) => (
                <li key={request.id}>
                  <span>
                    <strong>{request.employeeId}</strong>
                    <br />
                    <span className="small muted">
                      {copy.amountLabel}: {request.amountKrw.toLocaleString(runtimeLocale)} · {copy.statusLabel}:{" "}
                      {copy.requestStatus[request.status]}
                    </span>
                    <br />
                    <span className="small muted">
                      {copy.reasonLabel}: {request.reason}
                    </span>
                    <br />
                    <span className="small muted">
                      {copy.requestedAtLabel}: {request.requestedAt}
                    </span>
                  </span>
                  <div className="actions" style={{ marginTop: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => onDecideRequest(request.id, "APPROVED")}
                      disabled={request.status !== "SUBMITTED"}
                    >
                      {copy.approveAction}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => onDecideRequest(request.id, "REJECTED")}
                      disabled={request.status !== "SUBMITTED"}
                    >
                      {copy.rejectAction}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.logsTitle}</h2>
          {logs.length === 0 ? (
            <p className="small muted">-</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log}>{log}</li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
