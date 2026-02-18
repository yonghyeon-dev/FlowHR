import Link from "next/link";
import type { ReactNode } from "react";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="saas-shell">
      <aside className="saas-sidebar">
        <div className="saas-brand">
          <Link href="/">FlowHR</Link>
          <span className="saas-badge">Admin</span>
        </div>

        <nav className="saas-nav" aria-label="관리자 네비게이션">
          <Link href="/admin">대시보드</Link>
          <Link href="/admin#onboarding">조직</Link>
          <Link href="/admin#people">직원</Link>
          <Link href="/admin#approvals">승인 대기</Link>
          <Link href="/admin#aggregates">근태 집계</Link>
          <Link href="/admin#leave-policy">휴가 정책</Link>
          <Link href="/admin#payroll">급여</Link>
          <Link className="muted-link" href="/admin#devtools">
            개발/디버그
          </Link>
        </nav>

        <div className="saas-sidebar-footer">
          <Link href="/employee">직원 포털</Link>
          <Link className="muted-link" href="/ops/mvp-console">
            (dev) ops 콘솔
          </Link>
          <Link className="muted-link" href="/login">
            로그인
          </Link>
        </div>
      </aside>

      <div className="saas-main">{children}</div>
    </div>
  );
}

