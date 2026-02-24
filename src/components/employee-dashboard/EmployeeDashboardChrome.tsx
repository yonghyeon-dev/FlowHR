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
          <h1 className="page-title">직원 포털</h1>
          <p className="page-subtitle">출퇴근 기록, 휴가 신청/취소, 내 스케줄 확인을 직원이 직접 처리합니다.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee/payslips">
            급여 명세서
          </Link>
          <Link className="btn btn-secondary" href="/login">
            로그인
          </Link>
          <Link className="btn btn-secondary" href="/admin">
            관리자
          </Link>
          <Link className="btn btn-secondary" href="/">
            홈
          </Link>
          {showDevTools ? (
            <Link className="btn btn-secondary" href="/ops/mvp-console">
              (dev) ops 콘솔
            </Link>
          ) : null}
        </div>
      </header>

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          {isKoLocale ? "현재 환경은 " : "Current environment is "}
          <strong>{isKoLocale ? "운영(production)" : "production"}</strong>
          {isKoLocale
            ? "입니다. 출퇴근/휴가 API 호출을 위해 로그인 세션(Bearer 토큰)이 필요합니다: "
            : ". Login session (Bearer token) is required for attendance/leave API calls: "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>오늘 출퇴근</p>
          <strong>{attendanceSummary}</strong>
        </article>
        <article className="kpi-card">
          <p>잔여 휴가</p>
          <strong>{leaveBalanceLabel}</strong>
        </article>
        <article className="kpi-card">
          <p>휴가 대기</p>
          <strong>{pendingLeaveCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "API 성공률" : "API success rate"}</p>
          <strong>{stats.successRate}%</strong>
        </article>
        <article className="kpi-card">
          <p>최근 실행</p>
          <strong>{pendingLabel ?? "-"}</strong>
        </article>
      </section>
    </>
  );
}
