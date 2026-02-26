import Link from "next/link";
import type { ReactNode } from "react";

import SaasMobileMenu, { type SaasMobileMenuLink } from "@/components/layout/SaasMobileMenu";
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

  const adminLinks: SaasMobileMenuLink[] = [
    { href: "/admin", label: t("admin.nav.dashboard") },
    { href: "/admin/kpi", label: t("admin.nav.kpi") },
    { href: "/admin/analytics", label: t("admin.nav.analytics") },
    { href: "/admin/attendance-live", label: t("admin.nav.attendanceLive") },
    { href: "/admin/onboarding", label: t("admin.nav.onboarding") },
    { href: "/admin#approvals", label: t("admin.nav.approvals") },
    { href: "/admin#aggregates", label: t("admin.nav.aggregates") },
    { href: "/admin#leave-policy", label: t("admin.nav.leavePolicy") },
    { href: "/admin/leave-accrual", label: t("admin.nav.leaveAccrual") },
    { href: "/admin/leave-calendar", label: t("admin.nav.leaveCalendar") },
    { href: "/admin/scheduling", label: t("admin.nav.scheduling") },
    { href: "/admin/notices", label: t("admin.nav.notices") },
    { href: "/admin/benefits", label: t("admin.nav.benefits") },
    { href: "/admin/recruitment", label: t("admin.nav.recruitment") },
    { href: "/admin#payroll", label: t("admin.nav.payroll") },
    { href: "/admin/payroll-insurance", label: t("admin.nav.insurance") },
    { href: "/admin/payroll-close", label: t("admin.nav.payrollClose") },
    { href: "/admin/payroll-payslip-delivery", label: t("admin.nav.payslipDelivery") },
    { href: "/admin/payroll-year-end", label: t("admin.nav.yearEnd") },
    { href: "/admin/payroll-year-end-filing", label: t("admin.nav.yearEndFiling") },
    { href: "/admin/payroll-year-end-filing/ops", label: t("admin.nav.yearEndFilingOps") },
    { href: "/admin/payroll-year-end-filing/ops/alert", label: t("admin.nav.yearEndFilingOpsFlatAlert") },
    {
      href: "/admin/payroll-year-end-filing/ops/checklist-flow",
      label: t("admin.nav.yearEndFilingOpsFlatChecklist")
    },
    { href: "/admin/payroll-year-end-filing/ops/review", label: t("admin.nav.yearEndFilingOpsFlatReview") },
    { href: "/admin/payroll-year-end-filing/ops/close-off", label: t("admin.nav.yearEndFilingOpsFlatCloseOff") },
    { href: "/admin/payroll-year-end-filing/ops/delivery", label: t("admin.nav.yearEndFilingOpsFlatDelivery") },
    { href: "/admin/payroll-year-end-filing/ops/archive", label: t("admin.nav.yearEndFilingOpsFlatArchive") },
    { href: "/admin/payroll-year-end-filing/ops/report", label: t("admin.nav.yearEndFilingOpsFlatReport") },
    { href: "/admin/people", label: t("admin.nav.people") },
    { href: "/admin/contracts", label: t("admin.nav.contracts") },
    { href: "/admin/approval-policy", label: t("admin.nav.approvalPolicy") }
  ];

  const mobileFooterLinks: SaasMobileMenuLink[] = [{ href: "/employee", label: t("admin.nav.employeePortal") }];
  if (showDevTools) {
    mobileFooterLinks.push(
      { href: "/ops/mvp-console", label: t("admin.nav.devOpsConsole"), muted: true },
      { href: "/ops/leave-promotion", label: t("admin.nav.devLeavePromotion"), muted: true }
    );
  }

  return (
    <>
      <SaasMobileMenu
        badge={t("admin.badge")}
        menuLabel={t("shell.mobileMenu")}
        navAriaLabel={t("admin.nav.aria")}
        navLinks={adminLinks}
        footerLinks={mobileFooterLinks}
      />
      <div className="saas-shell">
        <aside className="saas-sidebar">
          <div className="saas-brand">
            <Link href="/">FlowHR</Link>
            <span className="saas-badge">{t("admin.badge")}</span>
          </div>

          <nav className="saas-nav" aria-label={t("admin.nav.aria")}>
            {adminLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="saas-sidebar-footer">
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
              </>
            ) : null}
          </div>
        </aside>

        <div className="saas-main">{children}</div>
      </div>
    </>
  );
}
