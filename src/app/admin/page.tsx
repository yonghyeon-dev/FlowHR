"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildQuery,
  firstDayOfMonthLocal,
  isTruthyFlag,
  lastDayOfMonthLocal,
  toIso
} from "@/app/admin/page-helpers";
import {
  buildAdminDashboardFocusCards,
  summarizeAdminDashboardFocusCards
} from "@/app/admin/page-focus-cards";
import { buildAdminWorkspaceHubs } from "@/app/admin/page-workspace-hubs";
import {
  resolveAdminDashboardFocusCardLabel,
  resolveAdminDashboardFocusSeverityLabel,
  resolveAdminDashboardPriorityDescription,
  resolveAdminDashboardPrioritySummary,
  resolveAdminDashboardPriorityTitle
} from "@/app/admin/page-focus-copy";
import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { resolveAdminContractDocumentNextStep } from "@/components/contracts/document-action-policy";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type ApprovalExecutionLite = { updatedAt: string };
type PayrollRunLite = {
  state: "PREVIEWED" | "CONFIRMED";
  payslipDistributedAt: string | null;
};
type ContractDocumentLite = {
  status:
    | "DRAFT"
    | "APPROVAL_REQUESTED"
    | "SENT"
    | "SIGNED"
    | "REJECTED"
    | "EXPIRED"
    | "RENEWED";
  approvalStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  requiresApproval: boolean;
  expiresAt: string | null;
};
const contractSlaTrackedStatuses = new Set<ContractDocumentLite["status"]>([
  "DRAFT",
  "APPROVAL_REQUESTED",
  "SENT"
]);
const contractDecisionQueueSteps = new Set([
  "REQUEST_APPROVAL",
  "APPROVE_OR_REJECT",
  "SEND_DOCUMENT"
]);

type AdminSummary = {
  pendingAttendanceCount: number;
  pendingLeaveCount: number;
  previewedPayrollCount: number;
  undistributedPayrollCount: number;
  pendingApprovalExecutionCount: number;
  stalledApprovalExecutionCount: number;
  contractDecisionQueueCount: number;
  contractSlaOverdueCount: number;
  employeeCount: number;
  refreshedAt: string | null;
};

const EMPTY_SUMMARY: AdminSummary = {
  pendingAttendanceCount: 0,
  pendingLeaveCount: 0,
  previewedPayrollCount: 0,
  undistributedPayrollCount: 0,
  pendingApprovalExecutionCount: 0,
  stalledApprovalExecutionCount: 0,
  contractDecisionQueueCount: 0,
  contractSlaOverdueCount: 0,
  employeeCount: 0,
  refreshedAt: null
};

