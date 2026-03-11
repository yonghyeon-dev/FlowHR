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
  sectionId?: string;
  href?: string;
};

const COPY = {
  ko: {
    title: "직원 여정 바로가기",
    description: "전체 화면을 스크롤하지 않고 주요 셀프서비스 영역으로 바로 이동합니다.",
    ariaLabel: "직원 셀프서비스 바로가기",
    jumpButton: "바로 열기",
    payslipCta: "급여 명세서 보기",
    adminApprovalCta: "관리자 승인함 열기"
  },
  en: {
    title: "Employee journey shortcuts",
    description: "Jump into the core self-service areas without scrolling through the full page.",
    ariaLabel: "employee self-service shortcuts",
    jumpButton: "Open now",
    payslipCta: "View payslips",
    adminApprovalCta: "Open admin approvals"
  }
} as const;

const SHORTCUTS = {
  ko: [
    {
      key: "attendance",
      label: "출퇴근 정정",
      detail: "오늘 근태 기록을 확인하고 정정 요청 폼으로 바로 이동합니다.",
      href: "/employee/attendance/correction?source=employee-dashboard"
    },
    {
      key: "leave",
      label: "휴가 요청",
      detail: "휴가 유형과 기간을 입력하는 신청 폼으로 이동합니다.",
      href: "/employee/leave/request?source=employee-dashboard"
    },
    {
      key: "leave-calendar",
      label: "휴가 캘린더",
      detail: "팀 휴가 밀도를 확인하고 날짜별 일정을 살펴봅니다.",
      href: "/employee/leave/calendar?source=employee-dashboard"
    },
    {
      key: "request-feedback",
      label: "요청 상태 센터",
      detail: "요청 피드백, 검색, 재제출 후속 조치를 전용 워크스페이스에서 이어갑니다.",
      href: "/employee/requests/monitoring?source=employee-dashboard"
    },
    {
      key: "schedule",
      label: "이번 주 일정",
      detail: "이번 주 근무 일정을 확인하는 섹션으로 이동합니다.",
      href: "/employee/schedule?source=employee-dashboard"
    }
  ],
  en: [
    {
      key: "attendance",
      label: "Attendance correction",
      detail: "Review today's attendance and move into the correction form.",
      href: "/employee/attendance/correction?source=employee-dashboard"
    },
    {
      key: "leave",
      label: "Leave request",
      detail: "Jump into the leave request form with the main input fields ready.",
      href: "/employee/leave/request?source=employee-dashboard"
    },
    {
      key: "leave-calendar",
      label: "Leave calendar",
      detail: "Check team leave density and open the date-based calendar view.",
      href: "/employee/leave/calendar?source=employee-dashboard"
    },
    {
      key: "request-feedback",
      label: "Request status center",
      detail: "Continue feedback, search, and resubmit follow-up in the dedicated workspace.",
      href: "/employee/requests/monitoring?source=employee-dashboard"
    },
    {
      key: "schedule",
      label: "This week schedule",
      detail: "Move directly to the current work schedule section.",
      href: "/employee/schedule?source=employee-dashboard"
    }
  ]
} satisfies Record<"ko" | "en", EmployeeShortcut[]>;

export function EmployeeJourneyShortcutPanel({
  onJumpToSection
}: EmployeeJourneyShortcutPanelProps) {
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
            {shortcut.href ? (
              <Link className="btn btn-secondary btn-small" href={shortcut.href}>
                {copy.jumpButton}
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  const sectionId =
                    "sectionId" in shortcut && typeof shortcut.sectionId === "string"
                      ? shortcut.sectionId
                      : "";
                  onJumpToSection(sectionId);
                }}
              >
                {copy.jumpButton}
              </button>
            )}
          </article>
        ))}
      </div>
      <div className="actions" style={{ marginTop: 10 }}>
        <Link className="btn btn-secondary btn-small" href="/employee/payslips">
          {copy.payslipCta}
        </Link>
        <Link className="btn btn-secondary btn-small" href="/admin/approval-executions">
          {copy.adminApprovalCta}
        </Link>
      </div>
    </article>
  );
}
