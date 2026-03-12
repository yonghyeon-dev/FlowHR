import Link from "next/link";

type EmployeeStats = {
  successRate: number;
};

type EmployeeDashboardChromeProps = {
  showDevTools: boolean;
  isKoLocale: boolean;
  requiresLoginSession: boolean;
  productionSessionRequiredNotice: string;
  attendanceSummary: string;
  leaveBalanceLabel: string;
  pendingLeaveCount: number;
  stats: EmployeeStats;
  pendingLabel: string | null;
  variant?: "workspace" | "home";
};

export function EmployeeDashboardChrome({
  showDevTools,
  isKoLocale,
  requiresLoginSession,
  productionSessionRequiredNotice,
  attendanceSummary,
  leaveBalanceLabel,
  pendingLeaveCount,
  stats,
  pendingLabel,
  variant = "workspace"
}: EmployeeDashboardChromeProps) {
  const isHomeVariant = variant === "home";

  if (isHomeVariant) {
    return (
      <>
        <div className="page-header home-page-header">
          <div className="page-breadcrumb">
            <span>{isKoLocale ? "Employee Home" : "Employee Home"}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">{isKoLocale ? "오늘의 업무 홈" : "Today's work home"}</h1>
              <p className="page-subtitle">
                {isKoLocale
                  ? "오늘 처리할 요청, 일정, 문서와 계정 상태를 먼저 확인한 뒤 전용 워크스페이스로 이동하세요."
                  : "Start with today's requests, schedule, documents, and account status before moving into dedicated workspaces."}
              </p>
              <div className="hero-inline-meta">
                <span className="hero-inline-stat">
                  {isKoLocale ? "오늘 출퇴근" : "Attendance"} · {attendanceSummary}
                </span>
                <span className="hero-inline-stat">
                  {isKoLocale ? "잔여 휴가" : "Leave balance"} · {leaveBalanceLabel}
                </span>
                <span className="hero-inline-stat">
                  {isKoLocale ? "대기 요청" : "Pending"} · {pendingLeaveCount}
                </span>
              </div>
            </div>
            <div className="page-actions">
              <Link className="btn btn-primary" href="/employee/requests">
                {isKoLocale ? "요청 허브" : "Requests hub"}
              </Link>
              <Link className="btn btn-secondary" href="/employee/payslips?source=employee-dashboard">
                {isKoLocale ? "급여 명세서" : "Payslips"}
              </Link>
              <Link className="btn btn-secondary" href="/employee/contracts?source=employee-dashboard">
                {isKoLocale ? "전자계약" : "Contracts"}
              </Link>
            </div>
          </div>
        </div>

        {requiresLoginSession ? (
          <p className="small fail workspace-inline-status">
            {productionSessionRequiredNotice} <Link href="/login">/login</Link>
          </p>
        ) : null}

        <div className="content-grid cols-2-1 mb-6">
          <article className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="badge success">{isKoLocale ? "오늘 작업 상태" : "Today's status"}</div>
                  <div className="kpi-value" style={{ marginTop: "var(--sp-3)" }}>
                    {attendanceSummary}
                  </div>
                  <div className="kpi-label">
                    {pendingLabel ??
                      (isKoLocale ? "최근 작업 상태가 아직 없습니다." : "No recent activity yet.")}
                  </div>
                </div>
                <div className="hero-inline-stat">{stats.successRate}%</div>
              </div>
              <div className="page-actions">
                <Link className="btn btn-primary" href="/employee/attendance/correction">
                  {isKoLocale ? "근태 작업" : "Attendance"}
                </Link>
                <Link className="btn btn-secondary" href="/employee/leave/request">
                  {isKoLocale ? "휴가 작업" : "Leave"}
                </Link>
                <Link className="btn btn-secondary" href="/employee/schedule">
                  {isKoLocale ? "일정 보기" : "Schedule"}
                </Link>
              </div>
            </div>
          </article>

          <article className="card">
            <div className="card-header">
              <span className="card-title">{isKoLocale ? "오늘의 요약" : "Summary"}</span>
            </div>
            <div className="card-body">
              <div className="mini-stat-list">
                <div className="mini-stat-row">
                  <span>{isKoLocale ? "잔여 휴가" : "Leave balance"}</span>
                  <strong>{leaveBalanceLabel}</strong>
                </div>
                <div className="mini-stat-row">
                  <span>{isKoLocale ? "대기 요청" : "Pending leave"}</span>
                  <strong>{pendingLeaveCount}</strong>
                </div>
                <div className="mini-stat-row">
                  <span>{isKoLocale ? "요청 처리 성공률" : "Request success rate"}</span>
                  <strong>{stats.successRate}%</strong>
                </div>
              </div>
            </div>
          </article>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="page-header workspace-page-header employee-workspace-status-header">
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

      {requiresLoginSession ? (
        <p className="small fail workspace-inline-status">
          {productionSessionRequiredNotice} <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-grid cols-5">
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