export default function AdminDashboardPage() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();

  const periodStart = useMemo(() => firstDayOfMonthLocal(), []);
  const periodEnd = useMemo(() => lastDayOfMonthLocal(), []);

  const [summary, setSummary] = useState<AdminSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const focusCards = useMemo(() => buildAdminDashboardFocusCards(summary), [summary]);
  const focusPriority = useMemo(
    () => summarizeAdminDashboardFocusCards(focusCards),
    [focusCards]
  );
  const topFocusCard = focusCards[0] ?? null;
  const queueBadges = useMemo(
    () => [
      {
        key: "approvals",
        label: isKoLocale ? "결재 대기함" : "Approval queue",
        total: summary.pendingApprovalExecutionCount,
        critical: summary.stalledApprovalExecutionCount,
        watch: Math.max(
          summary.pendingApprovalExecutionCount - summary.stalledApprovalExecutionCount,
          0
        ),
        href: "/admin/approval-executions"
      },
      {
        key: "payroll",
        label: isKoLocale ? "급여 대기함" : "Payroll queue",
        total: summary.previewedPayrollCount + summary.undistributedPayrollCount,
        critical: summary.undistributedPayrollCount,
        watch: summary.previewedPayrollCount,
        href: "/admin/payroll-close"
      },
      {
        key: "contracts",
        label: isKoLocale ? "계약 대기함" : "Contract queue",
        total: summary.contractDecisionQueueCount,
        critical: summary.contractSlaOverdueCount,
        watch: Math.max(
          summary.contractDecisionQueueCount - summary.contractSlaOverdueCount,
          0
        ),
        href: "/admin/contracts"
      }
    ],
    [
      isKoLocale,
      summary.contractDecisionQueueCount,
      summary.contractSlaOverdueCount,
      summary.pendingApprovalExecutionCount,
      summary.previewedPayrollCount,
      summary.stalledApprovalExecutionCount,
      summary.undistributedPayrollCount
    ]
  );

  const bearerToken = supabaseSession?.accessToken?.trim() ?? "";
  const usesBearerToken = bearerToken.length > 0;
  const organizationId = supabaseSession?.organizationId?.trim() ?? "";
  const adminActorId = supabaseSession?.actorId?.trim() || "ADM-1001";

  const callApi = useCallback(
    async (label: string, path: string) => {
      return performAdminApiCall({
        label,
        method: "GET",
        path,
        usesBearerToken,
        bearerToken,
        adminActorId,
        organizationId,
        runtimeLocale
      });
    },
    [adminActorId, bearerToken, organizationId, runtimeLocale, usesBearerToken]
  );

  const refreshSummary = useCallback(async () => {
    if (isProductionRuntime && !usesBearerToken) {
      setSummary(EMPTY_SUMMARY);
      setLoadError(
        isKoLocale ? "로그인 세션이 필요합니다. /login에서 로그인해 주세요." : "Login session required. Please sign in at /login."
      );
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const from = toIso(periodStart);
      const to = toIso(periodEnd);

      const [attendanceResult, leaveResult, payrollResult, employeeResult, approvalResult, contractsResult] = await Promise.all([
        callApi("refresh pending attendance", `/api/attendance/records${buildQuery({ from, to, state: "PENDING" })}`),
        callApi("refresh pending leave", `/api/leave/requests${buildQuery({ from, to, state: "PENDING" })}`),
        callApi("refresh payroll runs", `/api/payroll/runs${buildQuery({ from, to })}`),
        callApi(
          "refresh employees",
          `/api/people/employees${buildQuery({ organizationId: organizationId || undefined })}`
        ),
        callApi(
          "refresh approval executions",
          `/api/approval/executions${buildQuery({
            organizationId: organizationId || undefined,
            state: "PENDING",
            asOf: to,
            limit: "500",
            sort: "priority_desc"
          })}`
        ),
        callApi(
          "refresh contracts",
          `/api/contracts/documents${buildQuery({ organizationId: organizationId || undefined })}`
        )
      ]);

      const pendingAttendanceCount = attendanceResult.response.ok
        ? Array.isArray((attendanceResult.body as { records?: unknown[] }).records)
          ? ((attendanceResult.body as { records?: unknown[] }).records ?? []).length
          : 0
        : 0;

      const pendingLeaveCount = leaveResult.response.ok
        ? Array.isArray((leaveResult.body as { requests?: unknown[] }).requests)
          ? ((leaveResult.body as { requests?: unknown[] }).requests ?? []).length
          : 0
        : 0;

      const payrollRuns = payrollResult.response.ok
        ? Array.isArray((payrollResult.body as { runs?: PayrollRunLite[] }).runs)
          ? ((payrollResult.body as { runs?: PayrollRunLite[] }).runs ?? [])
          : []
        : [];
      const previewedPayrollCount = payrollRuns.filter((run) => run.state === "PREVIEWED").length;
      const undistributedPayrollCount = payrollRuns.filter(
        (run) => run.state === "CONFIRMED" && !run.payslipDistributedAt
      ).length;

      const approvalExecutions = approvalResult.response.ok
        ? Array.isArray((approvalResult.body as { executions?: ApprovalExecutionLite[] }).executions)
          ? ((approvalResult.body as { executions?: ApprovalExecutionLite[] }).executions ?? [])
          : []
        : [];
      const asOfMillis = new Date(to).getTime();
      const stalledApprovalExecutionCount = approvalExecutions.filter((execution) => {
        const updatedAtMillis = new Date(execution.updatedAt).getTime();
        if (!Number.isFinite(updatedAtMillis)) {
          return false;
        }
        const stalledHours = (asOfMillis - updatedAtMillis) / (1000 * 60 * 60);
        return stalledHours >= 24;
      }).length;

      const contractDocuments = contractsResult.response.ok
        ? Array.isArray((contractsResult.body as { documents?: ContractDocumentLite[] }).documents)
          ? ((contractsResult.body as { documents?: ContractDocumentLite[] }).documents ?? [])
          : []
        : [];
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

      const employeeCount = employeeResult.response.ok
        ? Array.isArray((employeeResult.body as { employees?: unknown[] }).employees)
          ? ((employeeResult.body as { employees?: unknown[] }).employees ?? []).length
          : 0
        : 0;

      setSummary({
        pendingAttendanceCount,
        pendingLeaveCount,
        previewedPayrollCount,
        undistributedPayrollCount,
        pendingApprovalExecutionCount: approvalExecutions.length,
        stalledApprovalExecutionCount,
        contractDecisionQueueCount,
        contractSlaOverdueCount,
        employeeCount,
        refreshedAt: new Date().toLocaleString(runtimeLocale)
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [callApi, isKoLocale, isProductionRuntime, organizationId, periodEnd, periodStart, runtimeLocale, usesBearerToken]);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  const workspaceHubs = buildAdminWorkspaceHubs(isKoLocale);

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{isKoLocale ? "관리자 대시보드" : "Admin Dashboard"}</h1>
          <p className="page-subtitle">
            {isKoLocale ? "핵심 지표와 대기 업무를 확인하고, 각 전용 워크스페이스로 이동해 작업하세요." : "Review key metrics and work queues, then continue in dedicated workspaces."}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => void refreshSummary()} disabled={isLoading}>
            {isLoading ? (isKoLocale ? "불러오는 중..." : "Loading...") : isKoLocale ? "새로고침" : "Refresh"}
          </button>
          <Link className="btn btn-secondary" href="/employee">
            {isKoLocale ? "직원 포털" : "Employee Portal"}
          </Link>
          {showDevTools ? (
            <Link className="btn btn-secondary" href="/ops/mvp-console">
              {isKoLocale ? "(개발) 운영 콘솔" : "(dev) Ops Console"}
            </Link>
          ) : null}
        </div>
      </header>

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small fail">
          {isKoLocale ? "운영 환경에서는 로그인 세션이 필요합니다. " : "Login session is required in production. "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      {loadError ? <p className="small fail">{loadError}</p> : null}

      <section className="panel">
        <h2>{resolveAdminDashboardPriorityTitle(locale)}</h2>
        <p className="small muted">
          {resolveAdminDashboardPriorityDescription(locale)}
        </p>
        <p className="small muted">
          {resolveAdminDashboardPrioritySummary({
            locale,
            critical: focusPriority.critical,
            watch: focusPriority.watch,
            stable: focusPriority.stable
          })}
        </p>
        <div className="actions">
          <Link className="btn btn-secondary" href="/admin/approval-executions">
            {isKoLocale ? "결재 대기 바로가기" : "Open approval queue"}
          </Link>
          {focusCards.map((card) => (
            <Link
              key={card.key}
              className={card.severity === "critical" ? "btn btn-primary" : "btn btn-secondary"}
              href={card.href}
            >
              {resolveAdminDashboardFocusCardLabel(card, locale)} ({card.count}) -{" "}
              {resolveAdminDashboardFocusSeverityLabel(card, locale)}
            </Link>
          ))}
        </div>
      </section>

      {topFocusCard ? (
        <section className="panel">
          <h2>{isKoLocale ? "오늘의 우선 처리" : "Today's top priority"}</h2>
          <p className="small muted">
            {isKoLocale
              ? "현재 대기량과 위험도를 기준으로 첫 번째 처리 대상을 제안합니다."
              : "The highest-priority queue is suggested from current backlog volume and risk."}
          </p>
          <p className="small">
            <strong>{resolveAdminDashboardFocusCardLabel(topFocusCard, locale)}</strong>
            {" · "}
            {resolveAdminDashboardFocusSeverityLabel(topFocusCard, locale)}
            {" · "}
            {topFocusCard.count}
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href={topFocusCard.href}>
              {isKoLocale ? "우선 작업 열기" : "Open priority workspace"}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>{isKoLocale ? "핵심 대기함 배지" : "Core queue badges"}</h2>
        <p className="small muted">
          {isKoLocale
            ? "결재·급여·계약 대기함의 총 건수와 위험 수준(긴급/주의)을 한 번에 확인하세요."
            : "Track approval, payroll, and contract queue load with critical/watch risk badges."}
        </p>
        <div className="kpi-strip">
          {queueBadges.map((badge) => (
            <article className="kpi-card" key={badge.key}>
              <p>{badge.label}</p>
              <strong>{badge.total}</strong>
              <small>
                {isKoLocale
                  ? `긴급 ${badge.critical} · 주의 ${badge.watch}`
                  : `Critical ${badge.critical} · Watch ${badge.watch}`}
              </small>
              <div className="actions" style={{ marginTop: 8 }}>
                <Link className="btn btn-secondary btn-small" href={badge.href}>
                  {isKoLocale ? "대기함 열기" : "Open queue"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>{isKoLocale ? "출퇴근 승인 대기" : "Pending attendance approvals"}</p>
          <strong>{summary.pendingAttendanceCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "휴가 승인 대기" : "Pending leave approvals"}</p>
          <strong>{summary.pendingLeaveCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "급여 프리뷰 대기" : "Pending payroll previews"}</p>
          <strong>{summary.previewedPayrollCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "직원 수" : "Employees"}</p>
          <strong>{summary.employeeCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "최근 갱신" : "Last refreshed"}</p>
          <strong>{summary.refreshedAt ?? "-"}</strong>
        </article>
      </section>

      <section className="panel">
        <h2>{isKoLocale ? "핵심 워크스페이스 허브" : "Core workspace hub"}</h2>
        <p className="small muted">
          {isKoLocale
            ? "관리자 홈에서는 요약만 확인하고, 상세 작업은 각 전용 워크스페이스에서 처리하세요."
            : "Use the dashboard for summary only and continue detailed work in dedicated routes."}
        </p>
        <div className="actions">
          <Link className="btn btn-secondary" href="/admin/people">
            {isKoLocale ? "인사 워크스페이스" : "People workspace"}
          </Link>
          <Link className="btn btn-secondary" href="/admin/scheduling">
            {isKoLocale ? "근무 일정" : "Scheduling"}
          </Link>
          <Link className="btn btn-secondary" href="/admin/payroll-year-end">
            {isKoLocale ? "연말정산" : "Year-end payroll"}
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        {workspaceHubs.map((hub) => (
          <article className="panel" key={hub.key}>
            <h2>{hub.title}</h2>
            <p className="small muted">{hub.description}</p>
            <div className="actions">
              {hub.links.map((link, index) => (
                <Link
                  className={index === 0 ? "btn btn-primary" : "btn btn-secondary"}
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
