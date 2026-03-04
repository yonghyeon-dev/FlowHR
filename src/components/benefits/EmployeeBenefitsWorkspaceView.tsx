"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  isBenefitRequestPendingAgingRisk,
  resolveBenefitRequestPendingAgingDays,
  type EmployeeBenefitRequestRiskFilter,
  type EmployeeBenefitRequestSummary
} from "@/components/benefits/employee-benefits-helpers";
import { resolveEmployeeBenefitsSourceEntry } from "@/components/benefits/employee-source-context";
import { resolveEmployeeBenefitsCopy } from "@/components/benefits/copy";
import type { BenefitCatalogItem, BenefitRequestItem, BenefitRequestStatus } from "@/features/benefits/types";
type EmployeeBenefitsCopy = ReturnType<typeof resolveEmployeeBenefitsCopy>;
type EmployeeBenefitsWorkspaceViewProps = {
  copy: EmployeeBenefitsCopy;
  isKoLocale: boolean;
  runtimeLocale: string;
  showDevTools: boolean;
  requiresLoginSession: boolean;
  productionSessionRequiredNotice: string;
  sessionOrganizationId: string;
  sessionEmployeeId: string;
  requestableCatalog: BenefitCatalogItem[];
  requests: BenefitRequestItem[];
  filteredRequests: BenefitRequestItem[];
  requestSummary: EmployeeBenefitRequestSummary;
  requestStatusFilter: BenefitRequestStatus | "all";
  requestRiskFilter: EmployeeBenefitRequestRiskFilter;
  requestSearchQuery: string;
  pendingAgingRiskCount: number;
  selectedBenefitId: string;
  amountKrw: string;
  reason: string;
  selectedBenefitUsage: number;
  estimatedRemainingAmount: number | null;
  isProjectedOverLimit: boolean;
  pending: boolean;
  statusMessage: string;
  onRequestStatusFilterChange: (value: BenefitRequestStatus | "all") => void;
  onRequestRiskFilterChange: (value: EmployeeBenefitRequestRiskFilter) => void;
  onRequestSearchQueryChange: (value: string) => void;
  onClearRequestSearch: () => void;
  onLoadWorkspace: () => void;
  onSelectedBenefitChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmitRequest: () => void;
  onCancelRequest: (requestId: string) => void;
  resolveBenefitName: (benefitId: string) => string;
  selectedBenefit: BenefitCatalogItem | null;
};
export default function EmployeeBenefitsWorkspaceView({
  copy,
  isKoLocale,
  runtimeLocale,
  showDevTools,
  requiresLoginSession,
  productionSessionRequiredNotice,
  sessionOrganizationId,
  sessionEmployeeId,
  requestableCatalog,
  requests,
  filteredRequests,
  requestSummary,
  requestStatusFilter,
  requestRiskFilter,
  requestSearchQuery,
  pendingAgingRiskCount,
  selectedBenefitId,
  amountKrw,
  reason,
  selectedBenefitUsage,
  estimatedRemainingAmount,
  isProjectedOverLimit,
  pending,
  statusMessage,
  onRequestStatusFilterChange,
  onRequestRiskFilterChange,
  onRequestSearchQueryChange,
  onClearRequestSearch,
  onLoadWorkspace,
  onSelectedBenefitChange,
  onAmountChange,
  onReasonChange,
  onSubmitRequest,
  onCancelRequest,
  resolveBenefitName,
  selectedBenefit
}: EmployeeBenefitsWorkspaceViewProps) {
  const searchParams = useSearchParams();
  const sourceEntry = resolveEmployeeBenefitsSourceEntry(searchParams.get("source"), isKoLocale);

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          {sourceEntry ? <p className="small muted">{sourceEntry.hint}</p> : null}
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            {sourceEntry ? sourceEntry.returnLabel : "/employee"}
          </Link>
          {showDevTools ? (
            <Link className="btn btn-secondary" href="/admin/benefits">
              /admin/benefits
            </Link>
          ) : null}
        </div>
      </header>
      {requiresLoginSession ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          {productionSessionRequiredNotice} <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.sessionTitle}</h2>
          {showDevTools ? (
            <p className="small muted">
              {copy.organizationIdLabel}: <code>{sessionOrganizationId || "-"}</code> / {copy.employeeIdLabel}:{" "}
              <code>{sessionEmployeeId || "-"}</code>
            </p>
          ) : null}
          <label>
            {copy.requestFilterLabel}
            <select
              value={requestStatusFilter}
              onChange={(event) => onRequestStatusFilterChange(event.target.value as BenefitRequestStatus | "all")}
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
              onChange={(event) => onRequestRiskFilterChange(event.target.value as EmployeeBenefitRequestRiskFilter)}
            >
              <option value="all">{copy.requestRiskFilter.all}</option>
              <option value="pending_3d">{copy.requestRiskFilter.pending3d}</option>
            </select>
          </label>
          <label>
            {copy.requestSearchLabel}
            <input
              value={requestSearchQuery}
              placeholder={copy.requestSearchPlaceholder}
              onChange={(event) => onRequestSearchQueryChange(event.target.value)}
            />
          </label>
          <div className="actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={onLoadWorkspace}
              disabled={pending || requiresLoginSession}
            >
              {copy.refreshAction}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onClearRequestSearch}
              disabled={pending || requiresLoginSession}
            >
              {copy.clearSearchAction}
            </button>
          </div>
          <p className="small muted">
            {copy.requestSummaryLabel}: {requestSummary.total} (S {requestSummary.submitted} / A {requestSummary.approved} / R {requestSummary.rejected} / C {requestSummary.canceled})
            {" · "}
            {copy.filteredRequestSummaryLabel}: {filteredRequests.length}
            {" · "}
            {copy.pendingAgingRiskSummaryLabel}: {pendingAgingRiskCount}
          </p>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.submitTitle}</h2>
          <label>
            {copy.benefitLabel}
            <select value={selectedBenefitId} onChange={(event) => onSelectedBenefitChange(event.target.value)}>
              <option value="">-</option>
              {requestableCatalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.amountLabel}
            <input value={amountKrw} onChange={(event) => onAmountChange(event.target.value)} inputMode="numeric" />
          </label>
          <label>
            {copy.reasonLabel}
            <textarea rows={4} value={reason} onChange={(event) => onReasonChange(event.target.value)} maxLength={1000} />
          </label>
          {selectedBenefit ? (
            <>
              <p className="small muted">
                {copy.annualUsageSummaryLabel}: {selectedBenefitUsage.toLocaleString(runtimeLocale)} /{" "}
                {selectedBenefit.annualLimitKrw.toLocaleString(runtimeLocale)}
              </p>
              <p className="small muted">
                {copy.estimatedRemainingLabel}: {(estimatedRemainingAmount ?? 0).toLocaleString(runtimeLocale)}
              </p>
              {isProjectedOverLimit ? (
                <p className="small" style={{ color: "var(--danger)" }}>
                  {copy.overLimitWarningLabel}
                </p>
              ) : null}
            </>
          ) : null}
          <div className="actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={onSubmitRequest}
              disabled={pending || requiresLoginSession}
            >
              {copy.submitAction}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.catalogTitle}</h2>
          {requestableCatalog.length === 0 ? (
            <p className="small muted">{copy.emptyCatalog}</p>
          ) : (
            <ul className="simple-list">
              {requestableCatalog.map((item) => (
                <li key={item.id}>
                  <span>
                    <strong>{item.name}</strong>
                    <br />
                    <span className="small muted">{item.description}</span>
                    <br />
                    <span className="small muted">
                      {copy.annualLimitLabel}: {item.annualLimitKrw.toLocaleString(runtimeLocale)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.requestTitle}</h2>
          {requests.length === 0 ? (
            <p className="small muted">{copy.emptyRequests}</p>
          ) : filteredRequests.length === 0 ? (
            <p className="small muted">{copy.filteredEmptyRequests}</p>
          ) : (
            <ul className="simple-list">
              {filteredRequests.map((item) => {
                const benefitName = resolveBenefitName(item.benefitId);
                const pendingAgingDays = resolveBenefitRequestPendingAgingDays(item);
                const isPendingAgingRisk = isBenefitRequestPendingAgingRisk(item);
                return (
                  <li key={item.id}>
                    <span>
                      <strong>{benefitName}</strong>
                      <br />
                      <span className="small muted">
                        {copy.amountLabel}: {item.amountKrw.toLocaleString(runtimeLocale)} · {copy.statusLabel}: {copy.requestStatus[item.status]}
                      </span>
                      {typeof pendingAgingDays === "number" ? (
                        <>
                          <br />
                          <span className="small muted">
                            {copy.pendingAgingLabel}: D+{pendingAgingDays}
                          </span>
                        </>
                      ) : null}
                      {isPendingAgingRisk ? (
                        <>
                          <br />
                          <span className="small" style={{ color: "var(--danger)" }}>
                            {copy.pendingAgingRiskBadgeLabel}
                          </span>
                        </>
                      ) : null}
                      <br />
                      <span className="small muted">
                        {copy.reasonLabel}: {item.reason}
                      </span>
                      <br />
                      <span className="small muted">
                        {copy.requestedAtLabel}: {item.requestedAt}
                      </span>
                      {item.status === "SUBMITTED" ? (
                        <>
                          <br />
                          <button
                            className="btn btn-secondary btn-small"
                            type="button"
                            disabled={pending || requiresLoginSession}
                            onClick={() => onCancelRequest(item.id)}
                          >
                            {copy.cancelAction}
                          </button>
                        </>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
