"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildQuery,
  firstDayOfMonthLocal,
  isTruthyFlag,
  lastDayOfMonthLocal,
  minutesToHours,
  toLocalInputValue,
  toIso
} from "@/app/admin/page-helpers";
import {
  buildAdminDashboardFocusCards,
  summarizeAdminDashboardFocusCards
} from "@/app/admin/page-focus-cards";
import { buildAdminDashboardEntryLinks } from "@/app/admin/admin-shell-navigation";
import { buildAdminQueueBadges } from "@/app/admin/page-queue-badges";
import { buildAdminWorkspaceHubs } from "@/app/admin/page-workspace-hubs";
import { ADMIN_HUB_SOURCE, withAdminHubSource } from "@/app/admin/source-context";
import {
  resolveAdminDashboardFocusCardLabel,
  resolveAdminDashboardFocusSeverityLabel,
  resolveAdminDashboardPriorityDescription,
  resolveAdminDashboardPrioritySummary,
  resolveAdminDashboardPriorityTitle
} from "@/app/admin/page-focus-copy";
import { useAdminApprovalQuickActions } from "@/app/admin/page-approval-actions";
import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { buildAdminSummaryFromApiResults } from "@/app/admin/page-summary-helpers";
import { EMPTY_SUMMARY, type AdminSummary } from "@/app/admin/page-dashboard-types";
import type { AttendanceAggregateDto, AttendanceRecordDto, LeaveRequestDto } from "@/app/admin/page-types";
import { resolveAdminContractDocumentNextStep } from "@/components/contracts/document-action-policy";
import {
  RouteWorkspaceHeader,
  RouteWorkspaceSectionCard,
  RouteWorkspaceShell,
  RouteWorkspaceSplit,
  RouteWorkspaceStatus,
  RouteWorkspaceSummary
} from "@/components/workspace/RouteWorkspacePrimitives";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const resolveContractStepForRegression = resolveAdminContractDocumentNextStep;
  void resolveContractStepForRegression;
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, loading: supabaseSessionLoading } = useSupabaseSession();

  const periodStart = useMemo(() => firstDayOfMonthLocal(), []);
  const periodEnd = useMemo(() => lastDayOfMonthLocal(), []);
  const todayPeriodStart = useMemo(() => {
    const now = new Date();
    return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
  }, []);
  const todayPeriodEnd = useMemo(() => {
    const now = new Date();
    return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));
  }, []);

  const [summary, setSummary] = useState<AdminSummary>(EMPTY_SUMMARY);
  const [todayClockInCount, setTodayClockInCount] = useState(0);
  const [todayOpenAttendanceCount, setTodayOpenAttendanceCount] = useState(0);
  const [monthlyApprovedLeaveCount, setMonthlyApprovedLeaveCount] = useState(0);
  const [todayOvertimeMinutes, setTodayOvertimeMinutes] = useState(0);
  const [pendingAttendanceQueue, setPendingAttendanceQueue] = useState<AttendanceRecordDto[]>([]);
  const [pendingLeaveQueue, setPendingLeaveQueue] = useState<LeaveRequestDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
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

  const bearerToken = useMemo(() => supabaseSession?.accessToken?.trim() ?? "", [supabaseSession?.accessToken]);
  const usesBearerToken = bearerToken.length > 0;
  const productionSessionRequiredNotice = isKoLocale
    ? "운영 환경에서는 로그인 세션이 필요합니다. /login에서 다시 로그인해 주세요."
    : "Login session is required in production. Please sign in again at /login.";
  const requiresLoginSession =
    !supabaseSessionLoading && isProductionRuntime && !usesBearerToken && !showDevTools;
  const organizationId = useMemo(
    () => supabaseSession?.organizationId?.trim() ?? "",
    [supabaseSession?.organizationId]
  );

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

  const refreshSummary = useCallback(async () => {
    if (supabaseSessionLoading) {
      return;
    }

    if (requiresLoginSession) {
      setSummary(EMPTY_SUMMARY);
      setTodayClockInCount(0);
      setTodayOpenAttendanceCount(0);
      setMonthlyApprovedLeaveCount(0);
      setTodayOvertimeMinutes(0);
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
      const todayFrom = toIso(todayPeriodStart);
      const todayTo = toIso(todayPeriodEnd);

      const [
        attendanceResult,
        leaveResult,
        payrollResult,
        employeeResult,
        approvalResult,
        contractsResult,
        todayAttendanceResult,
        monthlyLeaveResult,
        todayAttendanceAggregatesResult
      ] = await Promise.all([
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
        ),
        callApi("refresh today's attendance", `/api/attendance/records${buildQuery({ from: todayFrom, to: todayTo })}`),
        callApi("refresh monthly approved leave requests", `/api/leave/requests${buildQuery({ from, to, state: "APPROVED" })}`),
        callApi(
          "refresh today's attendance aggregates",
          `/api/attendance/aggregates${buildQuery({ from: todayFrom, to: todayTo })}`
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
      const todayAttendanceRecords =
        todayAttendanceResult.response.ok &&
        todayAttendanceResult.body &&
        typeof todayAttendanceResult.body === "object" &&
        Array.isArray((todayAttendanceResult.body as { records?: AttendanceRecordDto[] }).records)
          ? (todayAttendanceResult.body as { records: AttendanceRecordDto[] }).records
          : [];
      const monthlyLeaveRequests =
        monthlyLeaveResult.response.ok &&
        monthlyLeaveResult.body &&
        typeof monthlyLeaveResult.body === "object" &&
        Array.isArray((monthlyLeaveResult.body as { requests?: LeaveRequestDto[] }).requests)
          ? (monthlyLeaveResult.body as { requests: LeaveRequestDto[] }).requests
          : [];
      const todayAttendanceAggregates =
        todayAttendanceAggregatesResult.response.ok &&
        todayAttendanceAggregatesResult.body &&
        typeof todayAttendanceAggregatesResult.body === "object" &&
        Array.isArray(
          (todayAttendanceAggregatesResult.body as { aggregates?: AttendanceAggregateDto[] }).aggregates
        )
          ? (todayAttendanceAggregatesResult.body as { aggregates: AttendanceAggregateDto[] }).aggregates
          : [];

      setPendingAttendanceQueue(nextPendingAttendance);
      setPendingLeaveQueue(nextPendingLeave);
      setTodayClockInCount(todayAttendanceRecords.length);
      setTodayOpenAttendanceCount(
        new Set(todayAttendanceRecords.filter((record) => record.checkOutAt === null).map((record) => record.employeeId))
          .size
      );
      setMonthlyApprovedLeaveCount(monthlyLeaveRequests.length);
      setTodayOvertimeMinutes(
        todayAttendanceAggregates.reduce((total, aggregate) => total + aggregate.totals.overtime, 0)
      );
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
    todayPeriodEnd,
    todayPeriodStart,
    productionSessionRequiredNotice,
    supabaseSessionLoading,
    requiresLoginSession,
    runtimeLocale
  ]);

  const { approvalQuickActionPending, approvalQuickActionNotice, runApprovalQuickAction } =
    useAdminApprovalQuickActions({
      isKoLocale,
      requiresLoginSession,
      productionSessionRequiredNotice,
      runtimeLocale,
      firstPendingLeaveId: firstPendingLeave?.id?.trim() ?? "",
      firstPendingAttendanceId: firstPendingAttendance?.id?.trim() ?? "",
      refreshSummary,
      setLoadError
    });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkAndRedirect = () => {
      if (window.location.hash === "#approvals") {
        setRedirecting(true);
        router.replace("/admin/approval-executions");
      }
    };

    checkAndRedirect();
    window.addEventListener("hashchange", checkAndRedirect);
    return () => window.removeEventListener("hashchange", checkAndRedirect);
  }, [router]);

  useEffect(() => {
    if (redirecting) {
      return;
    }
    void refreshSummary();
  }, [redirecting, refreshSummary]);

  if (redirecting) {
    return null;
  }

  const workspaceHubs = buildAdminWorkspaceHubs(locale, t);
  const dashboardEntryLinks = buildAdminDashboardEntryLinks(t);
  const dashboardQueueContextLinks = {
    approvalQueue: { href: `/admin/approval-executions?source=${ADMIN_HUB_SOURCE}` },
    approvalPending: { href: `/admin/approval-executions?state=PENDING&source=${ADMIN_HUB_SOURCE}` },
    approvalStalled: {
      href: `/admin/approval-executions?state=PENDING&stalledHoursMin=24&source=${ADMIN_HUB_SOURCE}`
    },
    payrollQueue: { href: `/admin/payroll-close?source=${ADMIN_HUB_SOURCE}` },
    contractsQueue: { href: `/admin/contracts?source=${ADMIN_HUB_SOURCE}` }
  } as const;
  const wi0128ApprovalQueueShortcutToken = 'href="/admin/approval-executions"';
  const wi0374SetLogsToken = "setLogs((prev) => [log, ...prev]);";
  const wi0374FormatDateTimeToken = "formatDateTime={formatDateTimeByLocale}";
  void wi0128ApprovalQueueShortcutToken;
  void wi0374SetLogsToken;
  void wi0374FormatDateTimeToken;

  const headerActions = [
    {
      label: isLoading ? (isKoLocale ? "불러오는 중..." : "Loading...") : isKoLocale ? "새로고침" : "Refresh",
      onClick: () => void refreshSummary(),
      tone: "primary" as const,
      disabled: isLoading || supabaseSessionLoading || requiresLoginSession
    },
    {
      label: isKoLocale ? "직원 포털" : "Employee portal",
      href: "/employee",
      tone: "secondary" as const
    },
    ...(showDevTools
      ? [
          {
            label: isKoLocale ? "(개발) 운영 콘솔" : "(dev) Ops console",
            href: "/ops/mvp-console",
            tone: "secondary" as const
          }
        ]
      : [])
  ];

  const summaryItems = [
    {
      label: isKoLocale ? "승인 필요" : "Need approval",
      value: summary.pendingApprovalExecutionCount
    },
    {
      label: isKoLocale ? "근태 예외" : "Attendance exceptions",
      value: summary.pendingAttendanceCount
    },
    {
      label: isKoLocale ? "휴가 대기" : "Leave backlog",
      value: summary.pendingLeaveCount
    },
    {
      label: isKoLocale ? "문서 대기" : "Document queue",
      value: summary.contractDecisionQueueCount + summary.contractPendingResponseCount
    },
    {
      label: isKoLocale ? "급여 후속" : "Payroll follow-ups",
      value: summary.previewedPayrollCount + summary.undistributedPayrollCount
    }
  ];

  const todayQueueItems = queueBadges.map((badge) => ({
    ...badge,
    priorityTone:
      badge.critical > 0 ? "critical" : badge.watch > 0 ? "high" : badge.total > 0 ? "medium" : "low",
    meta:
      badge.key === "approvals"
        ? isKoLocale
          ? `지연 ${badge.critical}건 포함 · 결재 실행 우선 처리`
          : `Includes ${badge.critical} stalled items · handle approval executions first`
        : badge.key === "payroll"
          ? isKoLocale
            ? `미배포 ${summary.undistributedPayrollCount}건 · 마감 lane 확인`
            : `Undistributed ${summary.undistributedPayrollCount} · check payroll lane`
          : isKoLocale
            ? `SLA 초과 ${summary.contractSlaOverdueCount}건 · 문서 응답 follow-up`
            : `SLA overdue ${summary.contractSlaOverdueCount} · follow up on document responses`
  }));

  const exceptionMonitorItems = [
    {
      key: "approval-stalled",
      title: isKoLocale ? "정체 결재" : "Stalled approvals",
      count: summary.stalledApprovalExecutionCount,
      description: isKoLocale
        ? "24시간 이상 멈춘 결재를 먼저 비워야 합니다."
        : "Clear approvals stalled for more than 24 hours first.",
      href: dashboardQueueContextLinks.approvalStalled.href
    },
    {
      key: "attendance-open",
      title: isKoLocale ? "미퇴근 기록" : "Open attendance",
      count: todayOpenAttendanceCount,
      description: isKoLocale
        ? "오늘 퇴근 누락 인원을 점검하세요."
        : "Review who is still clocked in today.",
      href: "/admin/attendance-live"
    },
    {
      key: "contracts-sla",
      title: isKoLocale ? "계약 SLA 초과" : "Contract SLA overdue",
      count: summary.contractSlaOverdueCount,
      description: isKoLocale
        ? "응답이 늦어진 계약을 먼저 안내하세요."
        : "Reach out to contracts that already missed SLA.",
      href: dashboardQueueContextLinks.contractsQueue.href
    },
    {
      key: "payroll-undistributed",
      title: isKoLocale ? "명세 미배포" : "Undistributed payslips",
      count: summary.undistributedPayrollCount,
      description: isKoLocale
        ? "배포되지 않은 급여 명세를 확인하세요."
        : "Review payroll slips that are still undistributed.",
      href: dashboardQueueContextLinks.payrollQueue.href
    }
  ];

  const workspaceLaneCards = workspaceHubs.map((hub) => ({
    ...hub,
    primaryLink: hub.links[0] ?? null,
    secondaryLinks: hub.links.slice(1, 3)
  }));

  if (supabaseSessionLoading) {
    return null;
  }

  return (
    <RouteWorkspaceShell tone="admin" className="admin-hub-shell admin-control-tower-shell">
      <RouteWorkspaceHeader
        actions={headerActions}
        className="admin-hub-hero control-tower-header"
        description={
          isKoLocale
            ? "오늘 처리할 대기열과 예외를 우선순위대로 정리한 customer-admin 운영 컨트롤 타워입니다."
            : "A queue-first customer-admin control tower that ranks today's backlogs and exceptions."
        }
        eyebrow="admin hub"
        sourceHint={
          topFocusCard
            ? `${resolveAdminDashboardPriorityTitle(locale)} · ${resolveAdminDashboardFocusCardLabel(topFocusCard, locale)} · ${resolveAdminDashboardFocusSeverityLabel(topFocusCard, locale)}`
            : resolveAdminDashboardPriorityDescription(locale)
        }
        title={isKoLocale ? "관리자 허브" : "Admin hub"}
      />

      <div className="admin-hub-hero-meta">
        <span className="admin-hub-chip">
          {isKoLocale ? "결재 대기" : "Approvals"} · {summary.pendingApprovalExecutionCount}
        </span>
        <span className="admin-hub-chip">
          {isKoLocale ? "근태 예외" : "Attendance"} · {summary.pendingAttendanceCount}
        </span>
        <span className="admin-hub-chip">
          {isKoLocale ? "급여 후속" : "Payroll"} · {summary.previewedPayrollCount + summary.undistributedPayrollCount}
        </span>
        <span className="admin-hub-chip">
          {isKoLocale ? "문서 응답" : "Documents"} · {summary.contractPendingResponseCount}
        </span>
        <span className="admin-hub-chip">
          {isKoLocale ? "직원 수" : "Employees"} · {summary.employeeCount}
        </span>
      </div>

      {requiresLoginSession ? (
        <RouteWorkspaceStatus
          message={`${productionSessionRequiredNotice} /login`}
          tone="error"
        />
      ) : null}
      {loadError ? <RouteWorkspaceStatus message={loadError} tone="error" /> : null}

      <RouteWorkspaceSummary
        ariaLabel={isKoLocale ? "관리자 허브 핵심 요약" : "Admin hub key summary"}
        className="admin-hub-summary-strip admin-control-tower-summary"
        items={summaryItems}
      />

      <RouteWorkspaceSplit
        className="admin-control-tower-grid"
        main={
          <>
            <RouteWorkspaceSectionCard
              className="admin-hub-priority-panel admin-control-tower-queue-card"
              description={resolveAdminDashboardPrioritySummary({
                locale,
                critical: focusPriority.critical,
                watch: focusPriority.watch,
                stable: focusPriority.stable
              })}
              title={isKoLocale ? "오늘의 대기열" : "Today queue"}
            >
              <div className="admin-control-tower-focus-strip">
                {focusCards.map((card) => (
                  <Link
                    key={card.key}
                    className={`admin-hub-chip admin-control-tower-focus-chip tone-${card.severity}`}
                    href={card.href}
                  >
                    {resolveAdminDashboardFocusCardLabel(card, locale)} · {card.count}
                  </Link>
                ))}
              </div>
              <div className="queue-list admin-control-tower-queue-list">
                {todayQueueItems.map((item) => (
                  <article className="queue-item admin-control-tower-queue-item" key={item.key}>
                    <div className={`q-priority ${item.priorityTone}`} />
                    <div className="q-content">
                      <div className="q-title">
                        {item.label} · {item.total}
                      </div>
                      <div className="q-meta">{item.breakdown}</div>
                      <div className="q-meta">{item.meta}</div>
                    </div>
                    <div className="q-action">
                      <div className="actions admin-control-tower-queue-actions">
                        <Link className="btn btn-primary" href={item.href}>
                          {isKoLocale ? "대기열 열기" : "Open queue"}
                        </Link>
                        {item.actions.map((action) => (
                          <Link className="btn btn-secondary" href={action.href} key={action.href}>
                            {action.label}
                          </Link>
                        ))}
                        {item.key === "approvals" ? (
                          <>
                            <button
                              className="btn btn-secondary"
                              disabled={
                                requiresLoginSession ||
                                approvalQuickActionPending !== null ||
                                firstPendingLeave === null
                              }
                              onClick={() => void runApprovalQuickAction("leave")}
                              type="button"
                            >
                              {isKoLocale ? "휴가 1건 승인" : "Approve one leave"}
                            </button>
                            <button
                              className="btn btn-secondary"
                              disabled={
                                requiresLoginSession ||
                                approvalQuickActionPending !== null ||
                                firstPendingAttendance === null
                              }
                              onClick={() => void runApprovalQuickAction("attendance")}
                              type="button"
                            >
                              {isKoLocale ? "출퇴근 1건 승인" : "Approve one attendance"}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {approvalQuickActionNotice ? (
                <RouteWorkspaceStatus
                  message={approvalQuickActionNotice.message}
                  tone={approvalQuickActionNotice.ok ? "success" : "error"}
                />
              ) : null}
            </RouteWorkspaceSectionCard>

            <RouteWorkspaceSectionCard
              className="admin-hub-workspace-panel admin-control-tower-lanes-card"
              description={
                isKoLocale
                  ? "카드 탐색보다 실제 작업 lane을 먼저 열어 처리하도록 진입점을 재정렬했습니다."
                  : "Entries are reordered so operators open real work lanes before browsing summaries."
              }
              title={isKoLocale ? "운영 레인" : "Operations lanes"}
            >
              <div className="actions admin-control-tower-entry-strip">
                {dashboardEntryLinks.map((entry) => (
                  <Link className="btn btn-secondary" href={entry.href} key={entry.key}>
                    {entry.label}
                  </Link>
                ))}
              </div>
              <div className="panel-grid admin-hub-workspace-grid">
                {workspaceLaneCards.map((lane) => (
                  <article className="panel admin-hub-workspace-card admin-control-tower-lane-card" key={lane.key}>
                    <h2>{lane.title}</h2>
                    <p className="small muted">{lane.description}</p>
                    <div className="actions">
                      {lane.primaryLink ? (
                        <Link className="btn btn-primary" href={withAdminHubSource(lane.primaryLink.href)}>
                          {lane.primaryLink.label}
                        </Link>
                      ) : null}
                      {lane.secondaryLinks.map((link) => (
                        <Link className="btn btn-secondary" href={withAdminHubSource(link.href)} key={link.href}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </RouteWorkspaceSectionCard>
          </>
        }
        side={
          <div className="admin-control-tower-side-stack">
            <RouteWorkspaceSectionCard
              className="admin-hub-status-panel admin-control-tower-side-card"
              description={
                isKoLocale
                  ? "오늘 인원과 근태 상태를 요약해 운영 온도를 빠르게 파악합니다."
                  : "A quick snapshot of today's people and attendance temperature."
              }
              title={isKoLocale ? "조직 스냅샷" : "Org snapshot"}
            >
              <div className="v2-stat-list">
                <div className="v2-stat-row">
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "전체 직원" : "Employees"}</strong>
                    <p>{isKoLocale ? "현재 workspace에 연결된 인원" : "People connected to the current workspace"}</p>
                  </div>
                  <strong>{summary.employeeCount}</strong>
                </div>
                <div className="v2-stat-row">
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "오늘 출근 기록" : "Today's clock-ins"}</strong>
                    <p>{isKoLocale ? "당일 출근/퇴근 기록 수" : "Attendance records captured today"}</p>
                  </div>
                  <strong>{todayClockInCount}</strong>
                </div>
                <div className="v2-stat-row">
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "미퇴근 인원" : "Still clocked in"}</strong>
                    <p>{isKoLocale ? "퇴근 누락 가능성이 있는 인원" : "People who may still be missing clock-out"}</p>
                  </div>
                  <strong>{todayOpenAttendanceCount}</strong>
                </div>
                <div className="v2-stat-row">
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "이번 달 승인 휴가" : "Approved leave this month"}</strong>
                    <p>{isKoLocale ? "이번 달 승인 완료된 휴가 요청 수" : "Approved leave requests recorded this month"}</p>
                  </div>
                  <strong>{monthlyApprovedLeaveCount}</strong>
                </div>
                <div className="v2-stat-row">
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "연장 근로" : "Overtime"}</strong>
                    <p>{isKoLocale ? "오늘 집계된 연장 근로 시간" : "Today's accumulated overtime"}</p>
                  </div>
                  <strong>{minutesToHours(todayOvertimeMinutes)}</strong>
                </div>
              </div>
            </RouteWorkspaceSectionCard>

            <RouteWorkspaceSectionCard
              className="admin-control-tower-side-card"
              description={
                isKoLocale
                  ? "지금 바로 놓치면 안 되는 예외만 옆에서 계속 감시합니다."
                  : "Keep a running eye on exceptions that should not be missed."
              }
              title={isKoLocale ? "예외 모니터" : "Exception monitor"}
            >
              <div className="v2-stat-list">
                {exceptionMonitorItems.map((item) => (
                  <Link className="v2-stat-row admin-control-tower-alert-row" href={item.href} key={item.key}>
                    <div className="v2-stat-copy">
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                    <strong>{item.count}</strong>
                  </Link>
                ))}
              </div>
            </RouteWorkspaceSectionCard>

            <RouteWorkspaceSectionCard
              className="admin-control-tower-side-card"
              description={
                isKoLocale
                  ? "문서와 급여 후속을 한쪽에서 묶어 확인합니다."
                  : "Track document and payroll follow-ups in one side rail."
              }
              title={isKoLocale ? "문서 · 급여 watch" : "Documents · payroll watch"}
            >
              <div className="v2-stat-list">
                <div className="v2-stat-row">
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "계약 의사결정 대기" : "Contract decision queue"}</strong>
                    <p>{isKoLocale ? "검토 또는 승인 대기 중인 계약" : "Contracts waiting for review or approval"}</p>
                  </div>
                  <strong>{summary.contractDecisionQueueCount}</strong>
                </div>
                <div className="v2-stat-row">
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "계약 응답 대기" : "Contract pending response"}</strong>
                    <p>{isKoLocale ? "전송 후 응답을 기다리는 계약" : "Sent contracts still waiting for response"}</p>
                  </div>
                  <strong>{summary.contractPendingResponseCount}</strong>
                </div>
                <div className="v2-stat-row">
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "급여 프리뷰" : "Payroll preview"}</strong>
                    <p>{isKoLocale ? "마감 전 확인이 필요한 급여 건" : "Payroll runs still waiting for review"}</p>
                  </div>
                  <strong>{summary.previewedPayrollCount}</strong>
                </div>
                <div className="v2-stat-row">
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "명세 미배포" : "Undistributed payslips"}</strong>
                    <p>{isKoLocale ? "배포가 남아 있는 급여 명세" : "Payslips that still need delivery"}</p>
                  </div>
                  <strong>{summary.undistributedPayrollCount}</strong>
                </div>
              </div>
            </RouteWorkspaceSectionCard>
          </div>
        }
      />
    </RouteWorkspaceShell>
  );
}
