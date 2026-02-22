import Link from "next/link";
import type { ReactNode } from "react";

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

  return (
    <div className="saas-shell">
      <aside className="saas-sidebar">
        <div className="saas-brand">
          <Link href="/">FlowHR</Link>
          <span className="saas-badge">{t("employee.badge")}</span>
        </div>

        <nav className="saas-nav" aria-label={t("employee.nav.aria")}>
          <Link href="/employee">{t("employee.nav.overview")}</Link>
          <Link href="/employee#account">{t("employee.nav.account")}</Link>
          <Link href="/employee#self-service-overview">{t("employee.nav.selfServiceOverview")}</Link>
          <Link href="/employee#submit-checklist">{t("employee.nav.submitChecklist")}</Link>
          <Link href="/employee#request-feedback">{t("employee.nav.requestFeedback")}</Link>
          <Link href="/employee#request-search-sort">{t("employee.nav.requestSearchSort")}</Link>
          <Link href="/employee#request-timeline">{t("employee.nav.requestTimeline")}</Link>
          <Link href="/employee#request-resubmit">{t("employee.nav.requestResubmit")}</Link>
          <Link href="/employee#attendance">{t("employee.nav.attendance")}</Link>
          <Link href="/employee#leave">{t("employee.nav.leave")}</Link>
          <Link href="/employee#leave-calendar">{t("employee.nav.leaveCalendar")}</Link>
          <Link href="/employee#schedule">{t("employee.nav.schedule")}</Link>
          <Link href="/employee/payslips">{t("employee.nav.payslips")}</Link>
          <Link href="/employee/payslip-receipts">{t("employee.nav.payslipReceipts")}</Link>
          <Link href="/employee/withholding-receipt">{t("employee.nav.withholdingReceipt")}</Link>
          <Link href="/employee/payslips#payslip-search-sort">{t("employee.nav.payslipSearchSort")}</Link>
          <Link href="/employee/payslips#status-feedback">{t("employee.nav.statusFeedback")}</Link>
          <Link href="/employee/payslips#compare-view">{t("employee.nav.compareView")}</Link>
        </nav>

        <div className="saas-sidebar-footer">
          <SessionMenu />
          {showDevTools ? <Link href="/admin">{t("employee.nav.admin")}</Link> : null}
        </div>
      </aside>

      <div className="saas-main">{children}</div>
    </div>
  );
}
