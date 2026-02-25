"use client";

import Link from "next/link";

import type { SupabaseSessionSnapshot } from "@/lib/client/useSupabaseSession";
import {
  formatDateTime,
  formatKrw,
  resolvePayslipRunStateLabel,
  type PayslipPageCopy,
  type PayslipSearchSortCopy
} from "@/app/employee/payslips/page-locale-helpers";
import {
  minutesToHours,
  type ApiLog,
  type AttendanceAggregateDto,
  type CompareInsightCard,
  type CompareMetric,
  type DeductionExplainSection,
  type PayrollRunDto,
  type PayslipSearchRow,
  type PayslipSearchScope,
  type PayslipSortOption
} from "@/app/employee/payslips/page-helpers";
import { PayslipDetailPanel } from "@/app/employee/payslips/page-view-detail-panel";
import {
  PayslipComparePanelContent,
  PayslipSearchSortPanelContent,
  PayslipStatusFeedbackPanelContent
} from "@/app/employee/payslips/page-view-shared-sections";

type PayslipStats = {
  count: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
};

type ApiStats = {
  total: number;
  success: number;
  fail: number;
};

type StatusFeedbackTone = "idle" | "ok" | "fail";

export type EmployeePayslipsPageViewProps = {
  pageCopy: PayslipPageCopy;
  searchSortCopy: PayslipSearchSortCopy;
  isKoLocale: boolean;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
  payslipStats: PayslipStats;
  stats: ApiStats;
  organizationId: string;
  setOrganizationId: (value: string) => void;
  employeeId: string;
  setEmployeeId: (value: string) => void;
  periodStart: string;
  setPeriodStart: (value: string) => void;
  periodEnd: string;
  setPeriodEnd: (value: string) => void;
  refreshPayslips: () => Promise<void>;
  applyCurrentMonthRange: () => void;
  applyPreviousMonthRange: () => void;
  applyLastThreeMonthsRange: () => void;
  downloadRunsCsv: () => void;
  runs: PayrollRunDto[];
  showDevTools: boolean;
  accessToken: string;
  setAccessToken: (value: string) => void;
  pendingLabel: string | null;
  supabaseSession: SupabaseSessionSnapshot | null;
  supabaseSessionError: string | null;
  clearLogs: () => void;
  logs: ApiLog[];
  aggregate: AttendanceAggregateDto | null;
  selectedRun: PayrollRunDto | null;
  setSelectedRunId: (runId: string) => void;
  payslipSearchScope: PayslipSearchScope;
  setPayslipSearchScope: (scope: PayslipSearchScope) => void;
  payslipSearchQuery: string;
  setPayslipSearchQuery: (query: string) => void;
  payslipSortOption: PayslipSortOption;
  setPayslipSortOption: (option: PayslipSortOption) => void;
  resetPayslipSearchControls: () => void;
  focusSelectedPayslipInSearch: () => void;
  prioritizeNetPaySearchSort: () => void;
  filteredPayslipSearchRows: PayslipSearchRow[];
  statusFeedbackMessage: string;
  statusFeedbackTone: StatusFeedbackTone;
  latestFailureMessage: string;
  copyLatestFailureCause: () => Promise<void>;
  latestFailedLog: ApiLog | null;
  statusRecoveryGuide: string;
  latestLog: ApiLog | null;
  compareCandidates: PayrollRunDto[];
  compareRunId: string;
  setCompareRunId: (runId: string) => void;
  compareWindowLabel: string;
  compareMetrics: CompareMetric[];
  compareInsightAriaLabel: string;
  compareInsightTitle: string;
  compareInsightCards: CompareInsightCard[];
  copyCompareSnapshot: () => Promise<void>;
  compareRun: PayrollRunDto | null;
  payslipFileName: string;
  copyPayslipFileName: () => Promise<void>;
  copySelectedRunId: () => Promise<void>;
  deductionExplainSections: DeductionExplainSection[];
};

