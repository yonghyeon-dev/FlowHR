"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminBenefitsKpiPanel,
  buildBenefitsKpiSnapshot,
  type BenefitsKpiSnapshot
} from "@/components/admin-kpi/AdminBenefitsKpiPanel";
import {
  AdminPayrollRiskKpiPanel,
  buildPayrollRiskKpiSnapshot,
  type PayrollRiskKpiSnapshot
} from "@/components/admin-kpi/AdminPayrollRiskKpiPanel";
import {
  AdminOnboardingKpiPanel,
  buildOnboardingKpiSnapshot,
  type OnboardingKpiSnapshot
} from "@/components/admin-kpi/AdminOnboardingKpiPanel";
import { AdminNoticesKpiPanel, buildNoticeReadCoverageSnapshot, type NoticeReadCoverageSnapshot } from "@/components/admin-kpi/AdminNoticesKpiPanel";
import { AdminRecruitmentKpiPanel, buildRecruitmentKpiSnapshot, type RecruitmentKpiSnapshot } from "@/components/admin-kpi/AdminRecruitmentKpiPanel";
import {
  AdminKpiAnalyticsControls,
  type AdminKpiCardQuickLinkMap,
  AdminKpiCards,
  AdminKpiContextPanel,
  type AdminKpiDrilldownMetric,
  AdminKpiLogsPanel,
  AdminKpiTrendPanel,
  type AdminKpiFocusMetric,
  type ApiLog,
  type RangeKpi
} from "@/components/admin-kpi/AdminKpiSections";
import { kpiCopyByLocale } from "@/components/admin-kpi/copy";
import { buildAdminKpiCsvPayload, buildAdminKpiTrendRows, safeParseBody, triggerCsvDownload } from "@/components/admin-kpi/dashboard-utils";
import { buildQuery, formatDelta, formatPercent, getLast30DaysRangeLocal, getThisMonthRangeLocal, isTruthyFlag, parseArray, toIso } from "@/components/admin-kpi/helpers";
import { buildAdminKpiSummary, computePreviousPeriodRange, computeStalledHours } from "@/features/admin-kpi/summary";
import { resolveAdminContractDocumentNextStep } from "@/components/contracts/document-action-policy";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
type ApprovalExecutionLite = { updatedAt: string };
type AttendanceAggregateLite = { counts: { total: number; approved: number } };
type LeaveRequestLite = { days: number };
type PayrollRunLite = {
  state: "PREVIEWED" | "CONFIRMED";
  confirmedAt: string | null;
  payslipDistributedAt: string | null;
  payslipReceiptConfirmedAt: string | null;
};
type RecruitmentOpeningLite = { status: "OPEN" | "CLOSED" };
type RecruitmentReferralLite = { stage: "SUBMITTED" | "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED" | "WITHDRAWN"; updatedAt: string };
type ContractDocumentLite = { status: "DRAFT" | "APPROVAL_REQUESTED" | "SENT" | "SIGNED" | "REJECTED" | "EXPIRED" | "RENEWED"; approvalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED"; requiresApproval: boolean; expiresAt: string | null };
type OnboardingContractDocumentLite = { employeeId: string; status: "DRAFT" | "APPROVAL_REQUESTED" | "SENT" | "SIGNED" | "REJECTED" | "EXPIRED" | "RENEWED" };
type EmployeeLite = { id: string; email: string | null };
type AuthInviteLite = { email: string };
type BenefitCatalogLite = { id: string; annualLimitKrw: number; status: "ACTIVE" | "INACTIVE" };
type BenefitRequestLite = { benefitId: string; amountKrw: number; status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELED"; requestedAt: string };
type NoticeLite = { id: string; status: "DRAFT" | "SCHEDULED" | "PUBLISHED"; publishedAt: string | null; updatedAt: string };
type NoticeReadReceiptLite = { noticeId: string; readAt: string };
const contractSlaTrackedStatuses = new Set<ContractDocumentLite["status"]>(["DRAFT", "APPROVAL_REQUESTED", "SENT"]);
const contractDecisionQueueSteps = new Set(["REQUEST_APPROVAL", "APPROVE_OR_REJECT", "SEND_DOCUMENT"]);
const adminKpiFocusMetricSet = new Set<AdminKpiFocusMetric>([
  "all",
  "pendingApprovals",
  "stalledApprovals",
  "attendanceApprovalRate",
  "leaveApprovedDays",
  "payrollConfirmedRate",
  "contractDecisionQueueCount",
  "contractSlaOverdueCount"
]);
const adminKpiDrilldownMetrics: AdminKpiDrilldownMetric[] = [
  "pendingApprovals",
  "stalledApprovals",
  "attendanceApprovalRate",
  "leaveApprovedDays",
  "payrollConfirmedRate",
  "contractDecisionQueueCount",
  "contractSlaOverdueCount"
];
type FocusWorkspaceLink = { href: string; label: string };

function parseAdminKpiFocusMetric(
  value: string | null
): AdminKpiFocusMetric | null {
  if (!value) {
    return null;
  }
  if (adminKpiFocusMetricSet.has(value as AdminKpiFocusMetric)) {
    return value as AdminKpiFocusMetric;
  }
  return null;
}

function resolveFocusWorkspaceLink(
  focusMetric: AdminKpiFocusMetric,
  copy: (typeof kpiCopyByLocale)["ko"]
): FocusWorkspaceLink {
  if (focusMetric === "pendingApprovals" || focusMetric === "stalledApprovals") {
    return { href: "/admin/approval-executions", label: copy.metrics.pendingApprovals };
  }
  if (focusMetric === "attendanceApprovalRate") {
    return { href: "/admin/attendance-live", label: copy.metrics.attendanceApprovalRate };
  }
  if (focusMetric === "leaveApprovedDays") {
    return { href: "/admin/leave-calendar", label: copy.metrics.leaveApprovedDays };
  }
  if (focusMetric === "payrollConfirmedRate") {
    return { href: "/admin/payroll-close", label: copy.metrics.payrollConfirmedRate };
  }
  if (
    focusMetric === "contractDecisionQueueCount" ||
    focusMetric === "contractSlaOverdueCount"
  ) {
    return {
      href: "/admin/contracts",
      label:
        focusMetric === "contractSlaOverdueCount"
          ? copy.metrics.contractSlaOverdueCount
          : copy.metrics.contractDecisionQueueCount
    };
  }
  return { href: "/admin", label: copy.focusMetricAllOption };
}

function appendAnalyticsSourceQuery(
  href: string,
  focusMetric: AdminKpiFocusMetric
): string {
  const contextParams = new URLSearchParams({ source: "admin-analytics" });
  if (focusMetric !== "all") {
    contextParams.set("focusMetric", focusMetric);
  }
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${contextParams.toString()}`;
}

function buildAnalyticsFocusHref(
  pathname: string,
  focusMetric: AdminKpiFocusMetric
): string {
  if (focusMetric === "all") {
    return pathname;
  }
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}focus=${focusMetric}`;
}

type AdminKpiDashboardProps = { analyticsMode?: boolean };
export function AdminKpiDashboard({ analyticsMode = false }: AdminKpiDashboardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useI18n();
  const copy = kpiCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const initialRange = useMemo(() => getThisMonthRangeLocal(), []);
  const [periodStart, setPeriodStart] = useState(initialRange.from);
  const [periodEnd, setPeriodEnd] = useState(initialRange.to);
  const [focusMetric, setFocusMetric] = useState<AdminKpiFocusMetric>("all");
  const [currentRangeKpi, setCurrentRangeKpi] = useState<RangeKpi | null>(null);
  const [previousRangeKpi, setPreviousRangeKpi] = useState<RangeKpi | null>(null);
  const [recruitmentKpi, setRecruitmentKpi] = useState<RecruitmentKpiSnapshot | null>(null);
  const [noticesKpi, setNoticesKpi] = useState<NoticeReadCoverageSnapshot | null>(null);
  const [benefitsKpi, setBenefitsKpi] = useState<BenefitsKpiSnapshot | null>(null);
  const [onboardingKpi, setOnboardingKpi] = useState<OnboardingKpiSnapshot | null>(null);
  const [payrollRiskKpi, setPayrollRiskKpi] = useState<PayrollRiskKpiSnapshot | null>(null);
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
  const loadRecruitmentKpi = useCallback(async () => {
    const recruitmentQuery = buildQuery({
      organizationId: organizationId.trim() || undefined
    });
    const [openingsBody, referralsBody] = await Promise.all([
      requestJson("recruitment openings", `/api/recruitment/openings${recruitmentQuery}`),
      requestJson("recruitment referrals", `/api/recruitment/referrals${recruitmentQuery}`)
    ]);
    return buildRecruitmentKpiSnapshot({
      openings: parseArray<RecruitmentOpeningLite>(openingsBody, "openings"),
      referrals: parseArray<RecruitmentReferralLite>(referralsBody, "referrals")
    });
  }, [organizationId, requestJson]);
  const loadNoticesKpi = useCallback(async () => {
    const noticesBody = await requestJson("notices", `/api/notices${buildQuery({ organizationId: organizationId.trim() || undefined, audience: "all", status: "all" })}`);
    return buildNoticeReadCoverageSnapshot({ notices: parseArray<NoticeLite>(noticesBody, "notices"), readReceipts: parseArray<NoticeReadReceiptLite>(noticesBody, "readReceipts") });
  }, [organizationId, requestJson]);
  const loadBenefitsKpi = useCallback(async () => {
    const targetOrganizationId = organizationId.trim() || undefined;
    const [catalogBody, requestsBody] = await Promise.all([
      requestJson(
        "benefits catalog",
        `/api/benefits/catalog${buildQuery({ organizationId: targetOrganizationId })}`
      ),
      requestJson(
        "benefits requests",
        `/api/benefits/requests${buildQuery({ organizationId: targetOrganizationId })}`
      )
    ]);
    return buildBenefitsKpiSnapshot({
      catalog: parseArray<BenefitCatalogLite>(catalogBody, "catalog"),
      requests: parseArray<BenefitRequestLite>(requestsBody, "requests")
    });
  }, [organizationId, requestJson]);
  const loadOnboardingKpi = useCallback(async () => {
    const targetOrganizationId = organizationId.trim() || undefined;
    const [employeesBody, invitesBody, contractsBody] = await Promise.all([
      requestJson(
        "onboarding employees",
        `/api/people/employees${buildQuery({ organizationId: targetOrganizationId, active: "true" })}`
      ),
      requestJson(
        "onboarding invites",
        `/api/auth/invites${buildQuery({
          organizationId: targetOrganizationId,
          role: "employee",
          limit: "500"
        })}`
      ),
      requestJson(
        "onboarding contracts",
        `/api/contracts/documents${buildQuery({ organizationId: targetOrganizationId })}`
      )
    ]);
    return buildOnboardingKpiSnapshot({
      employees: parseArray<EmployeeLite>(employeesBody, "employees"),
      invites: parseArray<AuthInviteLite>(invitesBody, "invites"),
      contractDocuments: parseArray<OnboardingContractDocumentLite>(contractsBody, "documents")
    });
  }, [organizationId, requestJson]);
  const loadPayrollRiskKpi = useCallback(
    async (range: { from: string; to: string }) => {
      const payrollRunsBody = await requestJson(
        "payroll risk runs",
        `/api/payroll/runs${buildQuery({ from: range.from, to: range.to })}`
      );
      return buildPayrollRiskKpiSnapshot({
        runs: parseArray<PayrollRunLite>(payrollRunsBody, "runs")
      });
    },
    [requestJson]
  );
  const loadKpis = useCallback(async () => {
    if (!usesBearerToken && !organizationId.trim()) {
      return;
    }
    setPendingLabel(copy.loadingLabel);
    try {
      const currentRange = { from: toIso(periodStart), to: toIso(periodEnd) };
      const previousRange = computePreviousPeriodRange(currentRange.from, currentRange.to);
      const [current, previous, recruitment, notices, benefits, onboarding, payrollRisk] = await Promise.all([
        loadRangeKpi(currentRange),
        loadRangeKpi(previousRange),
        loadRecruitmentKpi(),
        loadNoticesKpi(),
        loadBenefitsKpi(),
        loadOnboardingKpi(),
        loadPayrollRiskKpi(currentRange)
      ]);
      setCurrentRangeKpi(current);
      setPreviousRangeKpi(previous);
      setRecruitmentKpi(recruitment);
      setNoticesKpi(notices);
      setBenefitsKpi(benefits);
      setOnboardingKpi(onboarding);
      setPayrollRiskKpi(payrollRisk);
    } finally {
      setPendingLabel(null);
    }
  }, [copy.loadingLabel, loadBenefitsKpi, loadNoticesKpi, loadOnboardingKpi, loadPayrollRiskKpi, loadRangeKpi, loadRecruitmentKpi, organizationId, periodEnd, periodStart, usesBearerToken]);
  useEffect(() => {
    void loadKpis();
  }, [loadKpis]);
  useEffect(() => {
    if (!analyticsMode) {
      return;
    }
    const parsed = parseAdminKpiFocusMetric(searchParams.get("focus")) ?? "all";
    if (parsed !== focusMetric) {
      setFocusMetric(parsed);
    }
  }, [analyticsMode, focusMetric, searchParams]);
  useEffect(() => {
    if (!analyticsMode) {
      return;
    }
    const nextParams = new URLSearchParams(searchParams.toString());
    if (focusMetric === "all") {
      nextParams.delete("focus");
    } else {
      nextParams.set("focus", focusMetric);
    }
    const currentQuery = searchParams.toString();
    const nextQuery = nextParams.toString();
    if (currentQuery === nextQuery) {
      return;
    }
    const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextPath, { scroll: false });
  }, [analyticsMode, focusMetric, pathname, router, searchParams]);
  const trendRows = useMemo(
    () => buildAdminKpiTrendRows(copy.metrics, currentRangeKpi, previousRangeKpi),
    [copy.metrics, currentRangeKpi, previousRangeKpi]
  );
  const visibleTrendRows = useMemo(
    () => (focusMetric === "all" ? trendRows : trendRows.filter((row) => row.key === focusMetric)),
    [focusMetric, trendRows]
  );
  const focusedTrendRow = useMemo(
    () => trendRows.find((row) => row.key === focusMetric) ?? null,
    [focusMetric, trendRows]
  );
  const refreshDisabled = Boolean(pendingLabel) || (!usesBearerToken && !organizationId.trim());
  const exportDisabled = !currentRangeKpi || !previousRangeKpi || Boolean(pendingLabel);
  const focusWorkspace = useMemo(
    () => resolveFocusWorkspaceLink(focusMetric, copy),
    [copy, focusMetric]
  );
  const cardQuickLinks = useMemo<AdminKpiCardQuickLinkMap | undefined>(() => {
    if (!analyticsMode) {
      return undefined;
    }
    return adminKpiDrilldownMetrics.reduce<AdminKpiCardQuickLinkMap>((acc, metric) => {
      const workspace = resolveFocusWorkspaceLink(metric, copy);
      acc[metric] = {
        href: appendAnalyticsSourceQuery(workspace.href, metric),
        workspaceLabel: workspace.label
      };
      return acc;
    }, {});
  }, [analyticsMode, copy]);
  const exportCsv = useCallback(() => {
    if (!currentRangeKpi || !previousRangeKpi) {
      return;
    }
    const generatedAt = new Date();
    const focusAnalyticsHref = buildAnalyticsFocusHref(pathname, focusMetric);
    const focusWorkspaceHref = appendAnalyticsSourceQuery(focusWorkspace.href, focusMetric);
    const payload = buildAdminKpiCsvPayload({
      analyticsMode,
      trendRows: visibleTrendRows,
      summary: currentRangeKpi.summary,
      focusMetric,
      focusAnalyticsHref,
      focusWorkspaceLabel: focusWorkspace.label,
      focusWorkspaceHref,
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
    focusWorkspace.href,
    focusWorkspace.label,
    pathname,
    previousRangeKpi,
    runtimeLocale,
    visibleTrendRows
  ]);
  const copyFocusedLink = useCallback(async () => {
    if (!analyticsMode) {
      return;
    }
    try {
      const target = new URL(window.location.href);
      if (focusMetric === "all") {
        target.searchParams.delete("focus");
      } else {
        target.searchParams.set("focus", focusMetric);
      }
      await navigator.clipboard.writeText(target.toString());
      const timestamp = new Date();
      setLogs((prev) => [
        {
          id: Date.now(),
          label: copy.focusWorkspaceCopyDone,
          ok: true,
          status: 200,
          at: timestamp.toLocaleString(runtimeLocale),
          durationMs: 0
        },
        ...prev
      ]);
    } catch {
      const timestamp = new Date();
      setLogs((prev) => [
        {
          id: Date.now(),
          label: copy.focusWorkspaceCopyFailed,
          ok: false,
          status: 500,
          at: timestamp.toLocaleString(runtimeLocale),
          durationMs: 0
        },
        ...prev
      ]);
    }
  }, [analyticsMode, copy.focusWorkspaceCopyDone, copy.focusWorkspaceCopyFailed, focusMetric, runtimeLocale]);
  const focusTrendDirectionLabel = useMemo(() => {
    if (!focusedTrendRow) {
      return copy.focusWorkspaceTrendFlat;
    }
    if (focusedTrendRow.delta > 0) {
      return copy.focusWorkspaceTrendUp;
    }
    if (focusedTrendRow.delta < 0) {
      return copy.focusWorkspaceTrendDown;
    }
    return copy.focusWorkspaceTrendFlat;
  }, [copy.focusWorkspaceTrendDown, copy.focusWorkspaceTrendFlat, copy.focusWorkspaceTrendUp, focusedTrendRow]);
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
        showDevTools={showDevTools}
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
      {currentRangeKpi ? (
        <AdminKpiCards copy={copy} kpi={currentRangeKpi} quickLinks={cardQuickLinks} />
      ) : (
        <p className="small muted">{copy.noData}</p>
      )}
      {analyticsMode ? (
        <section className="panel">
          <h2>{copy.focusWorkspaceTitle}</h2>
          <p className="small muted">{copy.focusWorkspaceDescription}</p>
          <div className="actions" style={{ marginTop: 8 }}>
            <Link href={focusWorkspace.href} className="btn btn-secondary">
              {copy.focusWorkspaceOpenAction}: {focusWorkspace.label}
            </Link>
            <button type="button" className="btn btn-secondary" onClick={() => {
              void copyFocusedLink();
            }}>
              {copy.focusWorkspaceCopyLinkAction}
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <h3>{copy.focusWorkspaceMetricSummaryTitle}</h3>
            {focusedTrendRow ? (
              <ul className="small muted" style={{ marginTop: 6 }}>
                <li>{copy.metricLabel}: {focusedTrendRow.label}</li>
                <li>{copy.trendCurrent}: {focusedTrendRow.percent ? formatPercent(focusedTrendRow.current) : focusedTrendRow.current.toFixed(1)}</li>
                <li>{copy.trendPrevious}: {focusedTrendRow.percent ? formatPercent(focusedTrendRow.previous) : focusedTrendRow.previous.toFixed(1)}</li>
                <li>{copy.trendDelta}: {formatDelta(focusedTrendRow.delta, focusedTrendRow.percent)}</li>
                <li>{copy.focusWorkspaceTrendDirectionLabel}: {focusTrendDirectionLabel}</li>
              </ul>
            ) : (
              <p className="small muted" style={{ marginTop: 6 }}>
                {copy.focusWorkspaceNoMetricSelected}
              </p>
            )}
          </div>
        </section>
      ) : null}
      {analyticsMode && payrollRiskKpi ? (
        <AdminPayrollRiskKpiPanel copy={copy} snapshot={payrollRiskKpi} />
      ) : null}
      {analyticsMode && benefitsKpi ? <AdminBenefitsKpiPanel copy={copy} snapshot={benefitsKpi} /> : null}
      {analyticsMode && onboardingKpi ? <AdminOnboardingKpiPanel copy={copy} snapshot={onboardingKpi} /> : null}
      {analyticsMode && recruitmentKpi ? <AdminRecruitmentKpiPanel copy={copy} snapshot={recruitmentKpi} /> : null}
      {analyticsMode && noticesKpi ? <AdminNoticesKpiPanel copy={copy} snapshot={noticesKpi} /> : null}
      <section className="panel-grid">
        <AdminKpiTrendPanel copy={copy} rows={visibleTrendRows} />
        {showDevTools ? <AdminKpiLogsPanel copy={copy} logs={logs} /> : null}
      </section>
    </main>
  );
}
