import Link from "next/link";

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function HomePage() {
  const showDevTools = isDevToolsEnabled();

  return (
    <main className="landing-page">
      <section className="hero-panel">
        <p className="eyebrow">FlowHR</p>
        <h1>한국형 HR SaaS MVP</h1>
        <p className="hero-copy">
          근태, 휴가, 급여, 결재를 한 제품 안에서 끝까지 연결합니다. (Shiftee/Flex 상위호환 목표)
        </p>
        <div className="hero-meta">
          <Link className="btn btn-primary" href="/admin">
            관리자 대시보드
          </Link>
          <Link className="btn btn-secondary" href="/employee">
            직원 포털
          </Link>
          <Link className="btn btn-secondary" href="/employee/payslips">
            급여 명세서
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>관리자 대시보드</h2>
          <p className="small">
            직원/조직, 승인 대기함(출퇴근·휴가), 근태 집계, 급여 프리뷰/확정까지 한 흐름으로 처리합니다.
          </p>
          <Link className="btn btn-primary" href="/admin">
            /admin 열기
          </Link>
        </article>

        <article className="panel">
          <h2>직원 포털</h2>
          <p className="small">
            출퇴근 기록, 휴가 신청/취소, 내 스케줄과 잔여 휴가, 급여 명세서까지 직원이 직접 처리합니다.
          </p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/employee">
              /employee
            </Link>
            <Link className="btn btn-secondary" href="/employee/payslips">
              /employee/payslips
            </Link>
          </div>
        </article>

        {showDevTools ? (
          <article className="panel">
            <h2>개발 도구</h2>
            <p className="small">
              운영/검증용 콘솔입니다. SaaS 사용자 UI와 분리되어야 하므로 기본 화면에서는 숨깁니다.
            </p>
            <div className="actions">
              <Link className="btn btn-secondary" href="/ops/admin-console">
                Admin Console (legacy)
              </Link>
              <Link className="btn btn-secondary" href="/ops/mvp-console">
                MVP Console
              </Link>
              <Link className="btn btn-secondary" href="/ops/scheduling-cockpit">
                Scheduling Cockpit
              </Link>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
