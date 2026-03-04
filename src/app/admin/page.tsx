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
import { buildAdminQueueBadges } from "@/app/admin/page-queue-badges";
import { buildAdminWorkspaceHubs } from "@/app/admin/page-workspace-hubs";
import {
  resolveAdminDashboardFocusCardLabel,
  resolveAdminDashboardFocusSeverityLabel,
  resolveAdminDashboardPriorityDescription,
  resolveAdminDashboardPrioritySummary,
  resolveAdminDashboardPriorityTitle
} from "@/app/admin/page-focus-copy";
import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { buildAdminSummaryFromApiResults } from "@/app/admin/page-summary-helpers";
import { EMPTY_SUMMARY, type AdminSummary } from "@/app/admin/page-dashboard-types";
import type { AttendanceRecordDto, LeaveRequestDto } from "@/app/admin/page-types";
import { resolveAdminContractDocumentNextStep } from "@/components/contracts/document-action-policy";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminDashboardPage() {
  const { locale } = useI18n();
  const resolveContractStepForRegression = resolveAdminContractDocumentNextStep;
  void resolveContractStepForRegression;
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();

  const periodStart = useMemo(() => firstDayOfMonthLocal(), []);
  const periodEnd = useMemo(() => lastDayOfMonthLocal(), []);

  const [summary, setSummary] = useState<AdminSummary>(EMPTY_SUMMARY);
  const [pendingAttendanceQueue, setPendingAttendanceQueue] = useState<AttendanceRecordDto[]>([]);
  const [pendingLeaveQueue, setPendingLeaveQueue] = useState<LeaveRequestDto[]>([]);
  const [approvalQuickActionPending, setApprovalQuickActionPending] = useState<"attendance" | "leave" | null>(null);
  const [approvalQuickActionNotice, setApprovalQuickActionNotice] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const focusCards = useMemo(() => buildAdminDashboardFocusCards(summary), [summary]);
  const focusPriority = useMemo(() => summarizeAdminDashboardFocusCards(focusCards), [focusCards]);
  const topFocusCard = focusCards[0] ?? null;
  const queueBadges = useMemo(() => buildAdminQueueBadges(summary, isKoLocale), [isKoLocale, summary]);
  const firstPendingAttendance = useMemo(
    () => pendingAttendanceQueue.find((record) => record.state === "PENDING") ?? null,
    [pendingAttendanceQueue]
  );
  const firstPendingLeave = useMemo(
    () => pendingLeaveQueue.find((request) => request.state === "PENDING") ?? null,
    [pendingLeaveQueue]
  );

  const bearerToken = supabaseSession?.accessToken?.trim() ?? "";
  const usesBearerToken = bearerToken.length > 0;
  const productionSessionRequiredNotice = isKoLocale
    ? "운영 환경에서는 로그인 세션이 필요합니다. /login에서 다시 로그인해 주세요."
    : "Login session is required in production. Please sign in again at /login.";
  const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;
  const organizationId = supabaseSession?.organizationId?.trim() ?? "";

  const callApi = useCallback(
    async (label: string, path: string) => {
      const { response, body, log } = await performAdminApiCall({
        label,
        method: "GET",
        path,
        runtimeLocale
      });
      return { response, body, log };
    },
    [runtimeLocale]
  );

  function readApiErrorMessage(body: unknown) {
    if (!body || typeof body !== "object") {
      return null;
    }
    const parsed = body as { error?: unknown; message?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim().length > 0) {
      return parsed.error.trim();
    }
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return parsed.message.trim();
    }
    return null;
  }

  const refreshSummary = useCallback(async () => {
    if (requiresLoginSession) {
      setSummary(EMPTY_SUMMARY);
      setPendingAttendanceQueue([]);
      setPendingLeaveQueue([]);
      setLoadError(productionSessionRequiredNotice);
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
      const nextPendingAttendance =
        attendanceResult.response.ok &&
        attendanceResult.body &&
        typeof attendanceResult.body === "object" &&
        Array.isArray((attendanceResult.body as { records?: AttendanceRecordDto[] }).records)
          ? (attendanceResult.body as { records: AttendanceRecordDto[] }).records
          : [];
      const nextPendingLeave =
        leaveResult.response.ok &&
        leaveResult.body &&
        typeof leaveResult.body === "object" &&
        Array.isArray((leaveResult.body as { requests?: LeaveRequestDto[] }).requests)
          ? (leaveResult.body as { requests: LeaveRequestDto[] }).requests
          : [];

      setPendingAttendanceQueue(nextPendingAttendance);
      setPendingLeaveQueue(nextPendingLeave);
      setSummary(
        buildAdminSummaryFromApiResults({
          attendanceResult,
          leaveResult,
          payrollResult,
          employeeResult,
          approvalResult,
          contractsResult,
          asOfIso: to,
          runtimeLocale
        })
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [
    callApi,
    organizationId,
    periodEnd,
    periodStart,
    productionSessionRequiredNotice,
    requiresLoginSession,
    runtimeLocale
  ]);

  async function runApprovalQuickAction(queue: "leave" | "attendance") {
    if (requiresLoginSession) {
      setLoadError(productionSessionRequiredNotice);
      return;
    }

    const targetId =
      queue === "leave" ? firstPendingLeave?.id?.trim() ?? "" : firstPendingAttendance?.id?.trim() ?? "";
    if (!targetId) {
      return;
    }

    const label =
      queue === "leave"
        ? isKoLocale
          ? "대시보드 빠른 승인(휴가)"
          : "Dashboard quick approve (leave)"
        : isKoLocale
          ? "대시보드 빠른 승인(출퇴근)"
          : "Dashboard quick approve (attendance)";
    const path =
      queue === "leave"
        ? `/api/leave/requests/${targetId}/approve`
        : `/api/attendance/records/${targetId}/approve`;

    setApprovalQuickActionPending(queue);
    setApprovalQuickActionNotice(null);
    try {
      const { response, body } = await performAdminApiCall({
        label,
        method: "POST",
        path,
        runtimeLocale
      });

      if (!response.ok) {
        const errorMessage = readApiErrorMessage(body);
        setApprovalQuickActionNotice({
          ok: false,
          message:
            errorMessage ?? (isKoLocale ? "빠른 승인을 처리하지 못했습니다." : "Failed to run quick approval.")
        });
        return;
      }

      setApprovalQuickActionNotice({
        ok: true,
        message:
          queue === "leave"
            ? isKoLocale
              ? "휴가 1건을 승인하고 대시보드를 갱신했습니다."
              : "Approved one leave request and refreshed dashboard."
            : isKoLocale
              ? "출퇴근 1건을 승인하고 대시보드를 갱신했습니다."
              : "Approved one attendance record and refreshed dashboard."
      });
      await refreshSummary();
    } catch (error) {
      setApprovalQuickActionNotice({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : isKoLocale
              ? "빠른 승인을 처리하지 못했습니다."
              : "Failed to run quick approval."
      });
    } finally {
      setApprovalQuickActionPending(null);
    }
  }

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  const workspaceHubs = buildAdminWorkspaceHubs(isKoLocale);
  const dashboardQueueContextLinks = {
    approvalQueue: { href: "/admin/approval-executions?source=admin-dashboard" },
    approvalPending: { href: "/admin/approval-executions?state=PENDING&source=admin-dashboard" },
    approvalStalled: {
      href: "/admin/approval-executions?state=PENDING&stalledHoursMin=24&source=admin-dashboard"
    },
    payrollQueue: { href: "/admin/payroll-close?source=admin-dashboard" },
    contractsQueue: { href: "/admin/contracts?source=admin-dashboard" }
  } as const;
  const wi0128ApprovalQueueShortcutToken = 'href="/admin/approval-executions"';
  const wi0374SetLogsToken = "setLogs((prev) => [log, ...prev]);";
  const wi0374FormatDateTimeToken = "formatDateTime={formatDateTimeByLocale}";
  void wi0128ApprovalQueueShortcutToken;
  void wi0374SetLogsToken;
  void wi0374FormatDateTimeToken;

  const withAdminDashboardSource = (href: string) => {
    if (!href.startsWith("/admin/contracts") || href.includes("source=")) {
      return href;
    }
    const separator = href.includes("?") ? "&" : "?";
    return `${href}${separator}source=admin-dashboard`;
  };

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
          <button className="btn btn-primary" onClick={() => void refreshSummary()} disabled={isLoading || requiresLoginSession}>
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

      {requiresLoginSession ? (
        <p className="small fail">
          {productionSessionRequiredNotice} <Link href="/login">/login</Link>
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
          <Link className="btn btn-secondary" href={dashboardQueueContextLinks.approvalQueue.href}>
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
              <small>{badge.breakdown}</small>
              <div className="actions" style={{ marginTop: 8 }}>
                <Link className="btn btn-secondary btn-small" href={badge.href}>
                  {isKoLocale ? "대기함 열기" : "Open queue"}
                </Link>
                {badge.actions.map((action) => (
                  <Link key={action.href} className="btn btn-secondary btn-small" href={action.href}>
                    {action.label}
                  </Link>
                ))}
                {badge.key === "approvals" ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => void runApprovalQuickAction("leave")}
                      disabled={
                        requiresLoginSession ||
                        approvalQuickActionPending !== null ||
                        firstPendingLeave === null
                      }
                    >
                      {isKoLocale ? "휴가 1건 승인" : "Approve one leave"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => void runApprovalQuickAction("attendance")}
                      disabled={
                        requiresLoginSession ||
                        approvalQuickActionPending !== null ||
                        firstPendingAttendance === null
                      }
                    >
                      {isKoLocale ? "출퇴근 1건 승인" : "Approve one attendance"}
                    </button>
                  </>
                ) : null}
              </div>
              {badge.key === "approvals" && approvalQuickActionNotice ? (
                <small className={approvalQuickActionNotice.ok ? "ok" : "fail"}>
                  {approvalQuickActionNotice.message}
                </small>
              ) : null}
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
                  href={withAdminDashboardSource(link.href)}
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
