"use client";

import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";

type EmployeeShortcut = {
  key: string;
  label: string;
  detail: string;
  href: string;
};

const COPY = {
  ko: {
    title: "바로 실행할 작업",
    description: "자주 쓰는 직원 작업을 홈에서 바로 열어 다음 행동으로 이어집니다.",
    ariaLabel: "직원 바로 실행 작업",
    jumpButton: "작업 열기",
    payslipCta: "급여 문서 보기",
    guideCta: "이용 가이드 보기"
  },
  en: {
    title: "Start a task now",
    description:
      "Open the most common employee actions directly from home and continue to the next step.",
    ariaLabel: "employee quick task launcher",
    jumpButton: "Open task",
    payslipCta: "Open payroll docs",
    guideCta: "View guide"
  }
} as const;

const SHORTCUTS = {
  ko: [
    {
      key: "attendance",
      label: "출퇴근 정정",
      detail: "오늘 근태 기록을 확인하고 정정 요청 입력으로 바로 이동합니다.",
      href: "/employee/attendance/correction?source=employee-dashboard"
    },
    {
      key: "leave",
      label: "휴가 신청",
      detail: "휴가 유형과 기간을 입력하는 요청 워크스페이스를 바로 엽니다.",
      href: "/employee/leave/request?source=employee-dashboard"
    },
    {
      key: "leave-calendar",
      label: "휴가 캘린더",
      detail: "팀 휴가 분포를 보고 일정 계획에 바로 이어집니다.",
      href: "/employee/leave/calendar?source=employee-dashboard"
    },
    {
      key: "request-feedback",
      label: "요청 상태 확인",
      detail: "피드백, 검색, 재제출이 필요한 요청을 전용 워크스페이스에서 이어갑니다.",
      href: "/employee/requests/monitoring?source=employee-dashboard"
    },
    {
      key: "schedule",
      label: "이번 주 근무",
      detail: "이번 주 근무 일정을 확인하는 화면으로 바로 이동합니다.",
      href: "/employee/schedule?source=employee-dashboard"
    }
  ],
  en: [
    {
      key: "attendance",
      label: "Attendance correction",
      detail: "Review today's attendance log and move straight into the correction request form.",
      href: "/employee/attendance/correction?source=employee-dashboard"
    },
    {
      key: "leave",
      label: "Leave request",
      detail: "Open the leave request workspace with the primary form fields ready.",
      href: "/employee/leave/request?source=employee-dashboard"
    },
    {
      key: "leave-calendar",
      label: "Leave calendar",
      detail: "Check team leave density and continue into the calendar planning view.",
      href: "/employee/leave/calendar?source=employee-dashboard"
    },
    {
      key: "request-feedback",
      label: "Request status",
      detail: "Continue feedback, search, and resubmission follow-up in the dedicated workspace.",
      href: "/employee/requests/monitoring?source=employee-dashboard"
    },
    {
      key: "schedule",
      label: "This week schedule",
      detail: "Move directly into the current work-schedule view.",
      href: "/employee/schedule?source=employee-dashboard"
    }
  ]
} satisfies Record<"ko" | "en", EmployeeShortcut[]>;

export function EmployeeJourneyShortcutPanel() {
  const { locale } = useI18n();
  const copy = locale === "ko" ? COPY.ko : COPY.en;
  const shortcuts = locale === "ko" ? SHORTCUTS.ko : SHORTCUTS.en;

  return (
    <article className="panel employee-home-shortcuts-panel" id="self-service-quick-jump">
      <h2>{copy.title}</h2>
      <p className="small">{copy.description}</p>
      <div className="employee-home-shortcuts-grid" aria-label={copy.ariaLabel}>
        {shortcuts.map((shortcut) => (
          <article key={shortcut.key} className="employee-home-shortcut-card">
            <p>{shortcut.label}</p>
            <span>{shortcut.detail}</span>
            <Link className="btn btn-secondary btn-small" href={shortcut.href}>
              {copy.jumpButton}
            </Link>
          </article>
        ))}
      </div>
      <div className="actions employee-home-shortcuts-actions">
        <Link className="btn btn-primary btn-small" href="/employee/guide">
          {copy.guideCta}
        </Link>
        <Link className="btn btn-secondary btn-small" href="/employee/payslips">
          {copy.payslipCta}
        </Link>
      </div>
    </article>
  );
}
