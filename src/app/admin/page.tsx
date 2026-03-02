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
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type AdminSummary = {
  pendingAttendanceCount: number;
  pendingLeaveCount: number;
  previewedPayrollCount: number;
  employeeCount: number;
  refreshedAt: string | null;
};

const EMPTY_SUMMARY: AdminSummary = {
  pendingAttendanceCount: 0,
  pendingLeaveCount: 0,
  previewedPayrollCount: 0,
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

      const [attendanceResult, leaveResult, payrollResult, employeeResult] = await Promise.all([
        callApi("refresh pending attendance", `/api/attendance/records${buildQuery({ from, to, state: "PENDING" })}`),
        callApi("refresh pending leave", `/api/leave/requests${buildQuery({ from, to, state: "PENDING" })}`),
        callApi("refresh previewed payroll", `/api/payroll/runs${buildQuery({ from, to, state: "PREVIEWED" })}`),
        callApi(
          "refresh employees",
          `/api/people/employees${buildQuery({ organizationId: organizationId || undefined })}`
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

      const previewedPayrollCount = payrollResult.response.ok
        ? Array.isArray((payrollResult.body as { runs?: unknown[] }).runs)
          ? ((payrollResult.body as { runs?: unknown[] }).runs ?? []).length
          : 0
        : 0;

      const employeeCount = employeeResult.response.ok
        ? Array.isArray((employeeResult.body as { employees?: unknown[] }).employees)
          ? ((employeeResult.body as { employees?: unknown[] }).employees ?? []).length
          : 0
        : 0;

      setSummary({
        pendingAttendanceCount,
        pendingLeaveCount,
        previewedPayrollCount,
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
