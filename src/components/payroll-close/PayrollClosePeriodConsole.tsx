"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { payrollCloseCopyByLocale } from "@/components/payroll-close/copy";
import { isTruthyFlag } from "@/app/admin/page-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import type { ApiLog, PayrollClosePeriodResponse } from "@/components/payroll-close/types";
import {
  defaultMonthRange,
  formatKrw,
  toSeoulEndIso,
  toSeoulStartIso
} from "@/components/payroll-close/types";

function parseRequiredInt(value: string, fieldLabel: string, nonNegativeIntegerLabel: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldLabel} ${nonNegativeIntegerLabel}`);
  }
  return parsed;
}

export default function PayrollClosePeriodConsole() {
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
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = payrollCloseCopyByLocale[locale];
  const source = searchParams.get("source");
  const focus = searchParams.get("focus");
  const focusLabel =
    focus === "previewed"
      ? copy.focusPreviewedLabel
      : focus === "undistributed"
        ? copy.focusUndistributedLabel
        : copy.focusAllLabel;
  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

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
          ? `${copy.statusLoadedCloseSummaryPrefix} ${formatKrw(parsed.summary.settlementKrw.remittanceDeltaKrw, runtimeLocale)}`
          : copy.statusLoadedCloseSummaryBlocked
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : copy.statusInvalidInput);
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        {source === "admin-dashboard" ? (
          <p className="small muted">
            {copy.dashboardSourceBanner} · {copy.dashboardSourceFocusLabel}: {focusLabel}
          </p>
        ) : null}
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.inputTitle}</h2>
          {showDevTools ? (
            <p className="small muted">
              {copy.sessionOrganizationLabel}: <code>{organizationId || "-"}</code> /{" "}
              {copy.sessionActorLabel}: <code>{adminActorId || "-"}</code>
            </p>
          ) : null}
          <div className="input-grid">
            <label>
              {copy.periodStartLabel}
              <input type="date" value={periodStartDate} onChange={(event) => setPeriodStartDate(event.target.value)} />
            </label>
            <label>
              {copy.periodEndLabel}
              <input type="date" value={periodEndDate} onChange={(event) => setPeriodEndDate(event.target.value)} />
            </label>
            <label>
              {copy.priorPaidWithholdingLabel}
              <input value={priorPaidWithholdingTaxKrw} onChange={(event) => setPriorPaidWithholdingTaxKrw(event.target.value)} />
            </label>
            <label>
              {copy.priorPaidSocialInsuranceLabel}
              <input value={priorPaidSocialInsuranceKrw} onChange={(event) => setPriorPaidSocialInsuranceKrw(event.target.value)} />
            </label>
            <label>
              {copy.priorPaidNetPayoutLabel}
              <input value={priorPaidNetPayKrw} onChange={(event) => setPriorPaidNetPayKrw(event.target.value)} />
            </label>
          </div>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void runClosePeriod(false)} disabled={pendingLabel !== null}>
              {copy.previewAction}
            </button>
            <button className="btn btn-primary" onClick={() => void runClosePeriod(true)} disabled={pendingLabel !== null}>
              {copy.applyAction}
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? (
            <p className="small fail">
              {copy.sessionErrorPrefix}: {supabaseSessionError}
            </p>
          ) : null}
        </article>

        <article className="panel">
          <h2>{copy.runStatesTitle}</h2>
          {!result ? (
            <p className="small">{copy.noCloseSummaryYet}</p>
          ) : (
            <ul className="simple-list">
              <li><span>{copy.canCloseLabel}</span><strong>{result.summary.canClose ? copy.yes : copy.no}</strong></li>
              <li><span>{copy.totalConfirmedPreviewedLabel}</span><strong>{result.summary.runStates.totalRuns} / {result.summary.runStates.confirmedRuns} / {result.summary.runStates.previewedRuns}</strong></li>
              <li><span>{copy.blockingRunIdsLabel}</span><strong>{result.summary.runStates.blockingRunIds.join(", ") || "-"}</strong></li>
              <li><span>{copy.blockingReasonsLabel}</span><strong>{result.summary.runStates.blockingReasons.join(" | ") || "-"}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.totalsDeltaTitle}</h2>
          {!result ? (
            <p className="small">{copy.noTotalsYet}</p>
          ) : (
            <ul className="simple-list">
              <li><span>{copy.grossNetLabel}</span><strong>{formatKrw(result.summary.totalsKrw.grossPayKrw, runtimeLocale)} / {formatKrw(result.summary.totalsKrw.netPayKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.withholdingSocialInsuranceLabel}</span><strong>{formatKrw(result.summary.totalsKrw.withholdingTaxKrw, runtimeLocale)} / {formatKrw(result.summary.totalsKrw.socialInsuranceKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.deductionsOtherLabel}</span><strong>{formatKrw(result.summary.totalsKrw.totalDeductionsKrw, runtimeLocale)} / {formatKrw(result.summary.totalsKrw.otherDeductionsKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.withholdingDeltaLabel}</span><strong>{formatKrw(result.summary.settlementKrw.withholdingTaxDeltaKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.socialInsuranceDeltaLabel}</span><strong>{formatKrw(result.summary.settlementKrw.socialInsuranceDeltaKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.netPayDeltaLabel}</span><strong>{formatKrw(result.summary.settlementKrw.netPayDeltaKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.remittanceDeltaLabel}</span><strong>{formatKrw(result.summary.settlementKrw.remittanceDeltaKrw, runtimeLocale)}</strong></li>
            </ul>
          )}
        </article>

        {showDevTools ? (
          <article className="panel">
            <h2>{copy.apiLogsTitle}</h2>
            <p className="small">
              {copy.apiLogsTotalLabel} {stats.total} / {copy.apiLogsSuccessLabel} {stats.success} / {copy.apiLogsFailLabel} {stats.fail}
              {pendingLabel ? ` / ${copy.apiLogsRunningLabel} ${pendingLabel}` : ""}
            </p>
            {logs.length === 0 ? (
              <p className="small">{copy.noApiCallYet}</p>
            ) : (
              <ul className="log-list">
                {logs.map((log) => (
                  <li key={log.id}>
                    <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.okLabel : copy.failLabel}</span> {log.label} / {log.status}
                    <time>{log.at}</time>
                  </li>
                ))}
              </ul>
            )}
            <div className="panel-actions">
              <Link href="/admin" className="btn btn-secondary">{copy.backToAdmin}</Link>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
