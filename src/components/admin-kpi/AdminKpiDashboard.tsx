"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminKpiAnalyticsControls, AdminKpiCards, AdminKpiContextPanel, AdminKpiLogsPanel, AdminKpiTrendPanel, type AdminKpiFocusMetric, type ApiLog, type RangeKpi } from "@/components/admin-kpi/AdminKpiSections";
import { kpiCopyByLocale } from "@/components/admin-kpi/copy";
import { buildAdminKpiCsvPayload, buildAdminKpiTrendRows, safeParseBody, triggerCsvDownload } from "@/components/admin-kpi/dashboard-utils";
import { buildQuery, getLast30DaysRangeLocal, getThisMonthRangeLocal, isTruthyFlag, parseArray, toIso } from "@/components/admin-kpi/helpers";
import { buildAdminKpiSummary, computePreviousPeriodRange, computeStalledHours } from "@/features/admin-kpi/summary";
import { resolveAdminContractDocumentNextStep } from "@/components/contracts/document-action-policy";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
type ApprovalExecutionLite = { updatedAt: string };
type AttendanceAggregateLite = { counts: { total: number; approved: number } };
type LeaveRequestLite = { days: number };
type PayrollRunLite = { state: "PREVIEWED" | "CONFIRMED" };
type ContractDocumentLite = { status: "DRAFT" | "APPROVAL_REQUESTED" | "SENT" | "SIGNED" | "REJECTED" | "EXPIRED" | "RENEWED"; approvalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED"; requiresApproval: boolean; expiresAt: string | null };
const contractSlaTrackedStatuses = new Set<ContractDocumentLite["status"]>(["DRAFT", "APPROVAL_REQUESTED", "SENT"]);
const contractDecisionQueueSteps = new Set(["REQUEST_APPROVAL", "APPROVE_OR_REJECT", "SEND_DOCUMENT"]);
type AdminKpiDashboardProps = {
  analyticsMode?: boolean;
};
export function AdminKpiDashboard({ analyticsMode = false }: AdminKpiDashboardProps) {
  const { locale } = useI18n();
  const copy = kpiCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const initialRange = useMemo(() => getThisMonthRangeLocal(), []);
  const [periodStart, setPeriodStart] = useState(initialRange.from);
  const [periodEnd, setPeriodEnd] = useState(initialRange.to);
  const [focusMetric, setFocusMetric] = useState<AdminKpiFocusMetric>("all");
  const [currentRangeKpi, setCurrentRangeKpi] = useState<RangeKpi | null>(null);
  const [previousRangeKpi, setPreviousRangeKpi] = useState<RangeKpi | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";
  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const requestJson = useCallback(
    async (label: string, path: string) => {
      const startedAt = Date.now();
      const headers: Record<string, string> = {};
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }
      const response = await fetch(path, { method: "GET", headers });
      const text = await response.text();
      const body = text.trim().length > 0 ? safeParseBody(text) : null;
      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          ok: response.ok,
          status: response.status,
          at: new Date().toLocaleString(runtimeLocale),
          durationMs: Date.now() - startedAt
        },
        ...prev
      ]);
      if (!response.ok) {
        throw new Error(`${label} failed (${response.status})`);
      }
      return body;
    },
    [adminActorId, bearerToken, organizationId, runtimeLocale, usesBearerToken]
  );
  const loadRangeKpi = useCallback(
    async (range: { from: string; to: string }) => {
      const rangeQuery = buildQuery({ from: range.from, to: range.to });
      const approvalQuery = buildQuery({
        organizationId: organizationId.trim() || undefined,
        state: "PENDING",
        asOf: range.to,
        limit: "500",
        sort: "priority_desc"
      });
      const [approvalBody, attendanceBody, leaveBody, payrollBody, contractBody] = await Promise.all([
        requestJson("approval executions", `/api/approval/executions${approvalQuery}`),
        requestJson("attendance aggregates", `/api/attendance/aggregates${rangeQuery}`),
        requestJson(
          "leave requests approved",
          `/api/leave/requests${buildQuery({ from: range.from, to: range.to, state: "APPROVED" })}`
        ),
        requestJson("payroll runs", `/api/payroll/runs${rangeQuery}`),
        requestJson("contract documents", `/api/contracts/documents${buildQuery({ organizationId: organizationId.trim() || undefined })}`)
      ]);
      const approvalExecutions = parseArray<ApprovalExecutionLite>(approvalBody, "executions");
      const attendanceAggregates = parseArray<AttendanceAggregateLite>(attendanceBody, "aggregates");
      const approvedLeaveRequests = parseArray<LeaveRequestLite>(leaveBody, "requests");
      const payrollRuns = parseArray<PayrollRunLite>(payrollBody, "runs");
      const contractDocuments = parseArray<ContractDocumentLite>(contractBody, "documents");
      const attendanceTotal = attendanceAggregates.reduce((sum, item) => sum + (item.counts?.total ?? 0), 0);
      const attendanceApproved = attendanceAggregates.reduce(
        (sum, item) => sum + (item.counts?.approved ?? 0),
        0
      );
      const leaveApprovedDays = approvedLeaveRequests.reduce((sum, item) => sum + (item.days ?? 0), 0);
      const payrollTotal = payrollRuns.length;
      const payrollConfirmed = payrollRuns.filter((run) => run.state === "CONFIRMED").length;
      const asOfDate = new Date(range.to);
      const approvalStalledCount = approvalExecutions.filter(
        (execution) => computeStalledHours(execution.updatedAt, asOfDate) >= 24
      ).length;
      const asOfMillis = asOfDate.getTime();
      const contractDecisionQueueCount = contractDocuments.filter((document) =>
        contractDecisionQueueSteps.has(
          resolveAdminContractDocumentNextStep({
            status: document.status,
            approvalStatus: document.approvalStatus ?? "NONE",
            requiresApproval: Boolean(document.requiresApproval)
          })
        )
      ).length;
      const contractSlaOverdueCount = contractDocuments.filter((document) => {
        if (!contractSlaTrackedStatuses.has(document.status)) {
          return false;
        }
        const expiresAtMillis = document.expiresAt ? new Date(document.expiresAt).getTime() : Number.NaN;
        return Number.isFinite(expiresAtMillis) && expiresAtMillis < asOfMillis;
      }).length;
      return {
        summary: buildAdminKpiSummary({
          approvalPendingCount: approvalExecutions.length,
          approvalStalledCount,
          attendanceApprovedCount: attendanceApproved,
          attendanceTotalCount: attendanceTotal,
          leaveApprovedDays,
          payrollConfirmedCount: payrollConfirmed,
          payrollTotalCount: payrollTotal,
          contractDecisionQueueCount,
          contractSlaOverdueCount
        }),
        detail: {
          attendanceTotal,
          attendanceApproved,
          leaveApprovedRequestCount: approvedLeaveRequests.length,
          payrollTotal,
          payrollConfirmed
        }
      } satisfies RangeKpi;
    },
    [organizationId, requestJson]
  );
  const loadKpis = useCallback(async () => {
    if (!usesBearerToken && !organizationId.trim()) {
      return;
    }
    setPendingLabel(copy.loadingLabel);
    try {
      const currentRange = { from: toIso(periodStart), to: toIso(periodEnd) };
      const previousRange = computePreviousPeriodRange(currentRange.from, currentRange.to);
      const [current, previous] = await Promise.all([loadRangeKpi(currentRange), loadRangeKpi(previousRange)]);
      setCurrentRangeKpi(current);
      setPreviousRangeKpi(previous);
    } finally {
      setPendingLabel(null);
    }
  }, [copy.loadingLabel, loadRangeKpi, organizationId, periodEnd, periodStart, usesBearerToken]);
  useEffect(() => {
    void loadKpis();
  }, [loadKpis]);
  const trendRows = useMemo(
    () => buildAdminKpiTrendRows(copy.metrics, currentRangeKpi, previousRangeKpi),
    [copy.metrics, currentRangeKpi, previousRangeKpi]
  );
  const visibleTrendRows = useMemo(
    () => (focusMetric === "all" ? trendRows : trendRows.filter((row) => row.key === focusMetric)),
    [focusMetric, trendRows]
  );
  const refreshDisabled = Boolean(pendingLabel) || (!usesBearerToken && !organizationId.trim());
  const exportDisabled = !currentRangeKpi || !previousRangeKpi || Boolean(pendingLabel);
  const exportCsv = useCallback(() => {
    if (!currentRangeKpi || !previousRangeKpi) {
      return;
    }
    const generatedAt = new Date();
    const payload = buildAdminKpiCsvPayload({
      analyticsMode,
      trendRows: visibleTrendRows,
      summary: currentRangeKpi.summary,
      focusMetric,
      generatedAt
    });
    triggerCsvDownload(payload.fileName, payload.content);
    setLogs((prev) => [
      {
        id: Date.now(),
        label: copy.exportCsvDone,
        ok: true,
        status: 200,
        at: generatedAt.toLocaleString(runtimeLocale),
        durationMs: 0
      },
      ...prev
    ]);
  }, [
    analyticsMode,
    copy.exportCsvDone,
    currentRangeKpi,
    focusMetric,
    previousRangeKpi,
    runtimeLocale,
    visibleTrendRows
  ]);
  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>{analyticsMode ? copy.analyticsTitle : copy.title}</h1>
        <p>{analyticsMode ? copy.analyticsDescription : copy.description}</p>
        {analyticsMode ? (
          <AdminKpiAnalyticsControls
            copy={copy}
            focusMetric={focusMetric}
            exportButtonLabel={copy.exportCsvButton}
            exportDisabled={exportDisabled}
            onFocusMetricChange={setFocusMetric}
            onExportCsv={exportCsv}
          />
        ) : null}
      </header>
      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          {copy.productionWarning} <Link href="/login">{copy.loginCta}</Link>
        </p>
      ) : null}
      <AdminKpiContextPanel
        copy={copy}
        sessionOrganizationId={organizationId}
        sessionActorId={adminActorId}
        periodStart={periodStart}
        periodEnd={periodEnd}
        pendingLabel={pendingLabel}
        refreshDisabled={refreshDisabled}
        onSetPeriodStart={setPeriodStart}
        onSetPeriodEnd={setPeriodEnd}
        onSetThisMonth={() => {
          const range = getThisMonthRangeLocal();
          setPeriodStart(range.from);
          setPeriodEnd(range.to);
        }}
        onSetLast30Days={() => {
          const range = getLast30DaysRangeLocal();
          setPeriodStart(range.from);
          setPeriodEnd(range.to);
        }}
        onRefresh={() => {
          void loadKpis();
        }}
      />
      {currentRangeKpi ? <AdminKpiCards copy={copy} kpi={currentRangeKpi} /> : <p className="small muted">{copy.noData}</p>}
      <section className="panel-grid">
        <AdminKpiTrendPanel copy={copy} rows={visibleTrendRows} />
        {showDevTools ? <AdminKpiLogsPanel copy={copy} logs={logs} /> : null}
      </section>
    </main>
  );
}
