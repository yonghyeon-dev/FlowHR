import Link from "next/link";

import { getRequestLocale } from "@/lib/i18n/server";

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default async function HomePage() {
  const locale = await getRequestLocale();
  const isKoLocale = locale === "ko";
  const showDevTools = isDevToolsEnabled();

  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link className="landing-brand" href="/">
          Flow<span>HR</span>
        </Link>
        <div className="landing-nav-links">
          <Link href="/admin">{isKoLocale ? "관리자" : "Admin"}</Link>
          <Link href="/employee">{isKoLocale ? "직원" : "Employee"}</Link>
          <Link href="/employee/payslips">{isKoLocale ? "문서" : "Documents"}</Link>
        </div>
        <div className="landing-nav-actions">
          <Link className="btn btn-secondary" href="/login">
            {isKoLocale ? "로그인" : "Sign in"}
          </Link>
          <Link className="btn btn-primary" href="/admin">
            {isKoLocale ? "워크스페이스 열기" : "Open workspace"}
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-inner">
          <div className="hero-badge">
            {isKoLocale ? "운영형 HR SaaS 전환" : "Operational HR SaaS"}
          </div>
          <h1 className="hero-title">
            {isKoLocale ? (
              <>
                관리자와 직원이 같은 제품 안에서
                <br />
                <span className="accent">일을 끝내는</span> FlowHR
              </>
            ) : (
              <>
                One HR product where
                <br />
                <span className="accent">admins and employees finish work</span>
              </>
            )}
          </h1>
          <p className="hero-desc">
            {isKoLocale
              ? "근태, 휴가, 결재, 계약, 급여, 공지와 문서를 하나의 흐름으로 묶어 고객 관리자와 직원이 각자 필요한 작업만 빠르게 처리할 수 있게 합니다."
              : "Tie attendance, leave, approvals, contracts, payroll, notices, and documents into one operating flow for both customer admins and employees."}
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/admin">
              {isKoLocale ? "관리자 스테이션" : "Admin station"}
            </Link>
            <Link className="btn btn-secondary" href="/employee">
              {isKoLocale ? "직원 홈" : "Employee home"}
            </Link>
            <Link className="btn btn-secondary" href="/employee/payslips">
              {isKoLocale ? "문서 보기" : "Open documents"}
            </Link>
            <Link className="btn btn-secondary" href="/login">
              {isKoLocale ? "로그인" : "Sign in"}
            </Link>
          </div>
          <div className="hero-sub">
            {isKoLocale
              ? "역할마다 밀도와 우선순위는 다르지만 같은 제품 언어와 디자인 시스템을 공유합니다."
              : "Different role density, same product language and design system."}
          </div>
        </div>
      </section>

      <section className="landing-features">
        <h2 className="features-title">{isKoLocale ? "운영에 맞춘 구조" : "Built for operations"}</h2>
        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-icon teal">CT</div>
            <h3>{isKoLocale ? "Control Tower" : "Control tower"}</h3>
            <p>
              {isKoLocale
                ? "관리자는 오늘 처리해야 할 승인, 예외, 문서, 급여 작업을 한 곳에서 보고 우선순위대로 이동합니다."
                : "Admins review approvals, exceptions, documents, and payroll work in one prioritized lane."}
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon blue">RW</div>
            <h3>{isKoLocale ? "Route-first Workspace" : "Route-first workspaces"}</h3>
            <p>
              {isKoLocale
                ? "요약은 홈에서, 실제 처리와 입력은 전용 워크스페이스에서 끝내도록 분리합니다."
                : "Keep summaries on the home surface and finish real work in dedicated workspaces."}
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon amber">PL</div>
            <h3>{isKoLocale ? "제품 언어 정리" : "Product language"}</h3>
            <p>
              {isKoLocale
                ? "내부 ID와 기술 용어 대신 운영자와 직원이 이해하는 상태, 액션, 피드백으로 통일합니다."
                : "Replace internal identifiers and technical diagnostics with human-readable states and feedback."}
            </p>
          </article>
        </div>
      </section>

      <section className="landing-roles">
        <h2 className="roles-title">{isKoLocale ? "역할별 뷰" : "Views by role"}</h2>
        <p className="roles-subtitle">
          {isKoLocale
            ? "같은 제품 안에서 플랫폼 운영자, 고객사 관리자, 직원이 각자의 권한과 밀도로 일합니다."
            : "Platform operators, customer admins, and employees work in the same product with different permissions and density."}
        </p>
        <div className="roles-grid">
          <article className="role-card">
            <div className="role-avatar platform">PO</div>
            <h3>{isKoLocale ? "Platform Operator" : "Platform operator"}</h3>
            <p>
              {isKoLocale
                ? "ops 콘솔과 운영 도구는 고객 표면과 분리된 내부 뷰로 유지합니다."
                : "Keep ops consoles and platform tools on separate internal-only surfaces."}
            </p>
            <div className="role-modules">
              <span>ops</span>
              <span>support</span>
              <span>rollout</span>
            </div>
          </article>
          <article className="role-card">
            <div className="role-avatar admin">AD</div>
            <h3>{isKoLocale ? "Customer Admin" : "Customer admin"}</h3>
            <p>
              {isKoLocale
                ? "인사, 정책, 급여, 공지, 계약, 채용을 운영 스테이션에서 처리합니다."
                : "Operate people, policy, payroll, notices, contracts, and recruiting from one station."}
            </p>
            <div className="role-modules">
              <span>people</span>
              <span>payroll</span>
              <span>approvals</span>
            </div>
          </article>
          <article className="role-card">
            <div className="role-avatar employee">EM</div>
            <h3>{isKoLocale ? "Employee" : "Employee"}</h3>
            <p>
              {isKoLocale
                ? "오늘 할 일, 요청, 문서, 일정과 계정 상태를 가볍고 빠르게 처리합니다."
                : "Handle today's tasks, requests, documents, schedule, and account status with a lighter surface."}
            </p>
            <div className="role-modules">
              <span>today</span>
              <span>requests</span>
              <span>documents</span>
            </div>
          </article>
        </div>
      </section>

      <footer className="landing-footer">
        {showDevTools
          ? isKoLocale
            ? "개발자 도구는 별도 ops 표면에서만 노출됩니다."
            : "Developer tools remain on separate ops-only surfaces."
          : isKoLocale
            ? "고객사 운영 표면과 내부 운영 표면은 명확히 분리됩니다."
            : "Customer-facing and internal operating surfaces stay separated."}
      </footer>
    </main>
  );
}
