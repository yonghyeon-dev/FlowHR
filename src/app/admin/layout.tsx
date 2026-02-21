import Link from "next/link";
import type { ReactNode } from "react";

import SessionMenu from "@/components/SessionMenu";

type AdminLayoutProps = {
  children: ReactNode;
};

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const showDevTools = isDevToolsEnabled();

  return (
    <div className="saas-shell">
      <aside className="saas-sidebar">
        <div className="saas-brand">
          <Link href="/">FlowHR</Link>
          <span className="saas-badge">Admin</span>
        </div>

        <nav className="saas-nav" aria-label="관리자 네비게이션">
          <Link href="/admin">대시보드</Link>
          <Link href="/admin#approvals">승인 대기</Link>
          <Link href="/admin#aggregates">근태 집계</Link>
          <Link href="/admin#leave-policy">휴가 정책</Link>
          <Link href="/admin/leave-accrual">연차 자동 부여</Link>
          <Link href="/admin/leave-calendar">휴가 캘린더</Link>
          <Link href="/admin#payroll">급여</Link>
          <Link href="/admin/people">조직/인사</Link>
          <Link href="/admin/contracts">전자계약</Link>
          <Link href="/admin/approval-policy">결재 정책</Link>
        </nav>

        <div className="saas-sidebar-footer">
          <SessionMenu />
          <Link href="/employee">직원 포털</Link>
          {showDevTools ? (
            <>
              <Link className="muted-link" href="/ops/mvp-console">
                (dev) ops 콘솔
              </Link>
              <Link className="muted-link" href="/ops/leave-promotion">
                (dev) 연차촉진 공지
              </Link>
            </>
          ) : null}
        </div>
      </aside>

      <div className="saas-main">{children}</div>
    </div>
  );
}
