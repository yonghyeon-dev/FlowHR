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
          <Link href="/employee#self-service-overview">통합 요약</Link>
          <Link href="/employee#submit-checklist">제출 체크리스트</Link>
          <Link href="/employee#request-feedback">요청 피드백</Link>
          <Link href="/employee#request-bottleneck-feedback">병목 피드백</Link>
          <Link href="/employee#mobile-shortcuts">모바일 단축</Link>
          <Link href="/employee#mobile-status-badges">모바일 배지</Link>
          <Link href="/employee#mobile-submit-guide">모바일 제출 가이드</Link>
          <Link href="/employee#request-timeline">요청 타임라인</Link>
          <Link href="/employee#request-resubmit">재제출 흐름</Link>
          <Link href="/employee#attendance">출퇴근</Link>
          <Link href="/employee#leave">휴가</Link>
          <Link href="/employee#leave-calendar">휴가 캘린더</Link>
          <Link href="/employee#schedule">스케줄</Link>
          <Link href="/employee/payslips">급여 명세서</Link>
          <Link href="/employee/payslips#status-feedback">명세 피드백</Link>
          <Link href="/employee/payslips#compare-view">명세 비교</Link>
          <Link href="/employee/payslips#mobile-delivery">모바일 전달</Link>
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

