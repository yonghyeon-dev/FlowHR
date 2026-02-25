"use client";

import Link from "next/link";

import type { SupabaseSessionSnapshot } from "@/lib/client/useSupabaseSession";
import {
  formatDateOnly,
  formatDateTime,
  formatDiffKrw,
  formatKrw,
  formatMonthLabel,
  resolvePayslipRunStateLabel,
  type PayslipPageCopy,
  type PayslipSearchSortCopy
} from "@/app/employee/payslips/page-locale-helpers";
import {
  formatPercent,
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
          <div className="payslip-search-toolbar">
            <label>
              {searchSortCopy.scopeLabel}
              <select
                value={payslipSearchScope}
                onChange={(event) => setPayslipSearchScope(event.target.value as PayslipSearchScope)}
              >
                <option value="all">{searchSortCopy.scope.all}</option>
                <option value="run_id">{searchSortCopy.scope.runId}</option>
                <option value="period">{searchSortCopy.scope.period}</option>
                <option value="state">{searchSortCopy.scope.state}</option>
              </select>
            </label>
            <label className="full">
              {searchSortCopy.queryLabel}
              <input
                value={payslipSearchQuery}
                onChange={(event) => setPayslipSearchQuery(event.target.value)}
                placeholder={searchSortCopy.queryPlaceholder}
              />
            </label>
            <label>
              {searchSortCopy.sortLabel}
              <select
                value={payslipSortOption}
                onChange={(event) => setPayslipSortOption(event.target.value as PayslipSortOption)}
              >
                <option value="latest_desc">{searchSortCopy.sort.latest}</option>
                <option value="oldest_asc">{searchSortCopy.sort.oldest}</option>
                <option value="net_desc">{searchSortCopy.sort.netDesc}</option>
                <option value="gross_desc">{searchSortCopy.sort.grossDesc}</option>
              </select>
            </label>
            <div className="payslip-search-actions">
              <button type="button" className="btn btn-secondary btn-small" onClick={resetPayslipSearchControls}>
                {searchSortCopy.actions.reset}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={focusSelectedPayslipInSearch}
                disabled={!selectedRun}
              >
                {searchSortCopy.actions.focusSelected}
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={prioritizeNetPaySearchSort}>
                {searchSortCopy.actions.netPayHigh}
              </button>
            </div>
          </div>
          {filteredPayslipSearchRows.length === 0 ? (
            <p className="small muted">{searchSortCopy.empty}</p>
          ) : (
            <ul className="payslip-search-list" aria-label={searchSortCopy.listAriaLabel}>
              {filteredPayslipSearchRows.slice(0, 24).map((row) => (
                <li key={row.key}>
                  <div className="payslip-search-head">
                    <strong>{row.runId}</strong>
                    <span className={`status-pill tone-${row.state === "CONFIRMED" ? "ok" : "idle"}`}>
                      {row.stateLabel}
                    </span>
                  </div>
                  <p>{row.periodLabel}</p>
                  <p className="small muted">
                    {searchSortCopy.gross} {formatKrw(row.grossPayKrw)} / {searchSortCopy.deduction}{" "}
                    {formatKrw(row.totalDeductionsKrw)} / {searchSortCopy.net}{" "}
                    {formatKrw(row.netPayKrw)}
                  </p>
                  <div className="payslip-search-meta">
                    <span className="queue-history-chip">
                      {searchSortCopy.confirmed} {formatDateTime(row.confirmedAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setSelectedRunId(row.runId)}
                  >
                    {searchSortCopy.select}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>


        <article id="status-feedback" className="panel panel-payslip-status-feedback">
          <h2>{pageCopy.status.title}</h2>
          <div className="payslip-status-grid">
            <article className="payslip-status-card">
              <p>{pageCopy.status.latestApi}</p>
              <strong>{statusFeedbackMessage}</strong>
              <span className={`status-pill tone-${statusFeedbackTone}`}>
                {statusFeedbackTone === "ok"
                  ? pageCopy.status.tone.ok
                  : statusFeedbackTone === "fail"
                    ? pageCopy.status.tone.fail
                    : pageCopy.status.tone.idle}
              </span>
            </article>
            <article className="payslip-status-card">
              <p>{pageCopy.status.latestFailureCause}</p>
              <strong>{latestFailureMessage || pageCopy.status.noFailureHistory}</strong>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => void copyLatestFailureCause()}
                  disabled={!latestFailedLog}
                >
                  {pageCopy.status.copyFailureCause}
                </button>
              </div>
            </article>
            <article className="payslip-status-card">
              <p>{pageCopy.status.latestConfirmed}</p>
              <strong>{selectedRun ? formatDateTime(selectedRun.confirmedAt) : "-"}</strong>
              <span className="muted">
                {pageCopy.status.payslipId} {selectedRun?.id ?? "-"}
              </span>
            </article>
            <article className="payslip-status-card">
              <p>{pageCopy.status.recoveryGuide}</p>
              <strong>{statusRecoveryGuide}</strong>
              <span className="muted">
                {pageCopy.status.lastErrorAt} {latestFailedLog ? latestFailedLog.at : "-"} /{" "}
                {pageCopy.status.lastCheckedAt} {latestLog ? latestLog.at : "-"}
              </span>
            </article>
          </div>
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
          {!selectedRun || compareCandidates.length === 0 ? (
            <p className="small muted">{pageCopy.compare.empty}</p>
          ) : (
            <>
              <div className="payslip-compare-controls">
                <label>
                  {pageCopy.compare.target}
                  <select value={compareRunId} onChange={(event) => setCompareRunId(event.target.value)}>
                    {compareCandidates.map((run) => (
                      <option key={run.id} value={run.id}>
                        {formatDateOnly(run.periodStart)} ~ {formatDateOnly(run.periodEnd)} ({run.id})
                      </option>
                    ))}
                  </select>
                </label>
                <p className="small muted">
                  {pageCopy.compare.window}: {compareWindowLabel}
                </p>
              </div>
              <div className="payslip-compare-delta-grid">
                {compareMetrics.map((metric) => (
                  <article key={metric.id} className="payslip-compare-delta-card">
                    <p>
                      {metric.label} {pageCopy.compare.diffSuffix}
                    </p>
                    <strong>{formatDiffKrw(metric.diffValue)}</strong>
                    <span>{formatPercent(metric.diffRate)}</span>
                  </article>
                ))}
              </div>
              <section className="payslip-compare-insight" aria-label={compareInsightAriaLabel}>
                <h3>{compareInsightTitle}</h3>
                <div className="payslip-compare-insight-grid">
                  {compareInsightCards.map((card) => (
                    <article key={card.key} className={`payslip-compare-insight-card tone-${card.tone}`}>
                      <p>{card.title}</p>
                      <strong>{card.message}</strong>
                    </article>
                  ))}
                </div>
              </section>
              <div className="compare-table-wrap">
                <table className="compare-table" aria-label={pageCopy.compare.tableAriaLabel}>
                  <thead>
                    <tr>
                      <th>{pageCopy.compare.headers.metric}</th>
                      <th>{pageCopy.compare.headers.selected}</th>
                      <th>{pageCopy.compare.headers.compare}</th>
                      <th>{pageCopy.compare.headers.diff}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareMetrics.map((metric) => (
                      <tr key={metric.id}>
                        <th scope="row">{metric.label}</th>
                        <td>{formatKrw(metric.selectedValue)}</td>
                        <td>{formatKrw(metric.compareValue)}</td>
                        <td>{formatDiffKrw(metric.diffValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </article>


        <article className="panel panel-payslip-print">
          <h2>{pageCopy.detail.title}</h2>
          {!selectedRun ? (
            <p className="small muted">{pageCopy.detail.empty}</p>
          ) : (
            <>
              <div className="payslip-print-actions actions no-print">
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                  {pageCopy.detail.actions.printSavePdf}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => void copyPayslipFileName()}>
                  {pageCopy.detail.actions.copyPdfFileName}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => void copySelectedRunId()}>
                  {pageCopy.detail.actions.copyPayslipId}
                </button>
              </div>
              {payslipFileName ? (
                <p className="small muted no-print" style={{ marginTop: 8 }}>
                  {pageCopy.detail.recommendedFileName}: <code>{payslipFileName}</code>
                </p>
              ) : null}

              <article className="payslip-sheet" aria-label={pageCopy.detail.sheetAriaLabel}>
                <header className="payslip-sheet-header">
                  <div>
                    <p className="eyebrow">{pageCopy.detail.sheetEyebrow}</p>
                    <h3>
                      {formatMonthLabel(selectedRun.periodStart)} {pageCopy.detail.sheetTitleSuffix}
                    </h3>
                    <p className="small muted">
                      {pageCopy.detail.payPeriod} {formatDateOnly(selectedRun.periodStart)} ~{" "}
                      {formatDateOnly(selectedRun.periodEnd)}
                    </p>
                  </div>
                  <ul className="payslip-meta-list">
                    <li>
                      <span>{pageCopy.detail.employeeId}</span>
                      <strong>{selectedRun.employeeId ?? employeeId}</strong>
                    </li>
                    <li>
                      <span>{pageCopy.detail.payslipId}</span>
                      <strong>{selectedRun.id}</strong>
                    </li>
                    <li>
                      <span>{pageCopy.detail.confirmedDate}</span>
                      <strong>{formatDateOnly(selectedRun.confirmedAt)}</strong>
                    </li>
                    <li>
                      <span>{pageCopy.detail.settlementState}</span>
                      <strong>{resolvePayslipRunStateLabel(selectedRun.state, isKoLocale)}</strong>
                    </li>
                  </ul>
                </header>

                <section>
                  <h4>{pageCopy.detail.summaryTitle}</h4>
                  <div className="payslip-grid">
                    <article className="summary-card">
                      <p>{pageCopy.compare.metrics.gross}</p>
                      <strong>{formatKrw(selectedRun.grossPayKrw)}</strong>
                    </article>
                    <article className="summary-card">
                      <p>{pageCopy.compare.metrics.deduction}</p>
                      <strong>{formatKrw(selectedRun.totalDeductionsKrw)}</strong>
                    </article>
                    <article className="summary-card">
                      <p>{pageCopy.compare.metrics.net}</p>
                      <strong>{formatKrw(selectedRun.netPayKrw)}</strong>
                    </article>
                  </div>
                </section>

                <section>
                  <h4>{pageCopy.detail.paymentDeductionTitle}</h4>
                  <ul className="simple-list">
                    <li>
                      <span>{pageCopy.detail.withholdingTax}</span>
                      <strong>{formatKrw(selectedRun.withholdingTaxKrw)}</strong>
                    </li>
                    <li>
                      <span>{pageCopy.detail.socialInsurance}</span>
                      <strong>{formatKrw(selectedRun.socialInsuranceKrw)}</strong>
                    </li>
                    <li>
                      <span>{pageCopy.detail.otherDeductions}</span>
                      <strong>{formatKrw(selectedRun.otherDeductionsKrw)}</strong>
                    </li>
                  </ul>
                </section>

                <section className="payslip-explain">
                  {deductionExplainSections.map((section) => (
                    <div key={section.id} className="payslip-explain-section">
                      <h4>{section.title}</h4>
                      {section.items.length === 0 ? (
                        <p className="small muted">{pageCopy.detail.noItems}</p>
                      ) : (
                        <ul className="payslip-explain-list">
                          {section.items.map((item) => (
                            <li key={item.key}>
                              <div>
                                <strong>{item.label}</strong>
                                <p>{item.description}</p>
                              </div>
                              <strong className="payslip-explain-amount">{formatKrw(item.amountKrw)}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </section>

                {aggregate ? (
                  <section>
                    <h4>{pageCopy.detail.attendanceReference}</h4>
                    <p className="small">
                      {pageCopy.attendance.regular} {minutesToHours(aggregate.totals.regular)} /{" "}
                      {pageCopy.attendance.overtime} {minutesToHours(aggregate.totals.overtime)} /{" "}
                      {pageCopy.attendance.night} {minutesToHours(aggregate.totals.night)} /{" "}
                      {pageCopy.attendance.holiday} {minutesToHours(aggregate.totals.holiday)} ({pageCopy.attendance.payable}{" "}
                      {aggregate.counts.payable}
                      {pageCopy.attendance.payableUnit})
                    </p>
                  </section>
                ) : null}

                {selectedRun.deductionBreakdown ? (
                  <details className="details no-print" style={{ marginTop: 12 }}>
                    <summary>{pageCopy.detail.deductionBreakdownRaw}</summary>
                    <pre className="small" style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(selectedRun.deductionBreakdown, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </article>
            </>
          )}
        </article>

      </section>
    </main>
  );
}
