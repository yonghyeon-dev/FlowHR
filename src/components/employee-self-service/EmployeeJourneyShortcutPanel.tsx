"use client";

import Link from "next/link";

type EmployeeJourneyShortcutPanelProps = {
  onJumpToSection: (sectionId: string) => void;
};

const SELF_SERVICE_SHORTCUTS = [
  {
    key: "attendance",
    label: "출퇴근 정정",
    detail: "오늘 근태 기록 확인 후 정정 요청으로 바로 이동",
    sectionId: "attendance"
  },
  {
    key: "leave",
    label: "휴가 신청",
    detail: "휴가 유형/단위를 선택해 즉시 신청",
    sectionId: "leave"
  },
  {
    key: "leave-calendar",
    label: "휴가 캘린더",
    detail: "팀 일정 밀도와 연차 사용률 확인",
    sectionId: "leave-calendar"
  },
  {
    key: "request-feedback",
    label: "요청 피드백",
    detail: "반려/실패 사유와 상태 변화를 한 번에 확인",
    sectionId: "request-feedback"
  },
  {
    key: "schedule",
    label: "내 스케줄",
    detail: "이번 달 스케줄 목록으로 이동",
    sectionId: "schedule"
  }
] as const;

export function EmployeeJourneyShortcutPanel({ onJumpToSection }: EmployeeJourneyShortcutPanelProps) {
  return (
    <article className="panel" id="self-service-quick-jump">
      <h2>핵심 여정 바로가기</h2>
      <p className="small">복잡한 스크롤 없이 주요 업무 섹션으로 즉시 이동합니다.</p>
      <div className="submit-checklist-grid" aria-label="직원 셀프서비스 핵심 여정 바로가기">
        {SELF_SERVICE_SHORTCUTS.map((shortcut) => (
          <article key={shortcut.key} className="submit-checklist-card is-ready">
            <p>{shortcut.label}</p>
            <span>{shortcut.detail}</span>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => onJumpToSection(shortcut.sectionId)}
            >
              섹션으로 이동
            </button>
          </article>
        ))}
      </div>
      <div className="actions" style={{ marginTop: 10 }}>
        <Link className="btn btn-secondary btn-small" href="/employee/payslips">
          급여 명세서 보기
        </Link>
        <Link className="btn btn-secondary btn-small" href="/admin#approvals">
          관리자 승인 큐 열기
        </Link>
      </div>
    </article>
  );
}
