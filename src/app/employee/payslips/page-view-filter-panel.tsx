"use client";

import Link from "next/link";

import type { SupabaseSessionSnapshot } from "@/lib/client/useSupabaseSession";
import type { PayslipPageCopy } from "@/app/employee/payslips/page-locale-helpers";
import { minutesToHours, type AttendanceAggregateDto } from "@/app/employee/payslips/page-helpers";
import type { ApiStats } from "@/app/employee/payslips/page-view-types";

type EmployeePayslipFilterPanelProps = {
  pageCopy: PayslipPageCopy;
  sourceContext: "employee-dashboard" | null;
  isKoLocale: boolean;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
  payslipStats: {
    count: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
  };
  stats: ApiStats;
  organizationId: string;
  employeeId: string;
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
  usesBearerToken,
  payslipStats,
  stats,
  organizationId,
  employeeId,
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
      <header className="page-header">
        <div>
          <h1 className="page-title">{pageCopy.pageTitle}</h1>
          <p className="page-subtitle">{pageCopy.pageSubtitle}</p>
          {sourceContextLabel ? <p className="small muted">{sourceContextLabel}</p> : null}
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

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          {pageCopy.productionNotice.prefix} <strong>{pageCopy.productionNotice.runtimeLabel}</strong>
          {pageCopy.productionNotice.suffix} <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>{pageCopy.kpi.count}</p>
          <strong>{payslipStats.count}</strong>
        </article>
        <article className="kpi-card">
          <p>{pageCopy.kpi.totalGross}</p>
          <strong>{formatKrw(payslipStats.totalGross)}</strong>
        </article>
        <article className="kpi-card">
          <p>{pageCopy.kpi.totalDeductions}</p>
          <strong>{formatKrw(payslipStats.totalDeductions)}</strong>
        </article>
        <article className="kpi-card">
          <p>{pageCopy.kpi.totalNet}</p>
          <strong>{formatKrw(payslipStats.totalNet)}</strong>
        </article>
        <article className="kpi-card">
          <p>{pageCopy.kpi.apiCalls}</p>
          <strong>
            {stats.total} ({pageCopy.kpi.ok} {stats.success} / {pageCopy.kpi.fail} {stats.fail})
          </strong>
        </article>
      </section>

      <article className="panel">
        <h2>{pageCopy.filters.title}</h2>
        {showDevTools ? (
          <p className="small muted">
            {pageCopy.filters.organizationIdOptional}: <code>{organizationId || "-"}</code> /{" "}
            {pageCopy.filters.employeeId}: <code>{employeeId || "-"}</code>
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
          <button className="btn btn-primary" onClick={() => void refreshPayslips()}>
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
          <button className="btn btn-secondary" onClick={downloadRunsCsv} disabled={!hasRuns}>
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
                  ? `${supabaseSession.email ?? supabaseSession.userId} / ${pageCopy.devTools.sessionRoleLabel}: ${supabaseSession.role ?? "-"} / ${pageCopy.devTools.sessionOrganizationLabel}: ${supabaseSession.organizationId ?? "-"} / ${pageCopy.devTools.sessionActorLabel}: ${supabaseSession.actorId ?? "-"}`
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
