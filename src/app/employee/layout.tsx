import Link from "next/link";
import type { ReactNode } from "react";

import SessionMenu from "@/components/SessionMenu";

type EmployeeLayoutProps = {
  children: ReactNode;
};

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const showDevTools = isDevToolsEnabled();
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
          <Link href="/employee#leave-calendar">휴가 캘린더</Link>
          <Link href="/employee#schedule">스케줄</Link>
          <Link href="/employee/payslips">급여 명세서</Link>
          <Link className="muted-link" href="/employee#account">
            내 계정
          </Link>
        </nav>

        <div className="saas-sidebar-footer">
          <SessionMenu />
          {showDevTools ? <Link href="/admin">관리자</Link> : null}
        </div>
      </aside>

      <div className="saas-main">{children}</div>
    </div>
  );
}

