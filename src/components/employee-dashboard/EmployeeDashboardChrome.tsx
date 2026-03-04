import Link from "next/link";

type EmployeeStats = {
  successRate: number;
};

type EmployeeDashboardChromeProps = {
  showDevTools: boolean;
  isKoLocale: boolean;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
  attendanceSummary: string;
  leaveBalanceLabel: string;
  pendingLeaveCount: number;
  stats: EmployeeStats;
  pendingLabel: string | null;
};

export function EmployeeDashboardChrome({
  showDevTools,
  isKoLocale,
  isProductionRuntime,
  usesBearerToken,
  attendanceSummary,
  leaveBalanceLabel,
  pendingLeaveCount,
  stats,
  pendingLabel
}: EmployeeDashboardChromeProps) {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">{isKoLocale ? "직원 포털" : "Employee Portal"}</h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "출퇴근 기록, 휴가 신청/취소, 내 스케줄 확인을 직원이 직접 처리합니다."
              : "Employees can handle attendance logs, leave requests/cancellations, and schedule checks."}
          </p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee/payslips?source=employee-dashboard">
            {isKoLocale ? "급여 명세서" : "Payslips"}
          </Link>
          <Link className="btn btn-secondary" href="/employee/contracts?source=employee-dashboard">
            {isKoLocale ? "전자계약함" : "Contracts"}
          </Link>
          <Link className="btn btn-secondary" href="/">
            {isKoLocale ? "홈" : "Home"}
          </Link>
          {showDevTools ? (
            <Link className="btn btn-secondary" href="/admin">
              {isKoLocale ? "(개발) 관리자" : "(dev) Admin"}
            </Link>
          ) : null}
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
            ? "입니다. 출퇴근/휴가 API 호출을 위해 로그인 세션(Bearer 토큰)이 필요합니다: "
            : ". Login session (Bearer token) is required for attendance/leave API calls: "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>{isKoLocale ? "오늘 출퇴근" : "Today Attendance"}</p>
          <strong>{attendanceSummary}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "잔여 휴가" : "Leave Balance"}</p>
          <strong>{leaveBalanceLabel}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "휴가 대기" : "Pending Leave"}</p>
          <strong>{pendingLeaveCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "요청 처리 성공률" : "Request success rate"}</p>
          <strong>{stats.successRate}%</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "최근 처리 작업" : "Latest activity"}</p>
          <strong>{pendingLabel ?? "-"}</strong>
        </article>
      </section>
    </>
  );
}
