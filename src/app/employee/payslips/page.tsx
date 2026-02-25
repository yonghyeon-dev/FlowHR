"use client";

import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import {
  type DeductionDescriptionMap,
  extractErrorMessage,
  formatCompareWindowLabel,
  formatDateOnly,
  resolveCompareInsightAriaLabel,
  resolveCompareInsightTitle,
  resolveDeductionDescriptionMap,
  resolvePayslipPageCopy,
  resolvePayslipRunStateLabel,
  resolvePayslipSearchSortCopy
} from "@/app/employee/payslips/page-locale-helpers";

import {
  buildCompareMetrics,
  buildCompareInsightCards,
  buildQuery,
  escapeCsv,
  firstDayOfMonthLocal,
  isDevToolsEnabled,
  lastDayOfMonthLocal,
  lastThreeMonthsRangeLocal,
  matchesPayslipSearch,
  previousMonthRangeLocal,
  sortPayslipSearchRows,
  toBreakdownRecord,
  toIso,
  toNumberOrNull,
  toTimestamp,
  type ApiLog,
  type AttendanceAggregateDto,
  type BreakdownRecord,
  type CompareInsightCard,
  type CompareMetric,
  type DeductionExplainItem,
  type DeductionExplainSection,
  type PayrollRunDto,
  type PayslipSearchRow,
  type PayslipSearchScope,
  type PayslipSortOption
} from "@/app/employee/payslips/page-helpers";
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
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const showDevTools = isDevToolsEnabled();
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";

  const searchSortCopy = useMemo(() => resolvePayslipSearchSortCopy(isKoLocale), [isKoLocale]);
  const pageCopy = useMemo(() => resolvePayslipPageCopy(isKoLocale), [isKoLocale]);
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
  const normalizedPayslipSearchQuery = payslipSearchQuery.trim().toLowerCase();

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    const fail = total - success;
    return { total, success, fail };
  }, [logs]);

  const payslipStats = useMemo(() => {
    const totalGross = runs.reduce((sum, run) => sum + run.grossPayKrw, 0);
    const totalDeductions = runs.reduce((sum, run) => sum + (run.totalDeductionsKrw ?? 0), 0);
    const totalNet = runs.reduce((sum, run) => sum + (run.netPayKrw ?? 0), 0);
    return {
      count: runs.length,
      totalGross,
      totalDeductions,
      totalNet
    };
  }, [runs]);

  const payslipSearchRows = useMemo<PayslipSearchRow[]>(() => {
    return runs.map((run) => {
      const confirmedAtTs = toTimestamp(run.confirmedAt);
      const periodEndTs = toTimestamp(run.periodEnd);
      const stateLabel = resolvePayslipRunStateLabel(run.state, isKoLocale);
      return {
        key: run.id,
        runId: run.id,
        periodLabel: `${formatDateOnly(run.periodStart)} ~ ${formatDateOnly(run.periodEnd)}`,
        state: run.state,
        stateLabel,
        stateSearchText: `${run.state.toLowerCase()} ${stateLabel.toLowerCase()}`,
        grossPayKrw: run.grossPayKrw,
        totalDeductionsKrw: run.totalDeductionsKrw,
        netPayKrw: run.netPayKrw,
        confirmedAt: run.confirmedAt,
        sortTimestamp: confirmedAtTs > 0 ? confirmedAtTs : periodEndTs
      };
    });
  }, [isKoLocale, runs]);

  const filteredPayslipSearchRows = useMemo(() => {
    const filtered = payslipSearchRows.filter((row) =>
      matchesPayslipSearch(payslipSearchScope, normalizedPayslipSearchQuery, row)
    );

    return sortPayslipSearchRows(filtered, payslipSortOption);
  }, [normalizedPayslipSearchQuery, payslipSearchRows, payslipSearchScope, payslipSortOption]);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId]
  );

  const selectedRunBreakdown = useMemo(
    () => toBreakdownRecord(selectedRun?.deductionBreakdown ?? null),
    [selectedRun]
  );

  const latestLog = useMemo(() => logs[0] ?? null, [logs]);
  const latestFailedLog = useMemo(() => logs.find((log) => !log.ok) ?? null, [logs]);

  const statusFeedbackTone = useMemo(() => {
    if (!latestLog) {
      return "idle";
    }
    return latestLog.ok ? "ok" : "fail";
  }, [latestLog]);

  const statusFeedbackMessage = useMemo(() => {
    if (!latestLog) {
      return pageCopy.status.noRecentResult;
    }
    if (latestLog.ok) {
      return `${latestLog.label} ${pageCopy.status.successSuffix}`;
    }
    return `${latestLog.label} ${pageCopy.status.failureSuffix}`;
  }, [latestLog, pageCopy.status.failureSuffix, pageCopy.status.noRecentResult, pageCopy.status.successSuffix]);

  const latestFailureMessage = useMemo(() => {
    if (!latestFailedLog) {
      return "";
    }
    return extractErrorMessage(latestFailedLog.body);
  }, [latestFailedLog]);

  const statusRecoveryGuide = useMemo(() => {
    if (!latestFailedLog) {
      return pageCopy.status.guideIfNoFailure;
    }
    return pageCopy.status.guideIfFailure;
  }, [latestFailedLog, pageCopy.status.guideIfFailure, pageCopy.status.guideIfNoFailure]);

  const compareCandidates = useMemo(() => {
    if (!selectedRun) {
      return [];
    }
    return runs
      .filter((run) => run.id !== selectedRun.id)
      .sort((left, right) => toTimestamp(right.periodStart) - toTimestamp(left.periodStart));
  }, [runs, selectedRun]);

  const compareRun = useMemo(() => {
    if (compareCandidates.length === 0) {
      return null;
    }
    return compareCandidates.find((run) => run.id === compareRunId) ?? compareCandidates[0];
  }, [compareCandidates, compareRunId]);

  const compareMetrics = useMemo<CompareMetric[]>(() => {
    return buildCompareMetrics(selectedRun, compareRun, pageCopy.compare.metrics);
  }, [compareRun, pageCopy.compare.metrics.deduction, pageCopy.compare.metrics.gross, pageCopy.compare.metrics.net, selectedRun]);

  const compareInsightCards = useMemo<CompareInsightCard[]>(() => {
    return buildCompareInsightCards(compareMetrics, isKoLocale);
  }, [compareMetrics, isKoLocale]);

  const compareInsightTitle = useMemo(() => resolveCompareInsightTitle(isKoLocale), [isKoLocale]);
  const compareInsightAriaLabel = useMemo(() => resolveCompareInsightAriaLabel(isKoLocale), [isKoLocale]);

  const compareWindowLabel = useMemo(() => {
    if (!selectedRun || !compareRun) {
      return "-";
    }
    const selectedLabel = `${formatDateOnly(selectedRun.periodStart)} ~ ${formatDateOnly(selectedRun.periodEnd)}`;
    const compareLabel = `${formatDateOnly(compareRun.periodStart)} ~ ${formatDateOnly(compareRun.periodEnd)}`;
    return formatCompareWindowLabel(selectedLabel, compareLabel, isKoLocale);
  }, [compareRun, isKoLocale, selectedRun]);

  const fixedDeductionExplainItems = useMemo<DeductionExplainItem[]>(() => {
    if (!selectedRun) {
      return [];
    }
    return [
      {
        key: "withholdingTaxKrw",
        label: deductionDescriptionMap.withholdingTaxKrw.label,
        amountKrw: selectedRun.withholdingTaxKrw,
        description: deductionDescriptionMap.withholdingTaxKrw.description
      },
      {
        key: "socialInsuranceKrw",
        label: deductionDescriptionMap.socialInsuranceKrw.label,
        amountKrw: selectedRun.socialInsuranceKrw,
        description: deductionDescriptionMap.socialInsuranceKrw.description
      },
      {
        key: "otherDeductionsKrw",
        label: deductionDescriptionMap.otherDeductionsKrw.label,
        amountKrw: selectedRun.otherDeductionsKrw,
        description: deductionDescriptionMap.otherDeductionsKrw.description
      }
    ];
  }, [deductionDescriptionMap, selectedRun]);

  const componentDeductionExplainItems = useMemo<DeductionExplainItem[]>(() => {
    const additional = toBreakdownRecord(selectedRunBreakdown?.additional ?? null);
    const components = toBreakdownRecord(additional?.components ?? null);
    if (!components) {
      return [];
    }

    return Object.entries(components).flatMap(([key, value]) => {
      const amount = toNumberOrNull(value);
      if (amount === null || amount === 0) {
        return [];
      }
      const mapped = deductionDescriptionMap[key];
      return [
        {
          key,
          label: mapped?.label ?? key,
          amountKrw: amount,
          description: mapped?.description ?? pageCopy.deductionFallback.statutoryDetail
        }
      ];
    });
  }, [pageCopy.deductionFallback.statutoryDetail, selectedRunBreakdown, deductionDescriptionMap]);

  const taxCreditExplainItems = useMemo<DeductionExplainItem[]>(() => {
    const additional = toBreakdownRecord(selectedRunBreakdown?.additional ?? null);
    const taxCredits = toBreakdownRecord(additional?.taxCreditsKrw ?? null);
    if (!taxCredits) {
      return [];
    }

    return ["preCreditIncomeTaxKrw", "dependentTaxCreditKrw", "additionalTaxCreditKrw", "totalTaxCreditKrw"].flatMap(
      (key) => {
        const amount = toNumberOrNull(taxCredits[key]);
        if (amount === null || amount === 0) {
          return [];
        }
        const mapped = deductionDescriptionMap[key];
        return [
          {
            key,
            label: mapped?.label ?? key,
            amountKrw: amount,
            description: mapped?.description ?? pageCopy.deductionFallback.taxCreditDetail
          }
        ];
      }
    );
  }, [pageCopy.deductionFallback.taxCreditDetail, selectedRunBreakdown, deductionDescriptionMap]);

  const deductionExplainSections = useMemo<DeductionExplainSection[]>(() => {
    if (!selectedRun) {
      return [];
    }
    return [
      {
        id: "fixed",
        title: pageCopy.detail.deductionGuideTitle,
        items: fixedDeductionExplainItems
      },
      {
        id: "component",
        title: pageCopy.detail.deductionComponentTitle,
        items: componentDeductionExplainItems
      },
      {
        id: "tax-credit",
        title: pageCopy.detail.taxCreditReferenceTitle,
        items: taxCreditExplainItems
      }
    ];
  }, [
    componentDeductionExplainItems,
    fixedDeductionExplainItems,
    pageCopy.detail.deductionComponentTitle,
    pageCopy.detail.deductionGuideTitle,
    pageCopy.detail.taxCreditReferenceTitle,
    selectedRun,
    taxCreditExplainItems
  ]);

  const payslipFileName = useMemo(() => {
    if (!selectedRun) {
      return "";
    }
    const period = new Date(selectedRun.periodStart);
    const year = Number.isNaN(period.getTime()) ? "unknown" : String(period.getFullYear());
    const month = Number.isNaN(period.getTime()) ? "00" : String(period.getMonth() + 1).padStart(2, "0");
    const actor = (selectedRun.employeeId ?? employeeId ?? "employee").replace(/\s+/g, "-");
    return `flowhr-payslip-${actor}-${year}${month}.pdf`;
  }, [employeeId, selectedRun]);

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

  async function callApi(
    label: string,
    method: "GET" | "POST",
    path: string,
    payload?: Record<string, unknown>
  ) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }

      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken.trim()}`;
      } else {
        headers["x-actor-role"] = "employee";
        headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
        if (organizationId.trim().length > 0) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });

      const text = await response.text();
      let body: unknown = null;
      if (text.trim().length > 0) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale),
          body
        },
        ...prev
      ]);

      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function refreshPayslips() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    const targetEmployeeId = employeeId.trim() || "EMP-1001";

    const [runsRes, aggregateRes] = await Promise.all([
      callApi(
        pageCopy.logs.fetchPayslips,
        "GET",
        `/api/payroll/runs${buildQuery({
          from,
          to,
          employeeId: targetEmployeeId,
          state: "CONFIRMED"
        })}`
      ),
      callApi(
        pageCopy.logs.fetchAttendance,
        "GET",
        `/api/attendance/aggregates${buildQuery({ from, to, employeeId: targetEmployeeId })}`
      )
    ]);

    if (runsRes.response.ok) {
      const parsed = runsRes.body as { runs?: PayrollRunDto[] };
      setRuns(Array.isArray(parsed.runs) ? parsed.runs : []);
    }

    if (aggregateRes.response.ok) {
      const parsed = aggregateRes.body as { aggregates?: AttendanceAggregateDto[] };
      const aggregates = Array.isArray(parsed.aggregates) ? parsed.aggregates : [];
      setAggregate(aggregates[0] ?? null);
    }
  }

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
      setLogs((prev) => [
        {
          id: Date.now(),
          label: pageCopy.logs.copyPayslipId,
          status: 200,
          ok: true,
          at: new Date().toLocaleString(runtimeLocale),
          body: { runId: selectedRun.id }
        },
        ...prev
      ]);
    } catch (error) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: pageCopy.logs.copyPayslipId,
          status: 500,
          ok: false,
          at: new Date().toLocaleString(runtimeLocale),
          body: { error: error instanceof Error ? error.message : String(error) }
        },
        ...prev
      ]);
    }
  }

  async function copyPayslipFileName() {
    if (!payslipFileName) {
      return;
    }
    try {
      await navigator.clipboard.writeText(payslipFileName);
      setLogs((prev) => [
        {
          id: Date.now(),
          label: pageCopy.logs.copyPdfFileName,
          status: 200,
          ok: true,
          at: new Date().toLocaleString(runtimeLocale),
          body: { fileName: payslipFileName }
        },
        ...prev
      ]);
    } catch (error) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: pageCopy.logs.copyPdfFileName,
          status: 500,
          ok: false,
          at: new Date().toLocaleString(runtimeLocale),
          body: { error: error instanceof Error ? error.message : String(error) }
        },
        ...prev
      ]);
    }
  }

  function appendClientLog(label: string, ok: boolean, status: number, body: unknown) {
    setLogs((prev) => [
      {
        id: Date.now(),
        label,
        status,
        ok,
        at: new Date().toLocaleString(runtimeLocale),
        body
      },
      ...prev
    ]);
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
    anchor.download = `flowhr-payslips-${employeeId || "employee"}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function clearLogs() {
    setLogs([]);
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
      supabaseSessionError={supabaseSessionError}
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

