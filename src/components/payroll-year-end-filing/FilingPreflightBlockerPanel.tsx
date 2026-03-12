"use client";

import Link from "next/link";

import { withAdminSource } from "@/app/admin/source-context";
import type { PayrollYearEndFilingCopy } from "@/components/payroll-year-end-filing/copy";
import type { PayrollYearEndPreflightChecklistResponse } from "@/components/payroll-year-end/types";
import type { FlowLocale } from "@/lib/i18n/locales";

type FilingPreflightBlockerPanelProps = {
  locale: FlowLocale;
  runtimeLocale: string;
  checklist: PayrollYearEndPreflightChecklistResponse | null;
  copy: PayrollYearEndFilingCopy;
  showPayrollSource: boolean;
  disabled: boolean;
  onLoadChecklist: () => void;
  onOpenPendingSubmissions: () => void;
  onOpenRejectedSubmissions: () => void;
  onPreviewFinalization: () => void;
  onClearChecklist: () => void;
};

const preflightPanelCopyByLocale = {
  ko: {
    title: "\uc5f0\ub9d0\uc815\uc0b0 \uc0ac\uc804 \ucc28\ub2e8 \ud56d\ubaa9",
    description:
      "\uc815\uc0b0 \uc2e4\ud589 \uc804\uc5d0 \uc2e4\ud328\ud55c \uc0ac\uc804\uc810\uac80 \ud56d\ubaa9\uc744 \ud655\uc778\ud558\uace0 \ubc14\ub85c \ud6c4\uc18d \uc870\uce58\ub97c \uc9c4\ud589\ud558\uc138\uc694.",
    loadChecklistAction: "\uc0ac\uc804\uc810\uac80 \ubd88\ub7ec\uc624\uae30",
    noChecklist: "\uc544\uc9c1 \uc0ac\uc804\uc810\uac80 \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.",
    summaryLabel: "\uc900\ube44 \uc0c1\ud0dc",
    passFailWarnLabel: "\ud1b5\uacfc/\uc2e4\ud328/\uacbd\uace0",
    noFailures: "\ucc28\ub2e8 \ud56d\ubaa9\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
    failedChecksTitle: "\uc2e4\ud328 \ud56d\ubaa9",
    warningChecksTitle: "\uacbd\uace0 \ud56d\ubaa9",
    detailsAction: "\uccb4\ud06c\ub9ac\uc2a4\ud2b8 \uc0c1\uc138 \uc5f4\uae30",
    clearAction: "\uacb0\uacfc \uc228\uae30\uae30",
    warnLabel: "\uacbd\uace0",
    openPayrollCloseAction: "\uae09\uc5ec \ub9c8\uac10 \ud654\uba74 \uc5f4\uae30",
    openPayslipDeliveryAction: "\uba85\uc138\uc11c \ubc30\ud3ec \ud654\uba74 \uc5f4\uae30",
    refreshSettlementHashAction: "\ucd5c\uc2e0 \uc815\uc0b0 \uae30\uc900 \ub2e4\uc2dc \ubd88\ub7ec\uc624\uae30",
    openRejectedSubmissionsAction: "\uac70\uc808 \uc2e0\uace0 \ud070\uc218 \uc5f4\uae30"
  },
  en: {
    title: "Year-End Preflight Blockers",
    description: "Review failed preflight checks and run follow-up actions before finalization.",
    loadChecklistAction: "Load Preflight",
    noChecklist: "No preflight result yet.",
    summaryLabel: "Readiness",
    passFailWarnLabel: "pass/fail/warn",
    noFailures: "No blocking checks.",
    failedChecksTitle: "Failed checks",
    warningChecksTitle: "Warnings",
    detailsAction: "Open preflight details",
    clearAction: "Hide checklist",
    warnLabel: "WARN",
    openPayrollCloseAction: "Open payroll close",
    openPayslipDeliveryAction: "Open payslip delivery",
    refreshSettlementHashAction: "Reload settlement basis",
    openRejectedSubmissionsAction: "Open rejected submissions"
  }
} as const;

