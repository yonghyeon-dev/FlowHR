import Link from "next/link";

type ApiStats = {
  total: number;
  success: number;
  fail: number;
};

type LogStatusLabels = {
  success: string;
  fail: string;
};

type AdminDashboardChromeProps = {
  showDevTools: boolean;
  isKoLocale: boolean;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
  pendingAttendanceCount: number;
  pendingLeaveCount: number;
  previewedPayrollCount: number;
  stats: ApiStats;
  logStatusLabels: LogStatusLabels;
  pendingLabel: string | null;
  onRefreshDashboard: () => void;
};

export function AdminDashboardChrome({
  showDevTools,
  isKoLocale,
  isProductionRuntime,
  usesBearerToken,
  pendingAttendanceCount,
  pendingLeaveCount,
  previewedPayrollCount,
  stats,
  logStatusLabels,
  pendingLabel,
  onRefreshDashboard
}: AdminDashboardChromeProps) {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">{isKoLocale ? "관리자 대시보드" : "Admin Dashboard"}</h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "직원/조직 온보딩부터 승인 대기함 처리, 근태 집계 확인, 급여 프리뷰/확정까지 한 화면에서 처리합니다."
              : "Handle onboarding, approval queues, attendance aggregates, and payroll preview/confirm in one screen."}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={onRefreshDashboard}>
            {isKoLocale ? "대시보드 새로고침" : "Refresh Dashboard"}
          </button>
          <Link className="btn btn-secondary" href="/employee">
            {isKoLocale ? "직원 포털" : "Employee Portal"}
          </Link>
          <Link className="btn btn-secondary" href="/login">
            {isKoLocale ? "로그인" : "Login"}
          </Link>
          <Link className="btn btn-secondary" href="/">
            {isKoLocale ? "홈" : "Home"}
          </Link>
          {showDevTools ? (
            <Link className="btn btn-secondary" href="/ops/mvp-console">
              {isKoLocale ? "(개발) ops 콘솔" : "(dev) Ops Console"}
            </Link>
          ) : null}
        </div>
      </header>

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          {isKoLocale ? "현재 환경은 " : "Current environment is "}
          <strong>{isKoLocale ? "운영" : "production"}</strong>
          {isKoLocale
            ? ". API 호출을 위해 로그인 세션(Bearer 토큰)이 필요합니다: "
            : ". Login session (Bearer token) is required for API calls: "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>{isKoLocale ? "출퇴근 승인 대기" : "Pending Attendance Approvals"}</p>
          <strong>{pendingAttendanceCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "휴가 승인 대기" : "Pending Leave Approvals"}</p>
          <strong>{pendingLeaveCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "급여 프리뷰" : "Payroll Previews"}</p>
          <strong>{previewedPayrollCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "API 호출" : "API calls"}</p>
          <strong>
            {stats.total} ({logStatusLabels.success} {stats.success} / {logStatusLabels.fail} {stats.fail})
          </strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "최근 실행" : "Latest Call"}</p>
          <strong>{pendingLabel ?? "-"}</strong>
        </article>
      </section>
    </>
  );
}
