import Link from "next/link";
import type { ReactNode } from "react";

type EmployeeLayoutProps = {
  children: ReactNode;
};

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  return (
    <div className="saas-shell">
      <aside className="saas-sidebar">
        <div className="saas-brand">
          <Link href="/">FlowHR</Link>
          <span className="saas-badge">Employee</span>
        </div>

        <nav className="saas-nav" aria-label="직원 네비게이션">
          <Link href="/employee">오늘</Link>
          <Link href="/employee#attendance">출퇴근</Link>
          <Link href="/employee#leave">휴가</Link>
          <Link href="/employee#schedule">스케줄</Link>
          <Link href="/employee/payslips">급여 명세서</Link>
          <Link className="muted-link" href="/employee#devtools">
            개발/디버그
          </Link>
        </nav>

        <div className="saas-sidebar-footer">
          <Link href="/admin">관리자</Link>
          <Link className="muted-link" href="/login">
            로그인
          </Link>
        </div>
      </aside>

      <div className="saas-main">{children}</div>
    </div>
  );
}

