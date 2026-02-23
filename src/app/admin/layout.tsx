import Link from "next/link";
import type { ReactNode } from "react";

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

  return (
    <div className="saas-shell">
      <aside className="saas-sidebar">
        <div className="saas-brand">
          <Link href="/">FlowHR</Link>
          <span className="saas-badge">{t("admin.badge")}</span>
        </div>

        <nav className="saas-nav" aria-label={t("admin.nav.aria")}>
          <Link href="/admin">{t("admin.nav.dashboard")}</Link>
          <Link href="/admin/kpi">{t("admin.nav.kpi")}</Link>
          <Link href="/admin#approvals">{t("admin.nav.approvals")}</Link>
          <Link href="/admin#aggregates">{t("admin.nav.aggregates")}</Link>
          <Link href="/admin#leave-policy">{t("admin.nav.leavePolicy")}</Link>
          <Link href="/admin/leave-accrual">{t("admin.nav.leaveAccrual")}</Link>
          <Link href="/admin/leave-calendar">{t("admin.nav.leaveCalendar")}</Link>
          <Link href="/admin#payroll">{t("admin.nav.payroll")}</Link>
          <Link href="/admin/payroll-insurance">{t("admin.nav.insurance")}</Link>
          <Link href="/admin/payroll-close">{t("admin.nav.payrollClose")}</Link>
          <Link href="/admin/payroll-payslip-delivery">{t("admin.nav.payslipDelivery")}</Link>
          <Link href="/admin/payroll-year-end">{t("admin.nav.yearEnd")}</Link>
          <Link href="/admin/payroll-year-end-filing">{t("admin.nav.yearEndFiling")}</Link>
          <Link href="/admin/payroll-year-end-filing/ops">{t("admin.nav.yearEndFilingOps")}</Link>
          <Link href="/admin/payroll-year-end-filing/ops/alert">
            {t("admin.nav.yearEndFilingOpsFlatAlert")}
          </Link>
          <Link href="/admin/payroll-year-end-filing/ops/checklist-flow">
            {t("admin.nav.yearEndFilingOpsFlatChecklist")}
          </Link>
          <Link href="/admin/payroll-year-end-filing/ops/review">
            {t("admin.nav.yearEndFilingOpsFlatReview")}
          </Link>
          <Link href="/admin/payroll-year-end-filing/ops/close-off">
            {t("admin.nav.yearEndFilingOpsFlatCloseOff")}
          </Link>
          <Link href="/admin/payroll-year-end-filing/ops/delivery">
            {t("admin.nav.yearEndFilingOpsFlatDelivery")}
          </Link>
          <Link href="/admin/payroll-year-end-filing/ops/archive">
            {t("admin.nav.yearEndFilingOpsFlatArchive")}
          </Link>
          <Link href="/admin/payroll-year-end-filing/ops/report">
            {t("admin.nav.yearEndFilingOpsFlatReport")}
          </Link>
          <Link href="/admin/people">{t("admin.nav.people")}</Link>
          <Link href="/admin/contracts">{t("admin.nav.contracts")}</Link>
          <Link href="/admin/approval-policy">{t("admin.nav.approvalPolicy")}</Link>
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
  );
}
