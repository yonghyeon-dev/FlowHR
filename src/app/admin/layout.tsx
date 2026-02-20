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
          <Link href="/admin#onboarding">조직</Link>
          <Link href="/admin#people">직원</Link>
          <Link href="/admin/people">조직도/인사 이력</Link>
          <Link href="/admin/people#directory-filters">People 필터</Link>
          <Link href="/admin/people#org-chart">People 트리</Link>
          <Link href="/admin/people#employee-compare">People 비교</Link>
          <Link href="/admin/people#employee-history">People 이력</Link>
          <Link href="/admin/people#history-search-sort">People 이력 검색/정렬</Link>
          <Link href="/admin/people#history-sort-accuracy">People 이력 정렬 정확도</Link>
          <Link href="/admin/people#history-risk-prediction">People 변경 위험 예측</Link>
          <Link href="/admin/people#history-delay-risk-prediction">People 변경 지연 위험 예측</Link>
          <Link href="/admin/people#people-mobile-flow">People 모바일 흐름</Link>
          <Link href="/admin/people#people-mobile-follow-up-guide">People 모바일 후속 가이드</Link>
          <Link href="/admin/people#people-mobile-follow-up-recommendation">People 모바일 후속 추천</Link>
          <Link href="/admin#invites">초대/가입</Link>
          <Link href="/admin#scheduling">근무 일정</Link>
          <Link href="/admin#approvals">승인 대기</Link>
          <Link href="/admin#approval-search-sort">승인 검색/정렬</Link>
          <Link href="/admin#approval-history-sort-accuracy">승인 이력 정렬 정확도</Link>
          <Link href="/admin#approval-evidence-preview">승인 근거 프리뷰</Link>
          <Link href="/admin#approval-evidence-comparison">승인 근거 비교 카드</Link>
          <Link href="/admin#approval-sla-timeline">승인 SLA 타임라인</Link>
          <Link href="/admin#approval-sla-alert-rules">승인 SLA 알림 규칙</Link>
          <Link href="/admin#approval-processing-prediction">승인 처리 예측</Link>
          <Link href="/admin#approval-delay-risk-prediction">승인 지연 위험 예측</Link>
          <Link href="/admin#approval-mobile-review-sheet">승인 모바일 검토 시트</Link>
          <Link href="/admin#approval-mobile-checklist">승인 모바일 체크리스트</Link>
          <Link href="/admin#approval-mobile-follow-up-guide">승인 모바일 후속 가이드</Link>
          <Link href="/admin#approval-mobile-follow-up-recommendation">승인 모바일 후속 추천</Link>
          <Link href="/admin#approval-bulk-validation">승인 검증</Link>
          <Link href="/admin#approval-item-history">승인 이력 요약</Link>
          <Link href="/admin#approval-mobile-feedback">승인 모바일 피드백</Link>
          <Link href="/admin/approval-policy">결재/위임 정책</Link>
          <Link href="/admin/approval-templates">결재선 템플릿</Link>
          <Link href="/admin/approval-history">결재 단계 이력</Link>
          <Link href="/admin/approval-executions">결재 실행 현황</Link>
          <Link href="/admin#aggregates">근태 집계</Link>
          <Link href="/admin#leave-policy">휴가 정책</Link>
          <Link href="/admin#payroll">급여</Link>
          <Link className="muted-link" href="/admin#account">
            내 계정
          </Link>
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
