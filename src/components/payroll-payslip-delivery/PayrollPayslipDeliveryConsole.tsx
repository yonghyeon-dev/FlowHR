"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { isTruthyFlag } from "@/app/admin/page-helpers";
import { isAdminHubSource, isAdminPayrollSource } from "@/app/admin/source-context";
import { payrollPayslipDeliveryCopyByLocale } from "@/components/payroll-payslip-delivery/copy";
import type {
  ApiLog,
  PayrollPayslipDistributionResponse
} from "@/components/payroll-payslip-delivery/types";
import {
  defaultMonthRange,
  toSeoulEndIso,
  toSeoulStartIso
} from "@/components/payroll-payslip-delivery/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatAdminSessionConnectionState,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

export type PayrollPayslipDeliveryQueueMode = "all" | "undistributed";

type PayrollPayslipDeliveryConsoleProps = {
  queueMode?: PayrollPayslipDeliveryQueueMode;
};

export default function PayrollPayslipDeliveryConsole({
  queueMode = "all"
}: PayrollPayslipDeliveryConsoleProps) {
  const searchParams = useSearchParams();
  const range = defaultMonthRange();
  const [employeeId, setEmployeeId] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState(range.periodStartDate);
  const [periodEndDate, setPeriodEndDate] = useState(range.periodEndDate);
  const [deliveryChannel, setDeliveryChannel] = useState<"in_app" | "email">("in_app");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<PayrollPayslipDistributionResponse | null>(null);
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
  const copy = payrollPayslipDeliveryCopyByLocale[locale];
  const source = searchParams.get("source");
  const focusLabel =
    queueMode === "undistributed" ? copy.focusUndistributedLabel : copy.focusAllLabel;
  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const showPayrollSource = isAdminPayrollSource(source);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);
  const distributionStatusLabel = result
    ? `${result.summary.distribution.newlyDistributedCount} ${copy.statusRunsSuffix}`
    : pendingLabel ?? copy.noDistributionSummaryYet;

  async function runDistribution(dryRun: boolean) {
    try {
      const payload = {
        periodStart: toSeoulStartIso(periodStartDate),
        periodEnd: toSeoulEndIso(periodEndDate),
        employeeId: employeeId.trim() || undefined,
        deliveryChannel,
        dryRun
      };

      setPendingLabel(dryRun ? copy.pendingDryRun : copy.pendingApply);
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

      const response = await fetch("/api/payroll/payslips/distribute", {
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
          label: dryRun ? copy.logDryRun : copy.logApply,
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

      const parsed = body as PayrollPayslipDistributionResponse;
      setResult(parsed);
      setStatusMessage(
        dryRun
          ? `${copy.statusDryRunTargetPrefix} ${parsed.summary.distribution.targetCount} ${copy.statusRunsSuffix}`
          : `${copy.statusDistributedPrefix} ${parsed.summary.distribution.newlyDistributedCount} ${copy.statusRunsSuffix}`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : copy.statusInvalidInput);
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
            {copy.payrollSourceBanner} · {copy.payrollSourceFocusLabel}: {focusLabel}
          </p>
        ) : null}
        <div className="page-actions" style={{ marginTop: 8 }}>
          {showPayrollSource ? (
            <Link href="/admin/payroll" className="btn btn-secondary btn-small">
              {copy.backToPayrollAction}
            </Link>
          ) : null}
          <Link href="/admin" className="btn btn-secondary btn-small">
            {copy.backToAdminAction}
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
          <span>{copy.deliveryChannelLabel}</span>
          <strong>
            {deliveryChannel === "in_app"
              ? copy.deliveryChannelInAppLabel
              : copy.deliveryChannelEmailLabel}
          </strong>
        </article>
        <article className="kpi">
          <span>{copy.newlyDistributedLabel}</span>
          <strong>{distributionStatusLabel}</strong>
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
              {copy.employeeIdOptionalLabel}
              <input
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                placeholder={copy.employeeIdPlaceholder}
              />
            </label>
            <label>
              {copy.deliveryChannelLabel}
              <select
                value={deliveryChannel}
                onChange={(event) =>
                  setDeliveryChannel(event.target.value as "in_app" | "email")
                }
              >
                <option value="in_app">{copy.deliveryChannelInAppLabel}</option>
                <option value="email">{copy.deliveryChannelEmailLabel}</option>
              </select>
            </label>
          </div>
          <div className="panel-actions">
            <button
              className="btn btn-secondary"
              onClick={() => void runDistribution(true)}
              disabled={pendingLabel !== null}
            >
              {copy.dryRunAction}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void runDistribution(false)}
              disabled={pendingLabel !== null}
            >
              {copy.applyDeliveryAction}
            </button>
          </div>
          {statusMessage ? <p className="small workspace-inline-status">{statusMessage}</p> : null}
          {supabaseSessionError ? (
            <p className="small fail workspace-inline-status">
              {copy.sessionErrorPrefix}: {supabaseSessionError}
            </p>
          ) : null}
        </article>

        <article className="panel workspace-section-card">
          <h2>{copy.runStatesTitle}</h2>
          {!result ? (
            <p className="small">{copy.noDistributionSummaryYet}</p>
          ) : (
            <ul className="simple-list">
              <li>
                <span>{copy.totalConfirmedPreviewedLabel}</span>
                <strong>
                  {result.summary.runStates.totalRuns} / {result.summary.runStates.confirmedRuns} /{" "}
                  {result.summary.runStates.previewedRuns}
                </strong>
              </li>
              <li>
                <span>{copy.targetCountLabel}</span>
                <strong>{result.summary.distribution.targetCount}</strong>
              </li>
              <li>
                <span>{copy.alreadyDistributedLabel}</span>
                <strong>{result.summary.distribution.alreadyDistributedCount}</strong>
              </li>
              <li>
                <span>{copy.newlyDistributedLabel}</span>
                <strong>{result.summary.distribution.newlyDistributedCount}</strong>
              </li>
            </ul>
          )}
        </article>

        <article className="panel workspace-section-card">
          <h2>{copy.runIdsTitle}</h2>
          {!result ? (
            <p className="small">{copy.noRunIdsYet}</p>
          ) : (
            <ul className="simple-list">
              <li>
                <span>{copy.targetRunsLabel}</span>
                <strong>{result.summary.distribution.targetRunIds.join(", ") || "-"}</strong>
              </li>
              <li>
                <span>{copy.alreadyDistributedRunsLabel}</span>
                <strong>{result.summary.distribution.alreadyDistributedRunIds.join(", ") || "-"}</strong>
              </li>
              <li>
                <span>{copy.newlyDistributedRunsLabel}</span>
                <strong>{result.summary.distribution.newlyDistributedRunIds.join(", ") || "-"}</strong>
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
                {showPayrollSource ? copy.backToPayrollAction : copy.backToAdminAction}
              </Link>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
