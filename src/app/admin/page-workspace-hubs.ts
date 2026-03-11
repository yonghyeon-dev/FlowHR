import {
  ADMIN_SHELL_SECTION_DEFINITIONS,
  type AdminShellSectionKey,
} from "@/app/admin/admin-shell-navigation";
import { ADMIN_HUB_SOURCE } from "@/app/admin/source-context";
import type { MessageKey } from "@/lib/i18n/messages";

type Translator = (key: MessageKey) => string;

export type AdminDashboardWorkspaceHub = {
  key: AdminShellSectionKey;
  title: string;
  description: string;
  links: {
    href: string;
    label: string;
  }[];
};

type AdminWorkspaceHubDefinition = {
  description: {
    ko: string;
    en: string;
  };
  links: Array<{
    href: string;
    label: {
      ko: string;
      en: string;
    };
  }>;
};

const ADMIN_WORKSPACE_HUB_DEFINITIONS: Record<AdminShellSectionKey, AdminWorkspaceHubDefinition> = {
  controlTower: {
    description: {
      ko: "결재, KPI, 분석 화면에서 우선순위와 정체 위험을 확인합니다.",
      en: "Track approval backlog, KPI signals, and analysis priorities.",
    },
    links: [
      { href: "/admin/approval-executions", label: { ko: "결재 실행", en: "Approval executions" } },
      { href: "/admin/kpi", label: { ko: "KPI 대시보드", en: "KPI dashboard" } },
      { href: "/admin/analytics", label: { ko: "분석 리포트", en: "Analytics reports" } },
    ],
  },
  peopleAndPolicy: {
    description: {
      ko: "직원, 조직, 온보딩, 정책 기준을 한 흐름에서 관리합니다.",
      en: "Manage people, org structure, onboarding, and policy baselines in one flow.",
    },
    links: [
      { href: "/admin/people", label: { ko: "인사 관리", en: "People workspace" } },
      { href: "/admin/onboarding", label: { ko: "온보딩", en: "Onboarding" } },
      { href: "/admin/approval-policy", label: { ko: "결재 정책", en: "Approval policy" } },
      { href: "/admin/leave-policies", label: { ko: "휴가 정책", en: "Leave policies" } },
    ],
  },
  operations: {
    description: {
      ko: "근태, 휴가, 일정과 직원 대상 운영 흐름을 한 번에 처리합니다.",
      en: "Handle attendance, leave, scheduling, and employee-facing operating workflows.",
    },
    links: [
      { href: "/admin/attendance-live", label: { ko: "실시간 근태", en: "Attendance live" } },
      { href: "/admin/leave-calendar", label: { ko: "휴가 캘린더", en: "Leave calendar" } },
      { href: "/admin/scheduling", label: { ko: "근무 일정", en: "Scheduling" } },
      {
        href: `/admin/notices?status=PUBLISHED&risk=no-read&source=${ADMIN_HUB_SOURCE}`,
        label: { ko: "공지 읽음 위험", en: "Notice read risk" },
      },
      {
        href: `/admin/benefits?status=SUBMITTED&risk=pending_3d&source=${ADMIN_HUB_SOURCE}`,
        label: { ko: "복리후생 요청 지연", en: "Benefit backlog" },
      },
      {
        href: `/admin/recruitment?risk=stalled_7d&source=${ADMIN_HUB_SOURCE}`,
        label: { ko: "채용 진행 지연", en: "Recruitment stalled" },
      },
      {
        href: "/admin/contracts?decisionQueueOnly=true",
        label: { ko: "계약 의사결정 큐", en: "Contract decision queue" },
      },
      {
        href: "/admin/contracts?slaRisk=OVERDUE",
        label: { ko: "계약 SLA 초과", en: "Contract SLA overdue" },
      },
      {
        href: "/admin/contracts?status=SENT",
        label: { ko: "계약 응답 대기", en: "Contract pending responses" },
      },
    ],
  },
  payrollAndFiling: {
    description: {
      ko: "급여 마감, 명세서 배포, 연말정산과 신고 상태를 이어서 처리합니다.",
      en: "Operate payroll close, payslip delivery, year-end, and filing status in one lane.",
    },
    links: [
      { href: "/admin/payroll-close", label: { ko: "급여 마감", en: "Payroll close" } },
      { href: "/admin/payroll-payslip-delivery", label: { ko: "명세서 배포", en: "Payslip delivery" } },
      { href: "/admin/payroll-year-end", label: { ko: "연말정산", en: "Year-end" } },
      { href: "/admin/payroll-year-end-filing", label: { ko: "신고", en: "Filing" } },
    ],
  },
  settingsAndReporting: {
    description: {
      ko: "알림, 보안, 기능 관리와 보고 기준을 운영 설정으로 묶습니다.",
      en: "Maintain alerts, security, feature controls, and reporting defaults.",
    },
    links: [
      {
        href: "/admin/approval-escalation-settings",
        label: { ko: "결재 에스컬레이션 설정", en: "Approval escalation settings" },
      },
      {
        href: "/admin/leave-promotion-email",
        label: { ko: "휴가 촉진 메일 설정", en: "Leave promotion email" },
      },
      {
        href: "/admin/attendance-security",
        label: { ko: "출퇴근 보안 설정", en: "Attendance security" },
      },
      { href: "/admin/settings", label: { ko: "설정", en: "Settings" } },
      { href: "/admin/operator-alerts", label: { ko: "운영 알림 연동", en: "Operator alerts" } },
      { href: "/admin/notification-defaults", label: { ko: "알림 기본값", en: "Notification defaults" } },
      { href: "/admin/feature-management", label: { ko: "기능 관리", en: "Feature management" } },
      { href: "/admin/reports", label: { ko: "보고서", en: "Reports" } },
    ],
  },
};

export function buildAdminWorkspaceHubs(locale: "ko" | "en", t: Translator): AdminDashboardWorkspaceHub[] {
  return ADMIN_SHELL_SECTION_DEFINITIONS.map((section) => {
    const hub = ADMIN_WORKSPACE_HUB_DEFINITIONS[section.key];
    return {
      key: section.key,
      title: t(section.titleKey),
      description: hub.description[locale],
      links: hub.links.map((link) => ({
        href: link.href,
        label: link.label[locale],
      })),
    };
  });
}
