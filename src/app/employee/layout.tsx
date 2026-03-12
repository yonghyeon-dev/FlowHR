import Link from "next/link";
import type { ReactNode } from "react";

import NotificationBell from "@/components/NotificationBell";
import SessionMenu from "@/components/SessionMenu";
import SaasMobileMenu, {
  type SaasMobileMenuLink,
  type SaasMobileMenuSection
} from "@/components/layout/SaasMobileMenu";
import AppNavLink from "@/components/v2/AppNavLink";
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
  const isKoLocale = locale === "ko";

  const navSections: SaasMobileMenuSection[] = [
    {
      title: isKoLocale ? "Today" : "Today",
      links: [
        { href: "/employee", label: t("employee.nav.overview") },
        { href: "/employee/guide", label: t("employee.nav.guide") },
        { href: "/employee/schedule", label: t("employee.nav.scheduleBoard") }
      ]
    },
    {
      title: isKoLocale ? "Requests" : "Requests",
      links: [
        { href: "/employee/requests", label: isKoLocale ? "요청 허브" : "Requests hub" },
        { href: "/employee/attendance/correction", label: isKoLocale ? "근태 작업" : "Attendance" },
        { href: "/employee/leave/request", label: isKoLocale ? "휴가 작업" : "Leave" },
        { href: "/employee/benefits", label: t("employee.nav.benefits") }
      ]
    },
    {
      title: isKoLocale ? "Documents" : "Documents",
      links: [
        { href: "/employee/contracts", label: t("employee.nav.contracts") },
        { href: "/employee/payslips", label: t("employee.nav.payslips") },
        { href: "/employee/payslip-receipts", label: t("employee.nav.payslipReceipts") },
        { href: "/employee/withholding-receipt", label: t("employee.nav.withholdingReceipt") }
      ]
    },
    {
      title: isKoLocale ? "Account" : "Account",
      links: [
        { href: "/employee/notices", label: t("employee.nav.notices") },
        { href: "/employee/notifications", label: t("employee.nav.notifications") },
        { href: "/employee/profile", label: t("employee.nav.profile") },
        { href: "/employee/settings", label: t("employee.nav.settings") }
      ]
    }
  ];
  const navLinks: SaasMobileMenuLink[] = navSections.flatMap((section) => section.links);
  const footerLinks: SaasMobileMenuLink[] = showDevTools
    ? [{ href: "/admin", label: isKoLocale ? "관리자" : "Admin" }]
    : [];

  return (
    <>
      <SaasMobileMenu
        badge={isKoLocale ? "직원" : "Employee"}
        menuLabel={isKoLocale ? "메뉴" : "Menu"}
        navAriaLabel={isKoLocale ? "직원 탐색" : "Employee navigation"}
        navLinks={navLinks}
        navSections={navSections}
        footerLinks={footerLinks}
      />
      <div className="app-shell">
        <header className="app-header">
          <div className="header-brand">
            <Link className="header-brand-link" href="/employee">
              <span className="brand-dot" />
              <span>FlowHR</span>
            </Link>
          </div>
          <div className="header-search header-placeholder-search">
            {isKoLocale ? "오늘 할 일, 요청, 문서, 계정 상태를 한 흐름으로 정리합니다." : "Bring today's work, requests, documents, and account status into one flow."}
          </div>
          <div className="header-actions">
            <div className="header-actions-group">
              <NotificationBell href="/employee/notifications" />
              {showDevTools ? (
                <Link className="header-link-chip" href="/admin">
                  {isKoLocale ? "관리자" : "Admin"}
                </Link>
              ) : null}
              <div className="header-avatar">
                <span className="header-avatar-text">{isKoLocale ? "직원" : "Employee"}</span>
              </div>
            </div>
          </div>
        </header>

        <aside className="app-sidebar">
          {navSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <div className="nav-section-label">{section.title}</div>
              {section.links.map((item) => (
                <AppNavLink href={item.href} key={item.href} label={item.label} />
              ))}
            </div>
          ))}

          <div className="app-sidebar-footer">
            <SessionMenu className="session-menu sidebar-session" />
            {showDevTools ? <AppNavLink href="/admin" label={isKoLocale ? "관리자 홈" : "Admin home"} muted /> : null}
          </div>
        </aside>

        <main className="app-main">
          <div className="app-main-scroll">{children}</div>
        </main>
      </div>
    </>
  );
}