export function EmployeePayslipsPageView({
  pageCopy,
  searchSortCopy,
  isKoLocale,
  isProductionRuntime,
  usesBearerToken,
  payslipStats,
  stats,
  organizationId,
  setOrganizationId,
  employeeId,
  setEmployeeId,
  periodStart,
  setPeriodStart,
  periodEnd,
  setPeriodEnd,
  refreshPayslips,
  applyCurrentMonthRange,
  applyPreviousMonthRange,
  applyLastThreeMonthsRange,
  downloadRunsCsv,
  runs,
  showDevTools,
  accessToken,
  setAccessToken,
  pendingLabel,
  supabaseSession,
  supabaseSessionError,
  clearLogs,
  logs,
  aggregate,
  selectedRun,
  setSelectedRunId,
  payslipSearchScope,
  setPayslipSearchScope,
  payslipSearchQuery,
  setPayslipSearchQuery,
  payslipSortOption,
  setPayslipSortOption,
  resetPayslipSearchControls,
  focusSelectedPayslipInSearch,
  prioritizeNetPaySearchSort,
  filteredPayslipSearchRows,
  statusFeedbackMessage,
  statusFeedbackTone,
  latestFailureMessage,
  copyLatestFailureCause,
  latestFailedLog,
  statusRecoveryGuide,
  latestLog,
  compareCandidates,
  compareRunId,
  setCompareRunId,
  compareWindowLabel,
  compareMetrics,
  compareInsightAriaLabel,
  compareInsightTitle,
  compareInsightCards,
  copyCompareSnapshot,
  compareRun,
  payslipFileName,
  copyPayslipFileName,
  copySelectedRunId,
  deductionExplainSections
}: EmployeePayslipsPageViewProps) {
  const selectedRunStateLabel = selectedRun
    ? resolvePayslipRunStateLabel(selectedRun.state, isKoLocale)
    : "-";
  const selectedRunNetPayText = selectedRun ? formatKrw(selectedRun.netPayKrw) : "-";
  const compareInsightClassName = "payslip-compare-insight";

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{pageCopy.pageTitle}</h1>
          <p className="page-subtitle">{pageCopy.pageSubtitle}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            {pageCopy.nav.employeePortal}
          </Link>
          <Link className="btn btn-secondary" href="/login">
            {pageCopy.nav.login}
          </Link>
          <Link className="btn btn-secondary" href="/admin">
            {pageCopy.nav.admin}
          </Link>
          <Link className="btn btn-secondary" href="/">
            {pageCopy.nav.home}
          </Link>
        </div>
      </header>

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          {pageCopy.productionNotice.prefix} <strong>production</strong>
          {pageCopy.productionNotice.suffix}{" "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>{pageCopy.kpi.count}</p>
          <strong>{payslipStats.count}</strong>
        </article>
        <article className="kpi-card">
          <p>{pageCopy.kpi.totalGross}</p>
          <strong>{formatKrw(payslipStats.totalGross)}</strong>
        </article>
        <article className="kpi-card">
          <p>{pageCopy.kpi.totalDeductions}</p>
          <strong>{formatKrw(payslipStats.totalDeductions)}</strong>
        </article>
        <article className="kpi-card">
          <p>{pageCopy.kpi.totalNet}</p>
          <strong>{formatKrw(payslipStats.totalNet)}</strong>
        </article>
        <article className="kpi-card">
          <p>{pageCopy.kpi.apiCalls}</p>
          <strong>
            {stats.total} ({pageCopy.kpi.ok} {stats.success} / {pageCopy.kpi.fail} {stats.fail})
          </strong>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>{pageCopy.filters.title}</h2>
          <div className="input-grid">
            <label>
              {pageCopy.filters.organizationIdOptional}
              <input
                value={organizationId}
                placeholder={pageCopy.filters.organizationIdPlaceholder}
                onChange={(event) => setOrganizationId(event.target.value)}
              />
            </label>
            <label>
              {pageCopy.filters.employeeId}
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
            </label>
            <label>
              {pageCopy.filters.periodStart}
              <input
                type="datetime-local"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </label>
            <label>
              {pageCopy.filters.periodEnd}
              <input
                type="datetime-local"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void refreshPayslips()}>
              {pageCopy.filters.actions.refresh}
            </button>
            <button className="btn btn-secondary" onClick={applyCurrentMonthRange}>
              {pageCopy.filters.actions.currentMonth}
            </button>
            <button className="btn btn-secondary" onClick={applyPreviousMonthRange}>
              {pageCopy.filters.actions.previousMonth}
            </button>
            <button className="btn btn-secondary" onClick={applyLastThreeMonthsRange}>
              {pageCopy.filters.actions.lastThreeMonths}
            </button>
            <button className="btn btn-secondary" onClick={downloadRunsCsv} disabled={runs.length === 0}>
              {pageCopy.filters.actions.downloadCsv}
            </button>
          </div>

          {showDevTools ? (
            <details className="details" style={{ marginTop: 12 }}>
              <summary>
                {pageCopy.devTools.summary} <small>({pageCopy.devTools.hiddenByDefault})</small>
              </summary>
              <div className="input-grid" style={{ marginTop: 12 }}>
                <label className="full">
                  {pageCopy.devTools.bearerTokenOptional}
                  <textarea
                    rows={3}
                    placeholder={pageCopy.devTools.bearerPlaceholder}
                    value={accessToken}
                    onChange={(event) => setAccessToken(event.target.value)}
                  />
                </label>
              </div>
              <p className="small">
                {pageCopy.devTools.callCount} {stats.total} ({pageCopy.kpi.ok} {stats.success} / {pageCopy.kpi.fail}{" "}
                {stats.fail}) · {pageCopy.devTools.current} {pendingLabel ?? "-"}
              </p>
              {isProductionRuntime ? (
                <p className="small muted">
                  {pageCopy.devTools.session}:{" "}
                  {supabaseSession
                    ? `${supabaseSession.email ?? supabaseSession.userId} · ${pageCopy.devTools.sessionRoleLabel}: ${supabaseSession.role ?? "-"} · ${pageCopy.devTools.sessionOrganizationLabel}: ${supabaseSession.organizationId ?? "-"} · ${pageCopy.devTools.sessionActorLabel}: ${supabaseSession.actorId ?? "-"}`
                    : pageCopy.devTools.none}{" "}
                  ({pageCopy.devTools.bearerStatusLabel} {usesBearerToken ? pageCopy.devTools.bearerOn : pageCopy.devTools.bearerOff})
                </p>
              ) : null}
              {supabaseSessionError ? (
                <p className="small" style={{ color: "var(--danger)" }}>
                  {pageCopy.devTools.sessionError}: {supabaseSessionError}
                </p>
              ) : null}
              <div className="actions">
                <button className="btn btn-secondary" onClick={clearLogs} disabled={logs.length === 0}>
                  {pageCopy.devTools.clearLogs}
                </button>
              </div>
            </details>
          ) : null}

          {aggregate ? (
            <p className="small">
              {pageCopy.attendance.summaryPrefix}: {pageCopy.attendance.regular} {minutesToHours(aggregate.totals.regular)} /{" "}
              {pageCopy.attendance.overtime} {minutesToHours(aggregate.totals.overtime)} / {pageCopy.attendance.night}{" "}
              {minutesToHours(aggregate.totals.night)} / {pageCopy.attendance.holiday}{" "}
              {minutesToHours(aggregate.totals.holiday)} ({pageCopy.attendance.payable} {aggregate.counts.payable}
              {pageCopy.attendance.payableUnit})
            </p>
          ) : (
            <p className="small muted">{pageCopy.attendance.empty}</p>
          )}
        </article>

        <article className="panel">
          <h2>{pageCopy.payslipList.title}</h2>
          {runs.length === 0 ? (
            <p className="small muted">{pageCopy.payslipList.empty}</p>
          ) : (
            <ul className="simple-list" aria-label={pageCopy.payslipList.ariaLabel}>
              {runs.map((run) => (
                <li
                  key={run.id}
                  style={{
                    borderColor: selectedRun?.id === run.id ? "var(--primary)" : "var(--line)",
                    background: selectedRun?.id === run.id ? "var(--primary-soft)" : "#fff"
                  }}
                >
                  <span>
                    <strong>{formatDateTime(run.periodStart)} ~ {formatDateTime(run.periodEnd)}</strong>{" "}
                    <span className="muted">
                      {pageCopy.payslipList.gross} {formatKrw(run.grossPayKrw)} · {pageCopy.payslipList.deduction}{" "}
                      {formatKrw(run.totalDeductionsKrw)} · {pageCopy.payslipList.net} {formatKrw(run.netPayKrw)} ·{" "}
                      {pageCopy.payslipList.confirmed} {formatDateTime(run.confirmedAt)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    {pageCopy.payslipList.select}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article id="payslip-search-sort" className="panel panel-payslip-search-sort">
          <h2>{searchSortCopy.title}</h2>
          <p className="small">{searchSortCopy.description}</p>
          <PayslipSearchSortPanelContent
            searchSortCopy={searchSortCopy}
            payslipSearchScope={payslipSearchScope}
            setPayslipSearchScope={setPayslipSearchScope}
            payslipSearchQuery={payslipSearchQuery}
            setPayslipSearchQuery={setPayslipSearchQuery}
            payslipSortOption={payslipSortOption}
            setPayslipSortOption={setPayslipSortOption}
            resetPayslipSearchControls={resetPayslipSearchControls}
            focusSelectedPayslipInSearch={focusSelectedPayslipInSearch}
            prioritizeNetPaySearchSort={prioritizeNetPaySearchSort}
            selectedRun={selectedRun}
            filteredPayslipSearchRows={filteredPayslipSearchRows}
            setSelectedRunId={setSelectedRunId}
          />
        </article>

        <article id="status-feedback" className="panel panel-payslip-status-feedback">
          <h2>{pageCopy.status.title}</h2>
          <PayslipStatusFeedbackPanelContent
            pageCopy={pageCopy}
            statusFeedbackMessage={statusFeedbackMessage}
            statusFeedbackTone={statusFeedbackTone}
            latestFailureMessage={latestFailureMessage}
            copyLatestFailureCause={copyLatestFailureCause}
            latestFailedLog={latestFailedLog}
            selectedRun={selectedRun}
            statusRecoveryGuide={statusRecoveryGuide}
            latestLog={latestLog}
          />
        </article>

        <article id="compare-view" className="panel panel-payslip-compare">
          <div className="payslip-compare-head">
            <h2>{pageCopy.compare.title}</h2>
            <div className="actions">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => void copyCompareSnapshot()}
                disabled={!selectedRun || !compareRun}
              >
                {pageCopy.compare.copySnapshot}
              </button>
            </div>
          </div>
          <PayslipComparePanelContent
            pageCopy={pageCopy}
            selectedRun={selectedRun}
            compareCandidates={compareCandidates}
            compareRunId={compareRunId}
            setCompareRunId={setCompareRunId}
            compareWindowLabel={compareWindowLabel}
            compareMetrics={compareMetrics}
            compareInsightAriaLabel={compareInsightAriaLabel}
            compareInsightTitle={compareInsightTitle}
            compareInsightCards={compareInsightCards}
            compareInsightClassName={compareInsightClassName}
          />
        </article>

        <PayslipDetailPanel
          pageCopy={pageCopy}
          selectedRun={selectedRun}
          employeeId={employeeId}
          selectedRunStateLabel={selectedRunStateLabel}
          selectedRunNetPayText={selectedRunNetPayText}
          aggregate={aggregate}
          deductionExplainSections={deductionExplainSections}
          payslipFileName={payslipFileName}
          copyPayslipFileName={copyPayslipFileName}
          copySelectedRunId={copySelectedRunId}
        />

      </section>
    </main>
  );
}
