"use client";

import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import {
  type DeductionDescriptionMap,
  extractErrorMessage,
  normalizeRuntimeDiagnosticMessage,
  resolveDeductionDescriptionMap,
  resolvePayslipPageCopy,
  resolvePayslipSearchSortCopy,
  setPayslipRuntimeLocale
} from "@/app/employee/payslips/page-locale-helpers";

import {
  escapeCsv,
  firstDayOfMonthLocal,
  isDevToolsEnabled,
  lastDayOfMonthLocal,
  lastThreeMonthsRangeLocal,
  previousMonthRangeLocal,
  type AttendanceAggregateDto,
  type PayrollRunDto,
  type PayslipSearchScope,
  type PayslipSortOption
} from "@/app/employee/payslips/page-helpers";
import { usePayslipApi } from "@/app/employee/payslips/use-payslip-api";
import { usePayslipDerivedState } from "@/app/employee/payslips/use-payslip-derived-state";
import { EmployeePayslipsPageView } from "@/app/employee/payslips/page-view";
export default function EmployeePayslipsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");

  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());

  const [runs, setRuns] = useState<PayrollRunDto[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [compareRunId, setCompareRunId] = useState("");
  const [payslipSearchScope, setPayslipSearchScope] = useState<PayslipSearchScope>("all");
  const [payslipSearchQuery, setPayslipSearchQuery] = useState("");
  const [payslipSortOption, setPayslipSortOption] = useState<PayslipSortOption>("latest_desc");
  const [aggregate, setAggregate] = useState<AttendanceAggregateDto | null>(null);

  const showDevTools = isDevToolsEnabled();
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";

  const searchSortCopy = useMemo(() => resolvePayslipSearchSortCopy(isKoLocale), [isKoLocale]);
  const pageCopy = useMemo(() => resolvePayslipPageCopy(isKoLocale), [isKoLocale]);

  useEffect(() => {
    setPayslipRuntimeLocale(runtimeLocale);
    return () => {
      setPayslipRuntimeLocale(null);
    };
  }, [runtimeLocale]);

  const localizedSupabaseSessionError = useMemo(() => {
    if (!supabaseSessionError) {
      return null;
    }
    return normalizeRuntimeDiagnosticMessage(
      supabaseSessionError,
      isKoLocale,
      "인증 세션 상태를 확인하지 못했습니다."
    );
  }, [isKoLocale, supabaseSessionError]);
  const deductionDescriptionMap = useMemo<DeductionDescriptionMap>(
    () => resolveDeductionDescriptionMap(isKoLocale),
    [isKoLocale]
  );

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";

  const usesBearerToken = bearerToken.trim().length > 0;
  const { logs, pendingLabel, refreshPayslips, appendClientLog, clearLogs } = usePayslipApi({
    pageCopy,
    runtimeLocale,
    usesBearerToken,
    bearerToken,
    employeeId,
    organizationId,
    periodStart,
    periodEnd,
    setRuns,
    setAggregate
  });
  const {
    compareCandidates,
    compareInsightAriaLabel,
    compareInsightCards,
    compareInsightTitle,
    compareMetrics,
    compareRun,
    compareWindowLabel,
    deductionExplainSections,
    filteredPayslipSearchRows,
    latestFailedLog,
    latestFailureMessage,
    latestLog,
    payslipFileName,
    payslipStats,
    selectedRun,
    stats,
    statusFeedbackMessage,
    statusFeedbackTone,
    statusRecoveryGuide
  } = usePayslipDerivedState({
    compareRunId,
    deductionDescriptionMap,
    employeeId,
    isKoLocale,
    logs,
    pageCopy,
    payslipSearchQuery,
    payslipSearchScope,
    payslipSortOption,
    runs,
    selectedRunId
  });

  useEffect(() => {
    if (runs.length === 0) {
      setSelectedRunId("");
      return;
    }
    if (!runs.some((run) => run.id === selectedRunId)) {
      setSelectedRunId(runs[0].id);
    }
  }, [runs, selectedRunId]);

  useEffect(() => {
    if (compareCandidates.length === 0) {
      setCompareRunId("");
      return;
    }
    if (!compareCandidates.some((run) => run.id === compareRunId)) {
      setCompareRunId(compareCandidates[0].id);
    }
  }, [compareCandidates, compareRunId]);


  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0 && !organizationId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const actorId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "").trim();
    if (actorId.length > 0 && employeeId.trim() !== actorId) {
      setEmployeeId(actorId);
    }
  }, [employeeId, isProductionRuntime, setEmployeeId, supabaseSession?.actorId, supabaseSession?.userId]);

  function applyCurrentMonthRange() {
    setPeriodStart(firstDayOfMonthLocal());
    setPeriodEnd(lastDayOfMonthLocal());
  }

  function applyPreviousMonthRange() {
    const range = previousMonthRangeLocal();
    setPeriodStart(range.start);
    setPeriodEnd(range.end);
  }

  function applyLastThreeMonthsRange() {
    const range = lastThreeMonthsRangeLocal();
    setPeriodStart(range.start);
    setPeriodEnd(range.end);
  }

  async function copySelectedRunId() {
    if (!selectedRun) {
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedRun.id);
      appendClientLog(pageCopy.logs.copyPayslipId, true, 200, { runId: selectedRun.id });
    } catch (error) {
      appendClientLog(pageCopy.logs.copyPayslipId, false, 500, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async function copyPayslipFileName() {
    if (!payslipFileName) {
      return;
    }
    try {
      await navigator.clipboard.writeText(payslipFileName);
      appendClientLog(pageCopy.logs.copyPdfFileName, true, 200, { fileName: payslipFileName });
    } catch (error) {
      appendClientLog(pageCopy.logs.copyPdfFileName, false, 500, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async function copyLatestFailureCause() {
    if (!latestFailedLog) {
      return;
    }
    const message = extractErrorMessage(latestFailedLog.body);
    try {
      await navigator.clipboard.writeText(message);
      appendClientLog(pageCopy.logs.copyFailureCause, true, 200, { message });
    } catch (error) {
      appendClientLog(pageCopy.logs.copyFailureCause, false, 500, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }


  async function copyCompareSnapshot() {
    if (!selectedRun || !compareRun) {
      return;
    }

    const payload = {
      selectedRunId: selectedRun.id,
      compareRunId: compareRun.id,
      window: compareWindowLabel,
      metrics: compareMetrics.map((metric) => ({
        id: metric.id,
        diffValue: metric.diffValue,
        diffRate: metric.diffRate
      })),
      insights: compareInsightCards.map((card) => ({
        title: card.title,
        message: card.message
      }))
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      appendClientLog(pageCopy.logs.copyCompareSnapshot, true, 200, payload);
    } catch (error) {
      appendClientLog(pageCopy.logs.copyCompareSnapshot, false, 500, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  function downloadRunsCsv() {
    if (runs.length === 0) {
      return;
    }
    const header = [
      "run_id",
      "employee_id",
      "period_start",
      "period_end",
      "gross_pay_krw",
      "withholding_tax_krw",
      "social_insurance_krw",
      "other_deductions_krw",
      "total_deductions_krw",
      "net_pay_krw",
      "confirmed_at"
    ];

    const rows = runs.map((run) => [
      run.id,
      run.employeeId ?? "",
      run.periodStart,
      run.periodEnd,
      String(run.grossPayKrw),
      String(run.withholdingTaxKrw ?? 0),
      String(run.socialInsuranceKrw ?? 0),
      String(run.otherDeductionsKrw ?? 0),
      String(run.totalDeductionsKrw ?? 0),
      String(run.netPayKrw ?? 0),
      run.confirmedAt ?? ""
    ]);

    const csv = [header, ...rows].map((cols) => cols.map((col) => escapeCsv(col)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const csvPrefix = isKoLocale ? "플로우HR-명세서" : "flowhr-payslips";
    const employeeLabel = (employeeId || (isKoLocale ? "직원" : "employee")).replace(/\s+/g, "-");
    anchor.download = `${csvPrefix}-${employeeLabel}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function resetPayslipSearchControls() {
    setPayslipSearchScope("all");
    setPayslipSearchQuery("");
    setPayslipSortOption("latest_desc");
  }

  function focusSelectedPayslipInSearch() {
    if (!selectedRun) {
      return;
    }
    setPayslipSearchScope("run_id");
    setPayslipSearchQuery(selectedRun.id);
    setPayslipSortOption("latest_desc");
  }

  function prioritizeNetPaySearchSort() {
    setPayslipSortOption("net_desc");
  }


  return (
    <EmployeePayslipsPageView
      pageCopy={pageCopy}
      searchSortCopy={searchSortCopy}
      isKoLocale={isKoLocale}
      isProductionRuntime={isProductionRuntime}
      usesBearerToken={usesBearerToken}
      payslipStats={payslipStats}
      stats={stats}
      organizationId={organizationId}
      setOrganizationId={setOrganizationId}
      employeeId={employeeId}
      setEmployeeId={setEmployeeId}
      periodStart={periodStart}
      setPeriodStart={setPeriodStart}
      periodEnd={periodEnd}
      setPeriodEnd={setPeriodEnd}
      refreshPayslips={refreshPayslips}
      applyCurrentMonthRange={applyCurrentMonthRange}
      applyPreviousMonthRange={applyPreviousMonthRange}
      applyLastThreeMonthsRange={applyLastThreeMonthsRange}
      downloadRunsCsv={downloadRunsCsv}
      runs={runs}
      showDevTools={showDevTools}
      accessToken={accessToken}
      setAccessToken={setAccessToken}
      pendingLabel={pendingLabel}
      supabaseSession={supabaseSession}
      supabaseSessionError={localizedSupabaseSessionError}
      clearLogs={clearLogs}
      logs={logs}
      aggregate={aggregate}
      selectedRun={selectedRun}
      setSelectedRunId={setSelectedRunId}
      payslipSearchScope={payslipSearchScope}
      setPayslipSearchScope={setPayslipSearchScope}
      payslipSearchQuery={payslipSearchQuery}
      setPayslipSearchQuery={setPayslipSearchQuery}
      payslipSortOption={payslipSortOption}
      setPayslipSortOption={setPayslipSortOption}
      resetPayslipSearchControls={resetPayslipSearchControls}
      focusSelectedPayslipInSearch={focusSelectedPayslipInSearch}
      prioritizeNetPaySearchSort={prioritizeNetPaySearchSort}
      filteredPayslipSearchRows={filteredPayslipSearchRows}
      statusFeedbackMessage={statusFeedbackMessage}
      statusFeedbackTone={statusFeedbackTone}
      latestFailureMessage={latestFailureMessage}
      copyLatestFailureCause={copyLatestFailureCause}
      latestFailedLog={latestFailedLog}
      statusRecoveryGuide={statusRecoveryGuide}
      latestLog={latestLog}
      compareCandidates={compareCandidates}
      compareRunId={compareRunId}
      setCompareRunId={setCompareRunId}
      compareWindowLabel={compareWindowLabel}
      compareMetrics={compareMetrics}
      compareInsightAriaLabel={compareInsightAriaLabel}
      compareInsightTitle={compareInsightTitle}
      compareInsightCards={compareInsightCards}
      copyCompareSnapshot={copyCompareSnapshot}
      compareRun={compareRun}
      payslipFileName={payslipFileName}
      copyPayslipFileName={copyPayslipFileName}
      copySelectedRunId={copySelectedRunId}
      deductionExplainSections={deductionExplainSections}
    />
  );
}

