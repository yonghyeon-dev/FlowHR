"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import {
  type DeductionDescriptionMap,
  extractErrorMessage,
  formatDateOnly,
  formatDateTime,
  formatDiffKrw,
  formatKrw,
  formatMonthLabel,
  resolveDeductionDescriptionMap,
  resolvePayslipPageCopy,
  resolvePayslipRunStateLabel,
  resolvePayslipSearchSortCopy
} from "@/app/employee/payslips/page-locale-helpers";

import {
  buildCompareInsightCards,
  buildQuery,
  escapeCsv,
  firstDayOfMonthLocal,
  formatPercent,
  isDevToolsEnabled,
  lastDayOfMonthLocal,
  lastThreeMonthsRangeLocal,
  matchesPayslipSearch,
  minutesToHours,
  previousMonthRangeLocal,
  safeDiff,
  safeDiffRate,
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
    if (!selectedRun || !compareRun) {
      return [];
    }

    const rows: Array<{ id: string; label: string; selectedValue: number | null; compareValue: number | null }> = [
      {
        id: "gross",
        label: pageCopy.compare.metrics.gross,
        selectedValue: selectedRun.grossPayKrw,
        compareValue: compareRun.grossPayKrw
      },
      {
        id: "deduction",
        label: pageCopy.compare.metrics.deduction,
        selectedValue: selectedRun.totalDeductionsKrw,
        compareValue: compareRun.totalDeductionsKrw
      },
      {
        id: "net",
        label: pageCopy.compare.metrics.net,
        selectedValue: selectedRun.netPayKrw,
        compareValue: compareRun.netPayKrw
      }
    ];

    return rows.map((row) => ({
      ...row,
      diffValue: safeDiff(row.selectedValue, row.compareValue),
      diffRate: safeDiffRate(row.selectedValue, row.compareValue)
    }));
  }, [compareRun, pageCopy.compare.metrics.deduction, pageCopy.compare.metrics.gross, pageCopy.compare.metrics.net, selectedRun]);

  const compareInsightCards = useMemo<CompareInsightCard[]>(() => {
    return buildCompareInsightCards(compareMetrics, isKoLocale);
  }, [compareMetrics, isKoLocale]);

  const compareInsightTitle = isKoLocale ? "Àü¿ù ´ëºñ ¼³¸í" : "Month-over-month explanation";
  const compareInsightAriaLabel = isKoLocale
    ? "Àü¿ù ´ëºñ ¼³¸í Ä«µå"
    : "Month-over-month explanation cards";

  const compareWindowLabel = useMemo(() => {
    if (!selectedRun || !compareRun) {
      return "-";
    }
    const selectedLabel = `${formatDateOnly(selectedRun.periodStart)} ~ ${formatDateOnly(selectedRun.periodEnd)}`;
    const compareLabel = `${formatDateOnly(compareRun.periodStart)} ~ ${formatDateOnly(compareRun.periodEnd)}`;
    return isKoLocale ? `${selectedLabel} ?€ë¹?${compareLabel}` : `${selectedLabel} vs ${compareLabel}`;
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
                {stats.fail}) Â· {pageCopy.devTools.current} {pendingLabel ?? "-"}
              </p>
              {isProductionRuntime ? (
                <p className="small muted">
                  {pageCopy.devTools.session}:{" "}
                  {supabaseSession
                    ? `${supabaseSession.email ?? supabaseSession.userId} Â· role=${supabaseSession.role ?? "-"} Â· org=${supabaseSession.organizationId ?? "-"} Â· actor=${supabaseSession.actorId ?? "-"}`
                    : pageCopy.devTools.none}{" "}
                  (Bearer {usesBearerToken ? pageCopy.devTools.bearerOn : pageCopy.devTools.bearerOff})
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
                      {pageCopy.payslipList.gross} {formatKrw(run.grossPayKrw)} Â· {pageCopy.payslipList.deduction}{" "}
                      {formatKrw(run.totalDeductionsKrw)} Â· {pageCopy.payslipList.net} {formatKrw(run.netPayKrw)} Â·{" "}
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

