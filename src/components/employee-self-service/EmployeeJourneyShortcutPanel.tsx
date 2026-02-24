"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";

type EmployeeJourneyShortcutPanelProps = {
  onJumpToSection: (sectionId: string) => void;
};

type EmployeeShortcut = {
  key: string;
  label: string;
  detail: string;
  sectionId: string;
};

const COPY = {
  ko: {
    title: "직원 여정 바로가기",
    description: "복잡한 스크롤 없이 주요 업무 섹션으로 즉시 이동합니다.",
    ariaLabel: "직원 셀프서비스 여정 바로가기",
    jumpButton: "섹션으로 이동",
    payslipCta: "급여 명세서 보기",
    adminApprovalCta: "관리자 승인 큐 열기"
  },
  en: {
    title: "Employee Journey Shortcuts",
    description: "Jump to core self-service sections without scrolling through the full page.",
    ariaLabel: "employee self-service journey shortcuts",
    jumpButton: "Jump to section",
    payslipCta: "View payslips",
    adminApprovalCta: "Open admin approval queue"
  }
} as const;

const SHORTCUTS = {
  ko: [
    {
      key: "attendance",
      label: "출퇴근 정정",
      detail: "오늘 근태 기록을 확인하고 정정 요청으로 바로 이동합니다.",
      sectionId: "attendance"
    },
    {
      key: "leave",
      label: "휴가 신청",
      detail: "휴가 유형과 단위를 선택해 즉시 요청합니다.",
      sectionId: "leave"
    },
    {
      key: "leave-calendar",
      label: "휴가 캘린더",
      detail: "팀 일정 밀도를 확인하고 잔여 일수를 점검합니다.",
      sectionId: "leave-calendar"
    },
    {
      key: "request-feedback",
      label: "요청 피드백",
      detail: "반려/실패 사유와 상태 변경 내역을 한 번에 확인합니다.",
      sectionId: "request-feedback"
    },
    {
      key: "schedule",
      label: "이번 주 일정",
      detail: "이번 주 근무 일정 섹션으로 이동합니다.",
      sectionId: "schedule"
    }
  ],
  en: [
    {
      key: "attendance",
      label: "Attendance correction",
      detail: "Review today's attendance and jump to a correction request.",
      sectionId: "attendance"
    },
    {
      key: "leave",
      label: "Leave request",
      detail: "Select leave type and unit, then submit right away.",
      sectionId: "leave"
    },
    {
      key: "leave-calendar",
      label: "Leave calendar",
      detail: "Check team density and review your remaining leave.",
      sectionId: "leave-calendar"
    },
    {
      key: "request-feedback",
      label: "Request feedback",
      detail: "Track rejection/failure reasons and status changes in one place.",
      sectionId: "request-feedback"
    },
    {
      key: "schedule",
      label: "This week schedule",
      detail: "Jump directly to this week's work schedule section.",
      sectionId: "schedule"
    }
  ]
} satisfies Record<"ko" | "en", EmployeeShortcut[]>;

export function EmployeeJourneyShortcutPanel({ onJumpToSection }: EmployeeJourneyShortcutPanelProps) {
  const { locale } = useI18n();
  const copy = locale === "ko" ? COPY.ko : COPY.en;
  const shortcuts = locale === "ko" ? SHORTCUTS.ko : SHORTCUTS.en;

  return (
    <article className="panel" id="self-service-quick-jump">
      <h2>{copy.title}</h2>
      <p className="small">{copy.description}</p>
      <div className="submit-checklist-grid" aria-label={copy.ariaLabel}>
        {shortcuts.map((shortcut) => (
          <article key={shortcut.key} className="submit-checklist-card is-ready">
            <p>{shortcut.label}</p>
            <span>{shortcut.detail}</span>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => onJumpToSection(shortcut.sectionId)}
            >
              {copy.jumpButton}
            </button>
          </article>
        ))}
      </div>
      <div className="actions" style={{ marginTop: 10 }}>
        <Link className="btn btn-secondary btn-small" href="/employee/payslips">
          {copy.payslipCta}
        </Link>
        <Link className="btn btn-secondary btn-small" href="/admin#approvals">
          {copy.adminApprovalCta}
        </Link>
      </div>
    </article>
  );
}
