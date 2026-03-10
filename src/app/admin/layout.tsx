import Link from "next/link";
import type { ReactNode } from "react";

import SaasMobileMenu, {
  type SaasMobileMenuLink,
  type SaasMobileMenuSection
} from "@/components/layout/SaasMobileMenu";
import NotificationBell from "@/components/NotificationBell";
import SessionMenu from "@/components/SessionMenu";
import { createTranslator } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

type AdminLayoutProps = {
  children: ReactNode;
};

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const showDevTools = isDevToolsEnabled();
  const locale = await getRequestLocale();
  const t = createTranslator(locale);

  const navSections: SaasMobileMenuSection[] = [
    {
      title: t("admin.navGroup.controlTower"),
      links: [
        { href: "/admin", label: t("admin.nav.dashboard") },
        { href: "/admin/approval-executions", label: t("admin.nav.approvals") },
        { href: "/admin/kpi", label: t("admin.nav.kpi") },
        { href: "/admin/analytics", label: t("admin.nav.analytics") }
      ]
    },
    {
      title: t("admin.navGroup.peopleAndPolicy"),
      links: [
        { href: "/admin/onboarding", label: t("admin.nav.onboarding") },
        { href: "/admin/people", label: t("admin.nav.people") },
        { href: "/admin/departments", label: t("admin.nav.departments") },
        { href: "/admin/positions", label: t("admin.nav.positions") },
        { href: "/admin/approval-policy", label: t("admin.nav.approvalPolicy") },
        { href: "/admin/leave-policies", label: t("admin.nav.leavePolicy") }
      ]
    },
    {
      title: t("admin.navGroup.operations"),
      links: [
        { href: "/admin/attendance-live", label: t("admin.nav.attendanceLive") },
        { href: "/admin/leave-accrual", label: t("admin.nav.leaveAccrual") },
        { href: "/admin/leave-calendar", label: t("admin.nav.leaveCalendar") },
        { href: "/admin/scheduling", label: t("admin.nav.scheduling") },
        { href: "/admin/notices", label: t("admin.nav.notices") },
        { href: "/admin/benefits", label: t("admin.nav.benefits") },
        { href: "/admin/recruitment", label: t("admin.nav.recruitment") },
        { href: "/admin/contracts", label: t("admin.nav.contracts") }
      ]
    },
    {
      title: t("admin.navGroup.payrollAndFiling"),
      links: [
        { href: "/admin/payroll-close", label: t("admin.nav.payrollClose") },
        { href: "/admin/payroll-payslip-delivery", label: t("admin.nav.payslipDelivery") },
        { href: "/admin/payroll-insurance", label: t("admin.nav.insurance") },
        { href: "/admin/payroll-year-end", label: t("admin.nav.yearEnd") },
        { href: "/admin/payroll-year-end-filing", label: t("admin.nav.yearEndFiling") }
      ]
    },
    {
      title: t("admin.navGroup.settingsAndReporting"),
      links: [
        { href: "/admin/approval-escalation-settings", label: t("admin.nav.approvalEscalationSettings") },
        { href: "/admin/leave-promotion-email", label: t("admin.nav.leavePromotionEmail") },
        { href: "/admin/attendance-security", label: t("admin.nav.attendanceSecurity") },
        { href: "/admin/operator-alerts", label: t("admin.nav.operatorAlerts") },
        { href: "/admin/notification-defaults", label: t("admin.nav.notificationDefaults") },
        { href: "/admin/feature-management", label: t("admin.nav.featureManagement") },
        { href: "/admin/settings", label: t("admin.nav.settings") },
        { href: "/admin/audit-logs", label: t("admin.nav.auditLogs") },
        { href: "/admin/reports", label: t("admin.nav.reports") }
      ]
    }
  ];
  const adminLinks: SaasMobileMenuLink[] = navSections.flatMap((section) => section.links);

  const mobileFooterLinks: SaasMobileMenuLink[] = [{ href: "/employee", label: t("admin.nav.employeePortal") }];
  if (showDevTools) {
    mobileFooterLinks.push(
      { href: "/ops/mvp-console", label: t("admin.nav.devOpsConsole"), muted: true },
      { href: "/ops/leave-promotion", label: t("admin.nav.devLeavePromotion"), muted: true },
      { href: "/admin/payroll-year-end-filing/ops", label: t("admin.nav.yearEndFilingOps"), muted: true }
    );
  }

  return (
    <>
      <SaasMobileMenu
        badge={t("admin.badge")}
        menuLabel={t("shell.mobileMenu")}
        navAriaLabel={t("admin.nav.aria")}
        navLinks={adminLinks}
        navSections={navSections}
        footerLinks={mobileFooterLinks}
      />
      <div className="saas-shell">
        <aside className="saas-sidebar">
          <div className="saas-brand">
            <Link href="/">FlowHR</Link>
            <span className="saas-badge">{t("admin.badge")}</span>
          </div>

          <nav className="saas-nav" aria-label={t("admin.nav.aria")}>
            {navSections.map((section) => (
              <div key={section.title} className="saas-nav-section">
                <p className="saas-nav-section-title">{section.title}</p>
                <div className="saas-nav-link-list">
                  {section.links.map((item) => (
                    <Link key={item.href} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="saas-sidebar-footer">
            <NotificationBell href="/admin/notifications" />
            <SessionMenu />
            <Link href="/employee">{t("admin.nav.employeePortal")}</Link>
            {showDevTools ? (
              <>
                <Link className="muted-link" href="/ops/mvp-console">
                  {t("admin.nav.devOpsConsole")}
                </Link>
                <Link className="muted-link" href="/ops/leave-promotion">
                  {t("admin.nav.devLeavePromotion")}
                </Link>
                <Link className="muted-link" href="/admin/payroll-year-end-filing/ops">
                  {t("admin.nav.yearEndFilingOps")}
                </Link>
              </>
            ) : null}
          </div>
        </aside>

        <div className="saas-main">{children}</div>
      </div>
    </>
  );
}
