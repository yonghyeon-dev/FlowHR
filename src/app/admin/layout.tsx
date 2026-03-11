import Link from "next/link";
import type { ReactNode } from "react";

import SaasMobileMenu, {
  type SaasMobileMenuLink,
} from "@/components/layout/SaasMobileMenu";
import { buildAdminShellNavSections } from "@/app/admin/admin-shell-navigation";
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

  const navSections = buildAdminShellNavSections(t);
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
      <div className="saas-shell admin-shell">
        <aside className="saas-sidebar admin-sidebar">
          <div className="saas-brand">
            <Link href="/">FlowHR</Link>
            <span className="saas-badge">{t("admin.badge")}</span>
          </div>
          <p className="admin-sidebar-copy">
            {locale === "ko"
              ? "고객사 운영자가 우선순위를 보고 전용 워크스페이스로 이동하는 허브입니다."
              : "A hub for customer admins to review priorities and continue in dedicated workspaces."}
          </p>

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

          <div className="saas-sidebar-footer admin-sidebar-footer">
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
