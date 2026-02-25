import {
  formatDateOnly,
  formatDateTime,
  formatDiffKrw,
  formatKrw,
  type PayslipPageCopy,
  type PayslipSearchSortCopy
} from "@/app/employee/payslips/page-locale-helpers";
import {
  formatPercent,
  type ApiLog,
  type CompareInsightCard,
  type CompareMetric,
  type PayrollRunDto,
  type PayslipSearchRow,
  type PayslipSearchScope,
  type PayslipSortOption
} from "@/app/employee/payslips/page-helpers";
type PayslipSearchSortPanelContentProps = {
  searchSortCopy: PayslipSearchSortCopy;
  payslipSearchScope: PayslipSearchScope;
  setPayslipSearchScope: (scope: PayslipSearchScope) => void;
  payslipSearchQuery: string;
  setPayslipSearchQuery: (query: string) => void;
  payslipSortOption: PayslipSortOption;
  setPayslipSortOption: (option: PayslipSortOption) => void;
  resetPayslipSearchControls: () => void;
  focusSelectedPayslipInSearch: () => void;
  prioritizeNetPaySearchSort: () => void;
  selectedRun: PayrollRunDto | null;
  filteredPayslipSearchRows: PayslipSearchRow[];
  setSelectedRunId: (runId: string) => void;
};
export function PayslipSearchSortPanelContent({
  searchSortCopy,
  payslipSearchScope,
  setPayslipSearchScope,
  payslipSearchQuery,
  setPayslipSearchQuery,
  payslipSortOption,
  setPayslipSortOption,
  resetPayslipSearchControls,
  focusSelectedPayslipInSearch,
  prioritizeNetPaySearchSort,
  selectedRun,
  filteredPayslipSearchRows,
  setSelectedRunId
}: PayslipSearchSortPanelContentProps) {
  return (
    <>
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
                {formatKrw(row.totalDeductionsKrw)} / {searchSortCopy.net} {formatKrw(row.netPayKrw)}
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
    </>
  );
}
type PayslipStatusFeedbackPanelContentProps = {
  pageCopy: PayslipPageCopy;
  statusFeedbackMessage: string;
  statusFeedbackTone: "idle" | "ok" | "fail";
  latestFailureMessage: string;
  copyLatestFailureCause: () => Promise<void>;
  latestFailedLog: ApiLog | null;
  selectedRun: PayrollRunDto | null;
  statusRecoveryGuide: string;
  latestLog: ApiLog | null;
};
export function PayslipStatusFeedbackPanelContent({
  pageCopy,
  statusFeedbackMessage,
  statusFeedbackTone,
  latestFailureMessage,
  copyLatestFailureCause,
  latestFailedLog,
  selectedRun,
  statusRecoveryGuide,
  latestLog
}: PayslipStatusFeedbackPanelContentProps) {
  return (
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
  );
}
type PayslipComparePanelContentProps = {
  pageCopy: PayslipPageCopy;
  selectedRun: PayrollRunDto | null;
  compareCandidates: PayrollRunDto[];
  compareRunId: string;
  setCompareRunId: (runId: string) => void;
  compareWindowLabel: string;
  compareMetrics: CompareMetric[];
  compareInsightAriaLabel: string;
  compareInsightTitle: string;
  compareInsightCards: CompareInsightCard[];
  compareInsightClassName: string;
};
export function PayslipComparePanelContent({
  pageCopy,
  selectedRun,
  compareCandidates,
  compareRunId,
  setCompareRunId,
  compareWindowLabel,
  compareMetrics,
  compareInsightAriaLabel,
  compareInsightTitle,
  compareInsightCards,
  compareInsightClassName
}: PayslipComparePanelContentProps) {
  if (!selectedRun || compareCandidates.length === 0) {
    return <p className="small muted">{pageCopy.compare.empty}</p>;
  }
  return (
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
      <section className={compareInsightClassName} aria-label={compareInsightAriaLabel}>
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
  );
}
