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
  const headerClassName = `page-header ${
    isHomeVariant
      ? "employee-home-hero"
      : "workspace-page-header employee-workspace-status-header"
  }`.trim();
  const actionsClassName = `page-actions ${
    isHomeVariant ? "employee-home-hero-actions" : ""
  }`.trim();
  const summaryStripClassName = `kpi-strip ${
    isHomeVariant
      ? "employee-home-status-strip"
      : "workspace-summary-strip employee-workspace-status-strip"
  }`.trim();
  const summaryCardClassName = `kpi-card ${
    isHomeVariant
      ? "employee-home-status-card"
      : "workspace-summary-card employee-workspace-status-card"
  }`.trim();

  return (
    <>
      <header className={headerClassName}>
        <div className={isHomeVariant ? "employee-home-hero-copy" : undefined}>
          {isHomeVariant ? <p className="eyebrow">employee today</p> : null}
          <h1 className="page-title">{isKoLocale ? "직원 포털" : "Employee Portal"}</h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "출퇴근 기록, 휴가 신청/취소, 내 스케줄 확인을 직원이 직접 처리합니다."
              : "Employees can handle attendance logs, leave requests/cancellations, and schedule checks."}
          </p>
          {isHomeVariant ? (
            <div className="employee-home-hero-meta">
              <span className="employee-home-chip">
                {isKoLocale ? "오늘 출퇴근" : "Today attendance"} · {attendanceSummary}
              </span>
              <span className="employee-home-chip">
                {isKoLocale ? "잔여 휴가" : "Leave balance"} · {leaveBalanceLabel}
              </span>
              <span className="employee-home-chip">
                {isKoLocale ? "대기 요청" : "Pending leave"} · {pendingLeaveCount}
              </span>
              <span className="employee-home-chip">
                {isKoLocale ? "최근 처리" : "Latest activity"} · {pendingLabel ?? "-"}
              </span>
            </div>
          ) : null}
        </div>
        <div className={actionsClassName}>
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

      <section className={summaryStripClassName}>
        <article className={summaryCardClassName}>
          <p>{isKoLocale ? "오늘 출퇴근" : "Today Attendance"}</p>
          <strong>{attendanceSummary}</strong>
        </article>
        <article className={summaryCardClassName}>
          <p>{isKoLocale ? "잔여 휴가" : "Leave Balance"}</p>
          <strong>{leaveBalanceLabel}</strong>
        </article>
        <article className={summaryCardClassName}>
          <p>{isKoLocale ? "휴가 대기" : "Pending Leave"}</p>
          <strong>{pendingLeaveCount}</strong>
        </article>
        <article className={summaryCardClassName}>
          <p>{isKoLocale ? "요청 처리 성공률" : "Request success rate"}</p>
          <strong>{stats.successRate}%</strong>
        </article>
        <article className={summaryCardClassName}>
          <p>{isKoLocale ? "최근 처리 작업" : "Latest activity"}</p>
          <strong>{pendingLabel ?? "-"}</strong>
        </article>
      </section>
    </>
  );
}
