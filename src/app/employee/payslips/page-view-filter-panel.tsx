"use client";

import Link from "next/link";

import type { SupabaseSessionSnapshot } from "@/lib/client/useSupabaseSession";
import type { PayslipPageCopy } from "@/app/employee/payslips/page-locale-helpers";
import { minutesToHours, type AttendanceAggregateDto } from "@/app/employee/payslips/page-helpers";
import type { ApiStats } from "@/app/employee/payslips/page-view-types";
import {
  formatActorRoleLabel,
  formatEmployeeSessionConnectionState,
  formatSignedInAccountLabel,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

type EmployeePayslipFilterPanelProps = {
  pageCopy: PayslipPageCopy;
  sourceContext: "employee-dashboard" | null;
  isKoLocale: boolean;
  isProductionRuntime: boolean;
  requiresLoginSession: boolean;
  productionSessionRequiredNotice: string;
  usesBearerToken: boolean;
  payslipStats: {
    count: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
  };
  stats: ApiStats;
  periodStart: string;
  setPeriodStart: (value: string) => void;
  periodEnd: string;
  setPeriodEnd: (value: string) => void;
  refreshPayslips: () => Promise<void>;
  applyCurrentMonthRange: () => void;
  applyPreviousMonthRange: () => void;
  applyLastThreeMonthsRange: () => void;
  downloadRunsCsv: () => void;
  hasRuns: boolean;
  showDevTools: boolean;
  pendingLabel: string | null;
  supabaseSession: SupabaseSessionSnapshot | null;
  supabaseSessionError: string | null;
  clearLogs: () => void;
  hasLogs: boolean;
  aggregate: AttendanceAggregateDto | null;
  formatKrw: (value: number | null) => string;
};

export function EmployeePayslipFilterPanel({
  pageCopy,
  sourceContext,
  isKoLocale,
  isProductionRuntime,
  requiresLoginSession,
  productionSessionRequiredNotice,
  usesBearerToken,
  payslipStats,
  stats,
  periodStart,
  setPeriodStart,
  periodEnd,
  setPeriodEnd,
  refreshPayslips,
  applyCurrentMonthRange,
  applyPreviousMonthRange,
  applyLastThreeMonthsRange,
  downloadRunsCsv,
  hasRuns,
  showDevTools,
  pendingLabel,
  supabaseSession,
  supabaseSessionError,
  clearLogs,
  hasLogs,
  aggregate,
  formatKrw
}: EmployeePayslipFilterPanelProps) {
  const locale = isKoLocale ? "ko" : "en";
  const hasWorkspaceSession = Boolean((supabaseSession?.organizationId ?? "").trim());
  const hasEmployeeSession = Boolean((supabaseSession?.actorId ?? supabaseSession?.userId ?? "").trim());
  const sourceContextLabel =
    sourceContext === "employee-dashboard"
      ? isKoLocale
        ? "직원 대시보드에서 이동했습니다."
        : "Opened from employee dashboard."
      : null;
  const sourceContextReturnLabel =
    sourceContext === "employee-dashboard"
      ? isKoLocale
        ? "대시보드로 돌아가기"
        : "Back to dashboard"
      : pageCopy.nav.employeePortal;

  return (
    <>
      <header className="page-header workspace-page-header employee-workspace-status-header">
        <div>
          <h1 className="page-title">{pageCopy.pageTitle}</h1>
          <p className="page-subtitle">{pageCopy.pageSubtitle}</p>
          {sourceContextLabel ? (
            <p className="small muted workspace-source-banner">{sourceContextLabel}</p>
          ) : null}
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            {sourceContextReturnLabel}
          </Link>
          <Link className="btn btn-secondary" href="/login">
            {pageCopy.nav.login}
          </Link>
          {showDevTools ? (
            <Link className="btn btn-secondary" href="/admin">
              {isKoLocale ? "(개발) 관리자" : "(dev) Admin"}
            </Link>
          ) : null}
          <Link className="btn btn-secondary" href="/">
            {pageCopy.nav.home}
          </Link>
        </div>
      </header>

      {requiresLoginSession ? (
        <p className="small fail workspace-inline-status">
          {productionSessionRequiredNotice} <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-strip workspace-summary-strip employee-workspace-status-strip">
        <article className="kpi-card workspace-summary-card employee-workspace-status-card">
          <p>{pageCopy.kpi.count}</p>
          <strong>{payslipStats.count}</strong>
        </article>
        <article className="kpi-card workspace-summary-card employee-workspace-status-card">
          <p>{pageCopy.kpi.totalGross}</p>
          <strong>{formatKrw(payslipStats.totalGross)}</strong>
        </article>
        <article className="kpi-card workspace-summary-card employee-workspace-status-card">
          <p>{pageCopy.kpi.totalDeductions}</p>
          <strong>{formatKrw(payslipStats.totalDeductions)}</strong>
        </article>
        <article className="kpi-card workspace-summary-card employee-workspace-status-card">
          <p>{pageCopy.kpi.totalNet}</p>
          <strong>{formatKrw(payslipStats.totalNet)}</strong>
        </article>
        <article className="kpi-card workspace-summary-card employee-workspace-status-card">
          <p>{pageCopy.kpi.apiCalls}</p>
          <strong>
            {stats.total} ({pageCopy.kpi.ok} {stats.success} / {pageCopy.kpi.fail} {stats.fail})
          </strong>
        </article>
      </section>

      <article className="panel workspace-section-card workspace-toolbar-card">
        <h2>{pageCopy.filters.title}</h2>
        {showDevTools ? (
          <p className="small muted">
            {pageCopy.devTools.sessionOrganizationLabel}:{" "}
            <strong>{formatWorkspaceConnectionState(hasWorkspaceSession, locale)}</strong> /{" "}
            {pageCopy.devTools.sessionActorLabel}:{" "}
            <strong>{formatEmployeeSessionConnectionState(hasEmployeeSession, locale)}</strong>
          </p>
        ) : null}
        <div className="input-grid">
          <label>
            {pageCopy.filters.periodStart}
            <input
              type="datetime-local"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
            />
          </label>
          <label>
            {pageCopy.filters.periodEnd}
            <input
              type="datetime-local"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
            />
          </label>
        </div>
        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={() => void refreshPayslips()}
            disabled={requiresLoginSession}
          >
            {pageCopy.filters.actions.refresh}
          </button>
          <button className="btn btn-secondary" onClick={applyCurrentMonthRange}>
            {pageCopy.filters.actions.currentMonth}
          </button>
          <button className="btn btn-secondary" onClick={applyPreviousMonthRange}>
            {pageCopy.filters.actions.previousMonth}
          </button>
          <button className="btn btn-secondary" onClick={applyLastThreeMonthsRange}>
            {pageCopy.filters.actions.lastThreeMonths}
          </button>
          <button
            className="btn btn-secondary"
            onClick={downloadRunsCsv}
            disabled={!hasRuns || requiresLoginSession}
          >
            {pageCopy.filters.actions.downloadCsv}
          </button>
        </div>

        {showDevTools ? (
          <details className="details" style={{ marginTop: 12 }}>
            <summary>
              {pageCopy.devTools.summary} <small>({pageCopy.devTools.hiddenByDefault})</small>
            </summary>
            <p className="small">
              {pageCopy.devTools.callCount} {stats.total} ({pageCopy.kpi.ok} {stats.success} / {pageCopy.kpi.fail} {stats.fail}) / {pageCopy.devTools.current} {pendingLabel ?? "-"}
            </p>
            {isProductionRuntime ? (
              <p className="small muted">
                {pageCopy.devTools.session}:{" "}
                {supabaseSession
                  ? `${formatSignedInAccountLabel(supabaseSession.email, locale)} / ${
                      pageCopy.devTools.sessionRoleLabel
                    }: ${
                      supabaseSession.role ? formatActorRoleLabel(supabaseSession.role, locale) : "-"
                    } / ${pageCopy.devTools.sessionOrganizationLabel}: ${formatWorkspaceConnectionState(
                      hasWorkspaceSession,
                      locale
                    )} / ${pageCopy.devTools.sessionActorLabel}: ${formatEmployeeSessionConnectionState(
                      hasEmployeeSession,
                      locale
                    )}`
                  : pageCopy.devTools.none}{" "}
                ({pageCopy.devTools.bearerStatusLabel}{" "}
                {usesBearerToken ? pageCopy.devTools.bearerOn : pageCopy.devTools.bearerOff})
              </p>
            ) : null}
            {supabaseSessionError ? (
              <p className="small" style={{ color: "var(--danger)" }}>
                {pageCopy.devTools.sessionError}: {supabaseSessionError}
              </p>
            ) : null}
            <div className="actions">
              <button className="btn btn-secondary" onClick={clearLogs} disabled={!hasLogs}>
                {pageCopy.devTools.clearLogs}
              </button>
            </div>
          </details>
        ) : null}

        {aggregate ? (
          <p className="small">
            {pageCopy.attendance.summaryPrefix}: {pageCopy.attendance.regular}{" "}
            {minutesToHours(aggregate.totals.regular, isKoLocale)} / {pageCopy.attendance.overtime}{" "}
            {minutesToHours(aggregate.totals.overtime, isKoLocale)} / {pageCopy.attendance.night}{" "}
            {minutesToHours(aggregate.totals.night, isKoLocale)} / {pageCopy.attendance.holiday}{" "}
            {minutesToHours(aggregate.totals.holiday, isKoLocale)} ({pageCopy.attendance.payable}{" "}
            {aggregate.counts.payable}
            {pageCopy.attendance.payableUnit})
          </p>
        ) : (
          <p className="small muted">{pageCopy.attendance.empty}</p>
        )}
      </article>
    </>
  );
}
