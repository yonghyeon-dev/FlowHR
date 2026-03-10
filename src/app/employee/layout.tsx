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

type EmployeeLayoutProps = {
  children: ReactNode;
};

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default async function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const showDevTools = isDevToolsEnabled();
  const locale = await getRequestLocale();
  const t = createTranslator(locale);

  const navSections: SaasMobileMenuSection[] = [
    {
      title: t("employee.navGroup.today"),
      links: [
        { href: "/employee", label: t("employee.nav.overview") },
        { href: "/employee/guide", label: t("employee.nav.guide") },
        { href: "/employee/onboarding", label: t("employee.nav.onboardingChecklist") }
      ]
    },
    {
      title: t("employee.navGroup.requests"),
      links: [
        { href: "/employee/schedule", label: t("employee.nav.scheduleBoard") },
        { href: "/employee/benefits", label: t("employee.nav.benefits") }
      ]
    },
    {
      title: t("employee.navGroup.documents"),
      links: [
        { href: "/employee/contracts", label: t("employee.nav.contracts") },
        { href: "/employee/payslips", label: t("employee.nav.payslips") },
        { href: "/employee/payslip-receipts", label: t("employee.nav.payslipReceipts") },
        { href: "/employee/withholding-receipt", label: t("employee.nav.withholdingReceipt") },
        { href: "/employee/year-end-input", label: t("employee.nav.yearEndInput") }
      ]
    },
    {
      title: t("employee.navGroup.noticesAndAlerts"),
      links: [
        { href: "/employee/notifications", label: t("employee.nav.notifications") },
        { href: "/employee/notices", label: t("employee.nav.notices") },
        { href: "/employee/recruitment", label: t("employee.nav.recruitment") }
      ]
    },
    {
      title: t("employee.navGroup.account"),
      links: [
        { href: "/employee/profile", label: t("employee.nav.profile") },
        { href: "/employee/people", label: t("employee.nav.people") },
        { href: "/employee/settings", label: t("employee.nav.settings") }
      ]
    }
  ];
  const navLinks: SaasMobileMenuLink[] = navSections.flatMap((section) => section.links);

  const footerLinks: SaasMobileMenuLink[] = showDevTools
    ? [{ href: "/admin", label: t("employee.nav.admin") }]
    : [];

  return (
    <>
      <SaasMobileMenu
        badge={t("employee.badge")}
        menuLabel={t("shell.mobileMenu")}
        navAriaLabel={t("employee.nav.aria")}
        navLinks={navLinks}
        navSections={navSections}
        footerLinks={footerLinks}
      />
      <div className="saas-shell">
        <aside className="saas-sidebar">
          <div className="saas-brand">
            <Link href="/">FlowHR</Link>
            <span className="saas-badge">{t("employee.badge")}</span>
          </div>

          <nav className="saas-nav" aria-label={t("employee.nav.aria")}>
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
            <NotificationBell href="/employee/notifications" />
            <SessionMenu />
            {showDevTools ? <Link href="/admin">{t("employee.nav.admin")}</Link> : null}
          </div>
        </aside>

        <div className="saas-main">{children}</div>
      </div>
    </>
  );
}
