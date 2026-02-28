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
        isKoLocale
          ? "로그인 세션이 필요합니다. /login에서 로그인해 주세요."
          : "Login session required. Please sign in at /login."
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

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{isKoLocale ? "관리자 대시보드" : "Admin Dashboard"}</h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "핵심 지표와 대기 업무를 확인하고, 각 전용 워크스페이스로 이동해 작업하세요."
              : "Review key metrics and work queues, then continue in dedicated workspaces."}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => void refreshSummary()} disabled={isLoading}>
            {isLoading ? (isKoLocale ? "불러오는 중..." : "Loading...") : isKoLocale ? "새로고침" : "Refresh"}
          </button>
          <Link className="btn btn-secondary" href="/employee">
            {isKoLocale ? "직원 포털" : "Employee Portal"}
          </Link>
          <Link className="btn btn-secondary" href="/login">
            {isKoLocale ? "로그인" : "Login"}
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

      <section className="panel-grid">
        <article className="panel">
          <h2>{isKoLocale ? "결재 대기함" : "Approval queue"}</h2>
          <p className="small muted">
            {isKoLocale
              ? "승인 실행 현황과 대기 건을 확인합니다."
              : "Review execution status and pending approvals."}
          </p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/admin/approval-executions">
              {isKoLocale ? "결재 실행 보기" : "Open approval executions"}
            </Link>
          </div>
        </article>

        <article className="panel">
          <h2>{isKoLocale ? "인사 관리" : "People management"}</h2>
          <p className="small muted">
            {isKoLocale
              ? "조직도, 직원 이력, 부서/직급 관리를 전용 화면에서 처리합니다."
              : "Manage org chart, employee history, departments, and positions in dedicated pages."}
          </p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/admin/people">
              {isKoLocale ? "인사 관리 열기" : "Open people workspace"}
            </Link>
            <Link className="btn btn-secondary" href="/admin/onboarding">
              {isKoLocale ? "온보딩/초대" : "Onboarding and invites"}
            </Link>
          </div>
        </article>

        <article className="panel">
          <h2>{isKoLocale ? "근무/휴가" : "Scheduling and leave"}</h2>
          <p className="small muted">
            {isKoLocale
              ? "근무 일정과 휴가 정책/발생/캘린더를 분리된 라우트에서 처리합니다."
              : "Manage schedules and leave policy/accrual/calendar in dedicated routes."}
          </p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/admin/scheduling">
              {isKoLocale ? "근무 일정" : "Scheduling workspace"}
            </Link>
            <Link className="btn btn-secondary" href="/admin/leave-accrual">
              {isKoLocale ? "연차 발생" : "Leave accrual"}
            </Link>
            <Link className="btn btn-secondary" href="/admin/leave-calendar">
              {isKoLocale ? "휴가 캘린더" : "Leave calendar"}
            </Link>
          </div>
        </article>

        <article className="panel">
          <h2>{isKoLocale ? "급여/연말정산" : "Payroll and year-end filing"}</h2>
          <p className="small muted">
            {isKoLocale
              ? "급여 정산, 명세서 배포, 연말정산/신고를 전용 콘솔에서 처리합니다."
              : "Run payroll settlement, payslip delivery, and year-end filing in dedicated consoles."}
          </p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/admin/payroll-year-end">
              {isKoLocale ? "연말정산 콘솔" : "Year-end console"}
            </Link>
            <Link className="btn btn-secondary" href="/admin/payroll-year-end-filing">
              {isKoLocale ? "신고 콘솔" : "Filing console"}
            </Link>
            <Link className="btn btn-secondary" href="/admin/payroll-payslip-delivery">
              {isKoLocale ? "명세서 배포" : "Payslip delivery"}
            </Link>
          </div>
        </article>

        <article className="panel">
          <h2>{isKoLocale ? "공지/복리후생/채용" : "Notices, benefits, recruitment"}</h2>
          <p className="small muted">
            {isKoLocale
              ? "직원 커뮤니케이션 및 지원 워크플로를 각각 분리된 화면에서 관리합니다."
              : "Manage communication and support workflows in dedicated workspaces."}
          </p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/admin/notices">
              {isKoLocale ? "공지" : "Notices"}
            </Link>
            <Link className="btn btn-secondary" href="/admin/benefits">
              {isKoLocale ? "복리후생" : "Benefits"}
            </Link>
            <Link className="btn btn-secondary" href="/admin/recruitment">
              {isKoLocale ? "채용" : "Recruitment"}
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
