"use client";

import { useEffect, useRef } from "react";

import {
  formatKrw,
  resolvePayslipRunStateLabel
} from "@/app/employee/payslips/page-locale-helpers";
import { EmployeePayslipFilterPanel } from "@/app/employee/payslips/page-view-filter-panel";
import { PayslipDetailPanel } from "@/app/employee/payslips/page-view-detail-panel";
import { EmployeePayslipRunListPanel } from "@/app/employee/payslips/page-view-run-list-panel";
import type { EmployeePayslipsPageViewProps } from "@/app/employee/payslips/page-view-types";
import {
  PayslipComparePanelContent,
  PayslipSearchSortPanelContent,
  PayslipStatusFeedbackPanelContent
} from "@/app/employee/payslips/page-view-shared-sections";

export function EmployeePayslipsPageView({
  pageCopy,
  searchSortCopy,
  sourceContext,
  isKoLocale,
  isProductionRuntime,
  requiresLoginSession,
  productionSessionRequiredNotice,
  usesBearerToken,
  payslipStats,
  stats,
  employeeId,
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
  const hasAppliedPayslipSearchSortHashRef = useRef(false);
  const selectedRunKey = selectedRun?.id ?? "";
  const selectedRunStateLabel = selectedRun
    ? resolvePayslipRunStateLabel(selectedRun.state, isKoLocale)
    : "-";
  const selectedRunNetPayText = selectedRun ? formatKrw(selectedRun.netPayKrw) : "-";
  const compareInsightClassName = "payslip-compare-insight";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hash = window.location.hash.replace(/^#/, "").trim();
    if (hash !== "payslip-search-sort") {
      hasAppliedPayslipSearchSortHashRef.current = false;
      return;
    }
    if (hasAppliedPayslipSearchSortHashRef.current) {
      return;
    }
    if (runs.length > 0 && !selectedRunKey) {
      return;
    }
    window.requestAnimationFrame(() => {
      document.getElementById("payslip-search-sort")?.scrollIntoView({ behavior: "auto", block: "start" });
    });
    hasAppliedPayslipSearchSortHashRef.current = true;
  }, [runs.length, selectedRunKey]);

  return (
    <main className="saas-content workspace-shell employee-workspace-shell">
      <EmployeePayslipFilterPanel
        pageCopy={pageCopy}
        sourceContext={sourceContext}
        isKoLocale={isKoLocale}
        isProductionRuntime={isProductionRuntime}
        requiresLoginSession={requiresLoginSession}
        productionSessionRequiredNotice={productionSessionRequiredNotice}
        usesBearerToken={usesBearerToken}
        payslipStats={payslipStats}
        stats={stats}
        periodStart={periodStart}
        setPeriodStart={setPeriodStart}
        periodEnd={periodEnd}
        setPeriodEnd={setPeriodEnd}
        refreshPayslips={refreshPayslips}
        applyCurrentMonthRange={applyCurrentMonthRange}
        applyPreviousMonthRange={applyPreviousMonthRange}
        applyLastThreeMonthsRange={applyLastThreeMonthsRange}
        downloadRunsCsv={downloadRunsCsv}
        hasRuns={runs.length > 0}
        showDevTools={showDevTools}
        pendingLabel={pendingLabel}
        supabaseSession={supabaseSession}
        supabaseSessionError={supabaseSessionError}
        clearLogs={clearLogs}
        hasLogs={logs.length > 0}
        aggregate={aggregate}
        formatKrw={formatKrw}
      />

      <section className="panel-grid workspace-panel-grid">
        <EmployeePayslipRunListPanel
          pageCopy={pageCopy}
          runs={runs}
          selectedRun={selectedRun}
          setSelectedRunId={setSelectedRunId}
        />

        <article
          id="payslip-search-sort"
          className="panel workspace-section-card panel-payslip-search-sort"
        >
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

        <article
          id="status-feedback"
          className="panel workspace-section-card panel-payslip-status-feedback"
        >
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

        <article className="panel workspace-section-card workspace-note-card panel-payslip-compare">
          <div id="compare-view">
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
          </div>
        </article>

        <PayslipDetailPanel
          pageCopy={pageCopy}
          isKoLocale={isKoLocale}
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