export default function FilingPreflightBlockerPanel(props: FilingPreflightBlockerPanelProps) {
  const {
    locale,
    runtimeLocale,
    checklist,
    copy,
    showPayrollSource,
    disabled,
    onLoadChecklist,
    onOpenPendingSubmissions,
    onOpenRejectedSubmissions,
    onPreviewFinalization,
    onClearChecklist
  } = props;
  const panelCopy = preflightPanelCopyByLocale[locale];
  const failedChecks = checklist?.checklist.checks.filter((check) => check.status === "fail") ?? [];
  const warningChecks = checklist?.checklist.checks.filter((check) => check.status === "warn") ?? [];
  const payrollCloseHref = showPayrollSource
    ? withAdminSource("/admin/payroll-close", "admin-payroll")
    : "/admin/payroll-close";
  const payslipDeliveryHref = showPayrollSource
    ? withAdminSource("/admin/payroll-payslip-delivery", "admin-payroll")
    : "/admin/payroll-payslip-delivery";
  const preflightHref = showPayrollSource
    ? withAdminSource("/admin/payroll-year-end/preflight", "admin-payroll")
    : "/admin/payroll-year-end/preflight";

  return (
    <article className="panel">
      <h2>{panelCopy.title}</h2>
      <p className="small">{panelCopy.description}</p>
      <div className="panel-actions">
        <button className="btn btn-secondary" onClick={onLoadChecklist} disabled={disabled}>
          {panelCopy.loadChecklistAction}
        </button>
        {checklist ? (
          <button className="btn btn-secondary" onClick={onClearChecklist} disabled={disabled}>
            {panelCopy.clearAction}
          </button>
        ) : null}
      </div>
      {!checklist ? (
        <p className="small">{panelCopy.noChecklist}</p>
      ) : (
        <>
          <ul className="simple-list">
            <li>
              <span>{panelCopy.summaryLabel}</span>
              <strong>{checklist.checklist.summary.readyToFinalize ? copy.yesLabel : copy.noLabel}</strong>
            </li>
            <li>
              <span>{panelCopy.passFailWarnLabel}</span>
              <strong>
                {checklist.checklist.summary.passCount}/{checklist.checklist.summary.failCount}/
                {checklist.checklist.summary.warnCount}
              </strong>
            </li>
          </ul>
          {failedChecks.length === 0 ? (
            <p className="small ok">{panelCopy.noFailures}</p>
          ) : (
            <>
              <h3>{panelCopy.failedChecksTitle}</h3>
              <ul className="log-list">
                {failedChecks.map((check) => (
                  <li key={check.key}>
                    <span className="fail">{copy.failLabel}</span> {check.label} / {check.detail}
                    <div className="panel-actions">
                      {check.key === "no_pending_filing_submissions" ? (
                        <button
                          className="btn btn-secondary"
                          onClick={onOpenPendingSubmissions}
                          disabled={disabled}
                        >
                          {copy.refreshSubmissionsAction}
                        </button>
                      ) : null}
                      {check.key === "non_taxable_within_annual_gross" ? (
                        <button
                          className="btn btn-secondary"
                          onClick={onPreviewFinalization}
                          disabled={disabled}
                        >
                          {copy.previewFinalizationAction}
                        </button>
                      ) : null}
                      {check.key === "confirmed_runs_present" || check.key === "no_previewed_runs" ? (
                        <Link href={payrollCloseHref} className="btn btn-secondary">
                          {panelCopy.openPayrollCloseAction}
                        </Link>
                      ) : null}
                      {check.key === "no_undistributed_runs" || check.key === "no_pending_receipts" ? (
                        <Link href={payslipDeliveryHref} className="btn btn-secondary">
                          {panelCopy.openPayslipDeliveryAction}
                        </Link>
                      ) : null}
                      {check.key !== "no_pending_filing_submissions" &&
                      check.key !== "non_taxable_within_annual_gross" &&
                      check.key !== "confirmed_runs_present" &&
                      check.key !== "no_previewed_runs" &&
                      check.key !== "no_undistributed_runs" &&
                      check.key !== "no_pending_receipts" ? (
                        <Link href={preflightHref} className="btn btn-secondary">
                          {panelCopy.detailsAction}
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          {warningChecks.length > 0 ? (
            <>
              <h3>{panelCopy.warningChecksTitle}</h3>
              <ul className="log-list">
                {warningChecks.map((check) => (
                  <li key={check.key}>
                    <span className="small">{panelCopy.warnLabel}</span> {check.label} / {check.detail}
                    {check.key === "settlement_hash_available" ? (
                      <div className="panel-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={onPreviewFinalization}
                          disabled={disabled}
                        >
                          {panelCopy.refreshSettlementHashAction}
                        </button>
                      </div>
                    ) : null}
                    {check.key === "no_rejected_filing_submissions" ? (
                      <div className="panel-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={onOpenRejectedSubmissions}
                          disabled={disabled}
                        >
                          {panelCopy.openRejectedSubmissionsAction}
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="small">
            {new Date(checklist.checklist.periodStart).toLocaleDateString(runtimeLocale)} -{" "}
            {new Date(checklist.checklist.periodEnd).toLocaleDateString(runtimeLocale)}
          </p>
        </>
      )}
    </article>
  );
}
