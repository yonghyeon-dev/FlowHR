"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { payrollYearEndPreflightCopyByLocale } from "@/components/payroll-year-end/copy";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import type {
  ApiLog,
  PayrollYearEndPreflightChecklistResponse
} from "@/components/payroll-year-end/types";
import { currentYear, formatKrw } from "@/components/payroll-year-end/types";

function parseRequiredInt(value: string, fieldName: string, nonNegativeIntegerLabel: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} ${nonNegativeIntegerLabel}`);
  }
  return parsed;
}

export default function PayrollYearEndPreflightConsole() {
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [employeeId, setEmployeeId] = useState("EMP-1001");
  const [year, setYear] = useState(String(currentYear()));
  const [nonTaxableAnnualIncomeKrw, setNonTaxableAnnualIncomeKrw] = useState("0");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [checklist, setChecklist] = useState<PayrollYearEndPreflightChecklistResponse | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = payrollYearEndPreflightCopyByLocale[locale];
  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  function buildHeaders() {
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
    return headers;
  }

  async function runLoadChecklist() {
    try {
      setPendingLabel(copy.pendingPreflightChecklist);
      const requestYear = parseRequiredInt(year, copy.yearLabel, copy.statusNonNegativeInteger);
      const requestEmployeeId = employeeId.trim();
      const requestNonTaxableAnnualIncomeKrw = parseRequiredInt(
        nonTaxableAnnualIncomeKrw,
        copy.nonTaxableAnnualIncomeLabel,
        copy.statusNonNegativeInteger
      );
      const query = new URLSearchParams({
        year: String(requestYear),
        employeeId: requestEmployeeId,
        nonTaxableAnnualIncomeKrw: String(requestNonTaxableAnnualIncomeKrw)
      });
      const response = await fetch(
        `/api/payroll/year-end/preflight-checklist?${query.toString()}`,
        {
          method: "GET",
          headers: buildHeaders()
        }
      );
      const body = (await response.json()) as PayrollYearEndPreflightChecklistResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: copy.logPreflightChecklist,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage(copy.statusRequestFailed);
        return;
      }
      setChecklist(body);
      setStatusMessage(
        body.checklist.summary.readyToFinalize
          ? copy.statusLoadedChecklistReady
          : copy.statusLoadedChecklistNotReady
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
      </header>
      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.inputTitle}</h2>
          <div className="input-grid">
            <label>{copy.yearLabel}<input value={year} onChange={(event) => setYear(event.target.value)} /></label>
            <label>{copy.employeeIdLabel}<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} /></label>
            <label>{copy.nonTaxableAnnualIncomeLabel}<input value={nonTaxableAnnualIncomeKrw} onChange={(event) => setNonTaxableAnnualIncomeKrw(event.target.value)} /></label>
          </div>
          <label>{copy.accessTokenLabel}<input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder={copy.bearerTokenPlaceholder} /></label>
          <label>{copy.actorIdFallbackLabel}<input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} /></label>
          <label>{copy.organizationIdFallbackLabel}<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void runLoadChecklist()} disabled={pendingLabel !== null}>{copy.loadPreflightChecklistAction}</button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">{copy.sessionErrorPrefix}: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.checklistSummaryTitle}</h2>
          {!checklist ? <p className="small">{copy.noChecklistLoadedYet}</p> : (
            <ul className="simple-list">
              <li><span>{copy.readyToFinalizeLabel}</span><strong>{checklist.checklist.summary.readyToFinalize ? copy.yesLabel : copy.noLabel}</strong></li>
              <li><span>{copy.passFailWarnLabel}</span><strong>{checklist.checklist.summary.passCount} / {checklist.checklist.summary.failCount} / {checklist.checklist.summary.warnCount}</strong></li>
              <li><span>{copy.annualGrossPayLabel}</span><strong>{formatKrw(checklist.checklist.metrics.annualGrossPayKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.nonTaxableAnnualIncomeLabel}</span><strong>{formatKrw(checklist.checklist.metrics.nonTaxableAnnualIncomeKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.runStatesLabel}</span><strong>{copy.totalLabel} {checklist.checklist.metrics.totalRuns} / {copy.confirmedLabel} {checklist.checklist.metrics.confirmedRuns} / {copy.previewedLabel} {checklist.checklist.metrics.previewedRuns}</strong></li>
              <li><span>{copy.distributionStatesLabel}</span><strong>{copy.undistributedLabel} {checklist.checklist.metrics.undistributedRuns} / {copy.pendingReceiptLabel} {checklist.checklist.metrics.pendingReceiptRuns}</strong></li>
              <li><span>{copy.submissionStatesLabel}</span><strong>{copy.pendingLabel} {checklist.checklist.metrics.pendingSubmissionCount} / {copy.rejectedLabel} {checklist.checklist.metrics.rejectedSubmissionCount}</strong></li>
              <li><span>{copy.settlementHashLabel}</span><strong>{checklist.checklist.metrics.settlementHash ?? "-"}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.checksTitle}</h2>
          {!checklist ? <p className="small">{copy.noCheckEntriesYet}</p> : (
            <ul className="log-list">
              {checklist.checklist.checks.map((check) => (
                <li key={check.key}>
                  <span
                    className={
                      check.status === "pass"
                        ? "ok"
                        : check.status === "fail"
                          ? "fail"
                          : "small"
                    }
                  >
                    {check.status === "pass"
                      ? copy.passLabel
                      : check.status === "fail"
                        ? copy.failLabel
                        : copy.warnLabel}
                  </span>{" "}
                  {check.label} / {check.detail}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.apiLogsTitle}</h2>
          <p className="small">{copy.apiLogsTotalLabel} {stats.total} / {copy.apiLogsSuccessLabel} {stats.success} / {copy.apiLogsFailLabel} {stats.fail}{pendingLabel ? ` / ${copy.apiLogsRunningLabel} ${pendingLabel}` : ""}</p>
          {logs.length === 0 ? <p className="small">{copy.noApiCallYet}</p> : (
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
            <Link href="/admin/payroll-year-end" className="btn btn-secondary">{copy.backToYearEndAction}</Link>
            <Link href="/admin" className="btn btn-secondary">{copy.backToAdminAction}</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
