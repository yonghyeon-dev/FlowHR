import Link from "next/link";

import { resolveAdminBenefitsCopy } from "@/components/benefits/copy";
import type {
  BenefitCatalogItem,
  BenefitRequestItem,
  BenefitRequestStatus
} from "@/features/benefits/types";

type RequestSummary = {
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
};

type AdminBenefitsCopy = ReturnType<typeof resolveAdminBenefitsCopy>;
const PENDING_AGING_THRESHOLD_DAYS = 3;

function isPendingAgingRisk(request: BenefitRequestItem) {
  if (request.status !== "SUBMITTED") {
    return false;
  }
  const requestedAtMs = Date.parse(request.requestedAt);
  if (!Number.isFinite(requestedAtMs)) {
    return false;
  }
  return Date.now() - requestedAtMs >= PENDING_AGING_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

type AdminBenefitsWorkspaceViewProps = {
  copy: AdminBenefitsCopy;
  runtimeLocale: string;
  showDevTools: boolean;
  sessionOrganizationId: string;
  sessionActorId: string;
  catalogName: string;
  catalogDescription: string;
  annualLimitKrw: string;
  decisionNote: string;
  catalog: BenefitCatalogItem[];
  requests: BenefitRequestItem[];
  visibleRequests: BenefitRequestItem[];
  catalogNameById: Record<string, string>;
  requestFilter: BenefitRequestStatus | "all";
  requestRiskFilter: "all" | "over_limit";
  requestSearchQuery: string;
  requestSummary: RequestSummary;
  overLimitRequestCount: number;
  catalogStats: {
    total: number;
    active: number;
    inactive: number;
  };
  pendingLabel: string | null;
  statusMessage: string;
  logs: string[];
  onCatalogNameChange: (value: string) => void;
  onCatalogDescriptionChange: (value: string) => void;
  onAnnualLimitChange: (value: string) => void;
  onDecisionNoteChange: (value: string) => void;
  onRequestFilterChange: (value: BenefitRequestStatus | "all") => void;
  onRequestRiskFilterChange: (value: "all" | "over_limit") => void;
  onRequestSearchQueryChange: (value: string) => void;
  onClearRequestSearch: () => void;
  onLoadWorkspace: () => void;
  onCreateCatalogItem: () => void;
  onDecideRequest: (requestId: string, decision: "APPROVED" | "REJECTED") => void;
};

export default function AdminBenefitsWorkspaceView({
  copy,
  runtimeLocale,
  showDevTools,
  sessionOrganizationId,
  sessionActorId,
  catalogName,
  catalogDescription,
  annualLimitKrw,
  decisionNote,
  catalog,
  requests,
  visibleRequests,
  catalogNameById,
  requestFilter,
  requestRiskFilter,
  requestSearchQuery,
  requestSummary,
  overLimitRequestCount,
  catalogStats,
  pendingLabel,
  statusMessage,
  logs,
  onCatalogNameChange,
  onCatalogDescriptionChange,
  onAnnualLimitChange,
  onDecisionNoteChange,
  onRequestFilterChange,
  onRequestRiskFilterChange,
  onRequestSearchQueryChange,
  onClearRequestSearch,
  onLoadWorkspace,
  onCreateCatalogItem,
  onDecideRequest
}: AdminBenefitsWorkspaceViewProps) {
  const pendingAgingRiskCount = requests.filter((request) => isPendingAgingRisk(request)).length;

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
          <p className="small muted">
            {copy.organizationIdLabel}: <code>{sessionOrganizationId || "-"}</code> / {copy.actorIdLabel}:{" "}
            <code>{sessionActorId || "-"}</code>
          </p>
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
            {" · "}
            {copy.overLimitRequestSummaryLabel}: {overLimitRequestCount}
            {" · "}
            {copy.pendingAgingRiskSummaryLabel}: {pendingAgingRiskCount}
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
          <label>
            {copy.requestFilterLabel}
            <select
              value={requestFilter}
              onChange={(event) => onRequestFilterChange(event.target.value as BenefitRequestStatus | "all")}
            >
              <option value="all">{copy.requestFilter.all}</option>
              <option value="SUBMITTED">{copy.requestFilter.SUBMITTED}</option>
              <option value="APPROVED">{copy.requestFilter.APPROVED}</option>
              <option value="REJECTED">{copy.requestFilter.REJECTED}</option>
              <option value="CANCELED">{copy.requestFilter.CANCELED}</option>
            </select>
          </label>
          <label>
            {copy.requestRiskFilterLabel}
            <select
              value={requestRiskFilter}
              onChange={(event) => onRequestRiskFilterChange(event.target.value as "all" | "over_limit")}
            >
              <option value="all">{copy.requestRiskFilter.all}</option>
              <option value="over_limit">{copy.requestRiskFilter.overLimit}</option>
            </select>
          </label>
          <label>
            {copy.requestSearchLabel}
            <input
              value={requestSearchQuery}
              onChange={(event) => onRequestSearchQueryChange(event.target.value)}
              placeholder={copy.requestSearchPlaceholder}
            />
          </label>
          <div className="actions">
            <button className="btn btn-secondary btn-small" type="button" onClick={onClearRequestSearch}>
              {copy.clearSearchAction}
            </button>
          </div>
          <p className="small muted">
            {copy.filteredRequestSummaryLabel}: {visibleRequests.length} / {requests.length}
          </p>
          {requests.length === 0 ? (
            <p className="small muted">{copy.emptyRequests}</p>
          ) : visibleRequests.length === 0 ? (
            <p className="small muted">{copy.filteredEmptyRequests}</p>
          ) : (
            <ul className="simple-list">
              {visibleRequests.map((request) => {
                const annualLimitKrw = catalog.find((item) => item.id === request.benefitId)?.annualLimitKrw;
                const overLimitAmount =
                  typeof annualLimitKrw === "number" ? Math.max(0, request.amountKrw - annualLimitKrw) : 0;
                const isOverLimit = overLimitAmount > 0;
                const isAgingRisk = isPendingAgingRisk(request);
                return (
                  <li key={request.id}>
                    <span>
                      <strong>{request.employeeId}</strong>
                      <br />
                      <span className="small muted">
                        {copy.benefitLabel}: {catalogNameById[request.benefitId] ?? copy.unknownBenefitLabel}
                      </span>
                      <br />
                      <span className="small muted">
                        {copy.amountLabel}: {request.amountKrw.toLocaleString(runtimeLocale)} · {copy.statusLabel}:{" "}
                        {copy.requestStatus[request.status]}
                      </span>
                      {isOverLimit ? (
                        <>
                          <br />
                          <span className="small" style={{ color: "var(--danger)" }}>
                            {copy.overLimitBadgeLabel} · {copy.overLimitAmountLabel}:{" "}
                            {overLimitAmount.toLocaleString(runtimeLocale)}
                          </span>
                        </>
                      ) : null}
                      {isAgingRisk ? (
                        <>
                          <br />
                          <span className="small" style={{ color: "var(--danger)" }}>
                            {copy.pendingAgingRiskBadgeLabel}
                          </span>
                        </>
                      ) : null}
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
                );
              })}
            </ul>
          )}
        </article>

        {showDevTools ? (
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
        ) : null}
      </section>
    </main>
  );
}


