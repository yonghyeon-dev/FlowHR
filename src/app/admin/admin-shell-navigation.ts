import type { MessageKey } from "@/lib/i18n/messages";

type Translator = (key: MessageKey) => string;

export type AdminShellSectionKey =
  | "controlTower"
  | "peopleAndPolicy"
  | "operations"
  | "payrollAndFiling"
  | "settingsAndReporting";

type AdminShellLinkDefinition = {
  href: string;
  labelKey: MessageKey;
};

type AdminShellSectionDefinition = {
  key: AdminShellSectionKey;
  titleKey: MessageKey;
  navLinks: AdminShellLinkDefinition[];
  dashboardEntryHref: string;
};

export const ADMIN_SHELL_SECTION_DEFINITIONS: AdminShellSectionDefinition[] = [
  {
    key: "controlTower",
    titleKey: "admin.navGroup.controlTower",
    dashboardEntryHref: "/admin/approval-executions",
    navLinks: [
      { href: "/admin", labelKey: "admin.nav.dashboard" },
      { href: "/admin/approval-executions", labelKey: "admin.nav.approvals" },
      { href: "/admin/kpi", labelKey: "admin.nav.kpi" },
      { href: "/admin/analytics", labelKey: "admin.nav.analytics" }
    ]
  },
  {
    key: "peopleAndPolicy",
    titleKey: "admin.navGroup.peopleAndPolicy",
    dashboardEntryHref: "/admin/people",
    navLinks: [
      { href: "/admin/onboarding", labelKey: "admin.nav.onboarding" },
      { href: "/admin/people", labelKey: "admin.nav.people" },
      { href: "/admin/departments", labelKey: "admin.nav.departments" },
      { href: "/admin/positions", labelKey: "admin.nav.positions" },
      { href: "/admin/approval-policy", labelKey: "admin.nav.approvalPolicy" },
      { href: "/admin/leave-policies", labelKey: "admin.nav.leavePolicy" }
    ]
  },
  {
    key: "operations",
    titleKey: "admin.navGroup.operations",
    dashboardEntryHref: "/admin/operations",
    navLinks: [
      { href: "/admin/operations", labelKey: "admin.nav.operationsLane" },
      { href: "/admin/attendance-live", labelKey: "admin.nav.attendanceLive" },
      { href: "/admin/leave-accrual", labelKey: "admin.nav.leaveAccrual" },
      { href: "/admin/leave-calendar", labelKey: "admin.nav.leaveCalendar" },
      { href: "/admin/scheduling", labelKey: "admin.nav.scheduling" },
      { href: "/admin/notices", labelKey: "admin.nav.notices" },
      { href: "/admin/benefits", labelKey: "admin.nav.benefits" },
      { href: "/admin/recruitment", labelKey: "admin.nav.recruitment" },
      { href: "/admin/contracts", labelKey: "admin.nav.contracts" }
    ]
  },
  {
    key: "payrollAndFiling",
    titleKey: "admin.navGroup.payrollAndFiling",
    dashboardEntryHref: "/admin/payroll-close",
    navLinks: [
      { href: "/admin/payroll-close", labelKey: "admin.nav.payrollClose" },
      { href: "/admin/payroll-payslip-delivery", labelKey: "admin.nav.payslipDelivery" },
      { href: "/admin/payroll-insurance", labelKey: "admin.nav.insurance" },
      { href: "/admin/payroll-year-end", labelKey: "admin.nav.yearEnd" },
      { href: "/admin/payroll-year-end-filing", labelKey: "admin.nav.yearEndFiling" }
    ]
  },
  {
    key: "settingsAndReporting",
    titleKey: "admin.navGroup.settingsAndReporting",
    dashboardEntryHref: "/admin/settings",
    navLinks: [
      { href: "/admin/approval-escalation-settings", labelKey: "admin.nav.approvalEscalationSettings" },
      { href: "/admin/leave-promotion-email", labelKey: "admin.nav.leavePromotionEmail" },
      { href: "/admin/attendance-security", labelKey: "admin.nav.attendanceSecurity" },
      { href: "/admin/operator-alerts", labelKey: "admin.nav.operatorAlerts" },
      { href: "/admin/notification-defaults", labelKey: "admin.nav.notificationDefaults" },
      { href: "/admin/feature-management", labelKey: "admin.nav.featureManagement" },
      { href: "/admin/settings", labelKey: "admin.nav.settings" },
      { href: "/admin/audit-logs", labelKey: "admin.nav.auditLogs" },
      { href: "/admin/reports", labelKey: "admin.nav.reports" }
    ]
  }
];

export function buildAdminShellNavSections(t: Translator) {
  return ADMIN_SHELL_SECTION_DEFINITIONS.map((section) => ({
    key: section.key,
    title: t(section.titleKey),
    links: section.navLinks.map((link) => ({
      href: link.href,
      label: t(link.labelKey)
    }))
  }));
}

export function buildAdminDashboardEntryLinks(t: Translator) {
  return ADMIN_SHELL_SECTION_DEFINITIONS.map((section) => ({
    key: section.key,
    href: section.dashboardEntryHref,
    label: t(section.titleKey)
  }));
}
