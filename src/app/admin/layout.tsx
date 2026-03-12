import Link from "next/link";
import type { ReactNode } from "react";

import { buildAdminShellNavSections } from "@/app/admin/admin-shell-navigation";
import NotificationBell from "@/components/NotificationBell";
import SessionMenu from "@/components/SessionMenu";
import SaasMobileMenu, { type SaasMobileMenuLink } from "@/components/layout/SaasMobileMenu";
import AppNavLink from "@/components/v2/AppNavLink";
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
  const isKoLocale = locale === "ko";

  const navSections = buildAdminShellNavSections(t);
  const adminLinks: SaasMobileMenuLink[] = navSections.flatMap((section) => section.links);
  const mobileFooterLinks: SaasMobileMenuLink[] = [
    { href: "/employee", label: isKoLocale ? "직원 홈" : "Employee home" }
  ];

  if (showDevTools) {
    mobileFooterLinks.push({ href: "/ops/mvp-console", label: isKoLocale ? "ops 콘솔" : "Ops console", muted: true });
  }

  return (
    <>
      <SaasMobileMenu
        badge={isKoLocale ? "관리자" : "Admin"}
        menuLabel={isKoLocale ? "메뉴" : "Menu"}
        navAriaLabel={isKoLocale ? "관리자 탐색" : "Admin navigation"}
        navLinks={adminLinks}
        navSections={navSections}
        footerLinks={mobileFooterLinks}
      />
      <div className="app-shell">
        <header className="app-header">
          <div className="header-brand">
            <Link className="header-brand-link" href="/admin">
              <span className="brand-dot" />
              <span>FlowHR</span>
            </Link>
          </div>
          <div className="header-search header-placeholder-search">
            {isKoLocale ? "검색과 전역 명령은 다음 파동에서 연결합니다." : "Search and global command launcher follow in the next wave."}
          </div>
          <div className="header-actions">
            <div className="header-actions-group">
              <NotificationBell href="/admin/notifications" />
              <Link className="header-link-chip" href="/employee">
                {isKoLocale ? "직원 홈" : "Employee"}
              </Link>
              <div className="header-avatar">
                <span className="header-avatar-text">{isKoLocale ? "관리" : "Admin"}</span>
              </div>
            </div>
          </div>
        </header>

        <aside className="app-sidebar">
          <div className="nav-section">
            <div className="nav-section-label">{isKoLocale ? "FlowHR Admin" : "FlowHR Admin"}</div>
            {navSections.map((section) => (
              <div className="nav-section" key={section.key}>
                <div className="nav-section-label">{section.title}</div>
                {section.links.map((item) => (
                  <AppNavLink href={item.href} key={item.href} label={item.label} />
                ))}
              </div>
            ))}
          </div>
          <div className="app-sidebar-footer">
            <SessionMenu className="session-menu sidebar-session" />
            {showDevTools ? (
              <AppNavLink href="/ops/mvp-console" label={isKoLocale ? "ops 콘솔" : "Ops console"} muted />
            ) : null}
          </div>
        </aside>

        <main className="app-main">
          <div className="app-main-scroll">{children}</div>
        </main>
      </div>
    </>
  );
}
