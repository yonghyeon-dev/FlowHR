"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { isTruthyFlag } from "@/app/admin/page-helpers";
import { isAdminHubSource, isAdminPayrollSource } from "@/app/admin/source-context";
import {
  normalizeAdminAnalyticsFocusMetric,
  resolveAdminAnalyticsBackHref
} from "@/components/admin-kpi/admin-analytics-context";
import { payrollCloseCopyByLocale } from "@/components/payroll-close/copy";
import type { ApiLog, PayrollClosePeriodResponse } from "@/components/payroll-close/types";
import {
  defaultMonthRange,
  formatKrw,
  toSeoulEndIso,
  toSeoulStartIso
} from "@/components/payroll-close/types";
import { normalizePayrollYearEndRuntimeMessage } from "@/components/payroll-year-end/runtime-copy-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatAdminSessionConnectionState,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

export type PayrollCloseQueueMode = "all" | "previewed";

function parseRequiredInt(value: string, fieldLabel: string, nonNegativeIntegerLabel: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldLabel} ${nonNegativeIntegerLabel}`);
  }
  return parsed;
}

type PayrollClosePeriodConsoleProps = {
  queueMode?: PayrollCloseQueueMode;
};

export default function PayrollClosePeriodConsole({
  queueMode = "all"
}: PayrollClosePeriodConsoleProps) {
  const searchParams = useSearchParams();
  const range = defaultMonthRange();
  const [periodStartDate, setPeriodStartDate] = useState(range.periodStartDate);
  const [periodEndDate, setPeriodEndDate] = useState(range.periodEndDate);
  const [priorPaidWithholdingTaxKrw, setPriorPaidWithholdingTaxKrw] = useState("0");
  const [priorPaidSocialInsuranceKrw, setPriorPaidSocialInsuranceKrw] = useState("0");
  const [priorPaidNetPayKrw, setPriorPaidNetPayKrw] = useState("0");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<PayrollClosePeriodResponse | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "PAY-1001").trim() || "PAY-1001";
  const hasWorkspaceSession = organizationId.length > 0;
  const hasAdminSession = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "").trim().length > 0;
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = payrollCloseCopyByLocale[locale];
  const source = searchParams.get("source");
  const analyticsFocusMetric = normalizeAdminAnalyticsFocusMetric(
    searchParams.get("analyticsFocus")
  );
  const analyticsBackHref = resolveAdminAnalyticsBackHref(source, analyticsFocusMetric);
  const focusLabel = queueMode === "previewed" ? copy.focusPreviewedLabel : copy.focusAllLabel;
  const showPayrollSource = isAdminPayrollSource(source);
  const analyticsFocusLabel =
    searchParams.get("focusMetric") === "payrollConfirmedRate"
      ? locale === "ko"
        ? "급여 확정률"
        : "Payroll confirmation rate"
      : focusLabel;
  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);
  const normalizedSupabaseSessionError = useMemo(() => {
    if (!supabaseSessionError) {
      return null;
    }
    return normalizePayrollYearEndRuntimeMessage(
      supabaseSessionError,
      locale,
      copy.statusRequestFailed
    );
  }, [copy.statusRequestFailed, locale, supabaseSessionError]);
  const summaryStatusLabel = result
    ? result.summary.canClose
      ? copy.statusLoadedCloseSummaryPrefix
      : copy.statusLoadedCloseSummaryBlocked
    : pendingLabel ?? copy.noCloseSummaryYet;

  async function runClosePeriod(apply: boolean) {
    try {
      const payload = {
        periodStart: toSeoulStartIso(periodStartDate),
        periodEnd: toSeoulEndIso(periodEndDate),
        apply,
        settlement: {
          priorPaidWithholdingTaxKrw: parseRequiredInt(
            priorPaidWithholdingTaxKrw,
            copy.priorPaidWithholdingLabel,
            copy.statusNonNegativeInteger
          ),
          priorPaidSocialInsuranceKrw: parseRequiredInt(
            priorPaidSocialInsuranceKrw,
            copy.priorPaidSocialInsuranceLabel,
            copy.statusNonNegativeInteger
          ),
          priorPaidNetPayKrw: parseRequiredInt(
            priorPaidNetPayKrw,
            copy.priorPaidNetPayoutLabel,
            copy.statusNonNegativeInteger
          )
        }
      };

      setPendingLabel(apply ? copy.pendingApply : copy.pendingPreview);
      const headers: Record<string, string> = {
        "content-type": "application/json"
      };
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "payroll_operator";
        headers["x-actor-id"] = adminActorId.trim() || "PAY-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch("/api/payroll/runs/close-period", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let body: unknown = null;
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      setLogs((prev) => [
        {
          id: Date.now(),
          label: apply ? copy.logApply : copy.logPreview,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);

      if (!response.ok || !body || typeof body !== "object") {
        setStatusMessage(copy.statusRequestFailed);
        return;
      }

      const parsed = body as PayrollClosePeriodResponse;
      setResult(parsed);
      setStatusMessage(
        parsed.summary.canClose
          ? `${copy.statusLoadedCloseSummaryPrefix} ${formatKrw(
              parsed.summary.settlementKrw.remittanceDeltaKrw,
              runtimeLocale
            )}`
          : copy.statusLoadedCloseSummaryBlocked
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? normalizePayrollYearEndRuntimeMessage(error.message, locale, copy.statusInvalidInput)
          : copy.statusInvalidInput
      );
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        {isAdminHubSource(source) ? (
          <p className="small muted workspace-source-banner">
            {copy.dashboardSourceBanner} · {copy.dashboardSourceFocusLabel}: {focusLabel}
          </p>
        ) : null}
        {showPayrollSource ? (
          <p className="small muted workspace-source-banner">
            {copy.payrollSourceBanner} 쨌 {copy.payrollSourceFocusLabel}: {focusLabel}
          </p>
        ) : null}
        {source === "admin-analytics" ? (
          <p className="small muted workspace-source-banner">
            {locale === "ko" ? "관리자 분석에서 이동했습니다" : "Opened from admin analytics"} ·{" "}
            {locale === "ko" ? "집중 큐" : "Focus queue"}: {analyticsFocusLabel}
          </p>
        ) : null}
        <div className="page-actions" style={{ marginTop: 8 }}>
          {analyticsBackHref ? (
            <Link href={analyticsBackHref} className="btn btn-secondary btn-small">
              {locale === "ko" ? "분석으로 돌아가기" : "Back to analytics"}
            </Link>
          ) : null}
          {showPayrollSource ? (
            <Link href="/admin/payroll" className="btn btn-secondary btn-small">
              {copy.backToPayroll}
            </Link>
          ) : null}
          <Link href="/admin" className="btn btn-secondary btn-small">
            {copy.backToAdmin}
          </Link>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip" aria-label={copy.title}>
        <article className="kpi">
          <span>
            {showPayrollSource ? copy.payrollSourceFocusLabel : copy.dashboardSourceFocusLabel}
          </span>
          <strong>{focusLabel}</strong>
        </article>
        <article className="kpi">
          <span>{copy.periodStartLabel}</span>
          <strong>
            {periodStartDate} ~ {periodEndDate}
          </strong>
        </article>
        <article className="kpi">
          <span>{copy.apiLogsTotalLabel}</span>
          <strong>
            {stats.total} / {copy.apiLogsSuccessLabel} {stats.success}
          </strong>
        </article>
        <article className="kpi">
          <span>{copy.statusLoadedCloseSummaryPrefix}</span>
          <strong>{summaryStatusLabel}</strong>
        </article>
      </section>

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <h2>{copy.inputTitle}</h2>
          {showDevTools ? (
            <p className="small muted">
              {copy.sessionOrganizationLabel}:{" "}
              <strong>{formatWorkspaceConnectionState(hasWorkspaceSession, runtimeLocale)}</strong> /{" "}
              {copy.sessionActorLabel}:{" "}
              <strong>{formatAdminSessionConnectionState(hasAdminSession, runtimeLocale)}</strong>
            </p>
          ) : null}
          <div className="input-grid">
            <label>
              {copy.periodStartLabel}
              <input
                type="date"
                value={periodStartDate}
                onChange={(event) => setPeriodStartDate(event.target.value)}
              />
            </label>
            <label>
              {copy.periodEndLabel}
              <input
                type="date"
                value={periodEndDate}
                onChange={(event) => setPeriodEndDate(event.target.value)}
              />
            </label>
            <label>
              {copy.priorPaidWithholdingLabel}
              <input
                value={priorPaidWithholdingTaxKrw}
                onChange={(event) => setPriorPaidWithholdingTaxKrw(event.target.value)}
              />
            </label>
            <label>
              {copy.priorPaidSocialInsuranceLabel}
              <input
                value={priorPaidSocialInsuranceKrw}
                onChange={(event) => setPriorPaidSocialInsuranceKrw(event.target.value)}
              />
            </label>
            <label>
              {copy.priorPaidNetPayoutLabel}
              <input
                value={priorPaidNetPayKrw}
                onChange={(event) => setPriorPaidNetPayKrw(event.target.value)}
              />
            </label>
          </div>
          <div className="panel-actions">
            <button
              className="btn btn-secondary"
              onClick={() => void runClosePeriod(false)}
              disabled={pendingLabel !== null}
            >
              {copy.previewAction}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void runClosePeriod(true)}
              disabled={pendingLabel !== null}
            >
              {copy.applyAction}
            </button>
          </div>
          {statusMessage ? <p className="small workspace-inline-status">{statusMessage}</p> : null}
          {normalizedSupabaseSessionError ? (
            <p className="small fail workspace-inline-status">
              {copy.sessionErrorPrefix}: {normalizedSupabaseSessionError}
            </p>
          ) : null}
        </article>

        <article className="panel workspace-section-card">
          <h2>{copy.runStatesTitle}</h2>
          {!result ? (
            <p className="small">{copy.noCloseSummaryYet}</p>
          ) : (
            <ul className="simple-list">
              <li>
                <span>{copy.canCloseLabel}</span>
                <strong>{result.summary.canClose ? copy.yes : copy.no}</strong>
              </li>
              <li>
                <span>{copy.totalConfirmedPreviewedLabel}</span>
                <strong>
                  {result.summary.runStates.totalRuns} / {result.summary.runStates.confirmedRuns} /{" "}
                  {result.summary.runStates.previewedRuns}
                </strong>
              </li>
              <li>
                <span>{copy.blockingRunIdsLabel}</span>
                <strong>{result.summary.runStates.blockingRunIds.join(", ") || "-"}</strong>
              </li>
              <li>
                <span>{copy.blockingReasonsLabel}</span>
                <strong>{result.summary.runStates.blockingReasons.join(" | ") || "-"}</strong>
              </li>
            </ul>
          )}
        </article>

        <article className="panel workspace-section-card">
          <h2>{copy.totalsDeltaTitle}</h2>
          {!result ? (
            <p className="small">{copy.noTotalsYet}</p>
          ) : (
            <ul className="simple-list">
              <li>
                <span>{copy.grossNetLabel}</span>
                <strong>
                  {formatKrw(result.summary.totalsKrw.grossPayKrw, runtimeLocale)} /{" "}
                  {formatKrw(result.summary.totalsKrw.netPayKrw, runtimeLocale)}
                </strong>
              </li>
              <li>
                <span>{copy.withholdingSocialInsuranceLabel}</span>
                <strong>
                  {formatKrw(result.summary.totalsKrw.withholdingTaxKrw, runtimeLocale)} /{" "}
                  {formatKrw(result.summary.totalsKrw.socialInsuranceKrw, runtimeLocale)}
                </strong>
              </li>
              <li>
                <span>{copy.incomeTaxLabel}</span>
                <strong>
                  {formatKrw(
                    result.summary.totalsKrw.withholdingBreakdownKrw.incomeTaxKrw,
                    runtimeLocale
                  )}
                </strong>
              </li>
              <li>
                <span>{copy.residentTaxLabel}</span>
                <strong>
                  {formatKrw(
                    result.summary.totalsKrw.withholdingBreakdownKrw.residentTaxKrw,
                    runtimeLocale
                  )}
                </strong>
              </li>
              <li>
                <span>{copy.nationalPensionLabel}</span>
                <strong>
                  {formatKrw(
                    result.summary.totalsKrw.socialInsuranceBreakdownKrw.nationalPensionKrw,
                    runtimeLocale
                  )}
                </strong>
              </li>
              <li>
                <span>{copy.healthInsuranceLabel}</span>
                <strong>
                  {formatKrw(
                    result.summary.totalsKrw.socialInsuranceBreakdownKrw.healthInsuranceKrw,
                    runtimeLocale
                  )}
                </strong>
              </li>
              <li>
                <span>{copy.employmentInsuranceLabel}</span>
                <strong>
                  {formatKrw(
                    result.summary.totalsKrw.socialInsuranceBreakdownKrw.employmentInsuranceKrw,
                    runtimeLocale
                  )}
                </strong>
              </li>
              <li>
                <span>{copy.industrialAccidentLabel}</span>
                <strong>
                  {formatKrw(
                    result.summary.totalsKrw.socialInsuranceBreakdownKrw.industrialAccidentKrw,
                    runtimeLocale
                  )}
                </strong>
              </li>
              <li>
                <span>{copy.deductionsOtherLabel}</span>
                <strong>
                  {formatKrw(result.summary.totalsKrw.totalDeductionsKrw, runtimeLocale)} /{" "}
                  {formatKrw(result.summary.totalsKrw.otherDeductionsKrw, runtimeLocale)}
                </strong>
              </li>
              <li>
                <span>{copy.withholdingDeltaLabel}</span>
                <strong>{formatKrw(result.summary.settlementKrw.withholdingTaxDeltaKrw, runtimeLocale)}</strong>
              </li>
              <li>
                <span>{copy.socialInsuranceDeltaLabel}</span>
                <strong>{formatKrw(result.summary.settlementKrw.socialInsuranceDeltaKrw, runtimeLocale)}</strong>
              </li>
              <li>
                <span>{copy.netPayDeltaLabel}</span>
                <strong>{formatKrw(result.summary.settlementKrw.netPayDeltaKrw, runtimeLocale)}</strong>
              </li>
              <li>
                <span>{copy.remittanceDeltaLabel}</span>
                <strong>{formatKrw(result.summary.settlementKrw.remittanceDeltaKrw, runtimeLocale)}</strong>
              </li>
            </ul>
          )}
        </article>

        {showDevTools ? (
          <article className="panel workspace-section-card workspace-note-card workspace-side-panel">
            <h2>{copy.apiLogsTitle}</h2>
            <p className="small">
              {copy.apiLogsTotalLabel} {stats.total} / {copy.apiLogsSuccessLabel} {stats.success} /{" "}
              {copy.apiLogsFailLabel} {stats.fail}
              {pendingLabel ? ` / ${copy.apiLogsRunningLabel} ${pendingLabel}` : ""}
            </p>
            {logs.length === 0 ? (
              <p className="small">{copy.noApiCallYet}</p>
            ) : (
              <ul className="log-list">
                {logs.map((log) => (
                  <li key={log.id}>
                    <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.okLabel : copy.failLabel}</span>{" "}
                    {log.label} / {log.status}
                    <time>{log.at}</time>
                  </li>
                ))}
              </ul>
            )}
            <div className="panel-actions">
              <Link href={showPayrollSource ? "/admin/payroll" : "/admin"} className="btn btn-secondary">
                {showPayrollSource ? copy.backToPayroll : copy.backToAdmin}
              </Link>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
