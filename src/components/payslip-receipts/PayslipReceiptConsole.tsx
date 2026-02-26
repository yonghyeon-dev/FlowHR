"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { payslipReceiptCopyByLocale } from "@/components/payslip-receipts/copy";
import {
  buildPayslipReceiptQuery,
  parsePayslipReceiptResponseBody
} from "@/components/payslip-receipts/request-helpers";
import { normalizePayslipReceiptRuntimeMessage } from "@/components/payslip-receipts/runtime-copy-helpers";
import {
  defaultMonthRange,
  toSeoulEndIso,
  toSeoulStartIso,
  type ApiLog,
  type PayrollRunReceiptDto,
  type PayrollRunsResponse,
  type ReceiptAcknowledgeResponse
} from "@/components/payslip-receipts/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import {
  defaultEmployeeIdForApi,
  getLocalizedEmployeeIdInputDefault,
  normalizeEmployeeIdForApi,
  normalizeEmployeeIdForLocaleInput
} from "@/lib/i18n/employee-id-locale";
import { useI18n } from "@/lib/i18n/provider";
export default function PayslipReceiptConsole() {
  const { locale } = useI18n();
  const copy = payslipReceiptCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const range = defaultMonthRange();
  const localeEmployeeIdDefault = getLocalizedEmployeeIdInputDefault(locale);
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState(
    "flowhr:ctx:employeeId",
    localeEmployeeIdDefault
  );
  const [accessToken, setAccessToken] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState(range.periodStartDate);
  const [periodEndDate, setPeriodEndDate] = useState(range.periodEndDate);
  const [runsSearchQuery, setRunsSearchQuery] = useState("");
  const [runsStatusFilter, setRunsStatusFilter] = useState<"all" | "pending_confirmation" | "confirmed" | "undistributed">("pending_confirmation");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [runs, setRuns] = useState<PayrollRunReceiptDto[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const formatKrwByLocale = (value: number | null) =>
    value === null ? "-" : `${value.toLocaleString(runtimeLocale)}${locale === "ko" ? "\uC6D0" : " KRW"}`;
  const formatDateTimeByLocale = (value: string | null) => (value ? new Date(value).toLocaleString(runtimeLocale) : "-");
  const stats = useMemo(() => {
    const success = logs.filter((log) => log.ok).length;
    return { total: logs.length, success, fail: logs.length - success };
  }, [logs]);
  const normalizedSupabaseSessionError = useMemo(
    () =>
      supabaseSessionError
        ? normalizePayslipReceiptRuntimeMessage(
            supabaseSessionError,
            locale,
            "\uC778\uC99D \uC138\uC158 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."
          )
        : null,
    [locale, supabaseSessionError]
  );
  const normalizedEmployeeIdForApi = useMemo(
    () => normalizeEmployeeIdForApi(employeeId, locale),
    [employeeId, locale]
  );
  useEffect(() => {
    const localizedInput = normalizeEmployeeIdForLocaleInput(employeeId, locale);
    if (!localizedInput) {
      if (employeeId.trim().length === 0 && employeeId !== localeEmployeeIdDefault) {
        setEmployeeId(localeEmployeeIdDefault);
      }
      return;
    }
    if (localizedInput !== employeeId) {
      setEmployeeId(localizedInput);
    }
  }, [employeeId, locale, localeEmployeeIdDefault, setEmployeeId]);
  const receiptSummary = useMemo(() => {
    const distributed = runs.filter((run) => run.payslipDistributedAt !== null).length;
    const confirmed = runs.filter((run) => run.payslipReceiptConfirmedAt !== null).length;
    return { total: runs.length, distributed, confirmed, pending: distributed - confirmed };
  }, [runs]);
  const normalizedRunsSearchQuery = runsSearchQuery.trim().toLowerCase();
  const statusFilteredRuns = useMemo(() => {
    if (runsStatusFilter === "pending_confirmation") {
      return runs.filter(
        (run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null
      );
    }
    if (runsStatusFilter === "confirmed") {
      return runs.filter((run) => run.payslipReceiptConfirmedAt !== null);
    }
    if (runsStatusFilter === "undistributed") {
      return runs.filter((run) => run.payslipDistributedAt === null);
    }
    return runs;
  }, [runs, runsStatusFilter]);
  const filteredRuns = useMemo(() => {
    if (!normalizedRunsSearchQuery) {
      return statusFilteredRuns;
    }
    return statusFilteredRuns.filter((run) =>
      `${run.id} ${run.periodStart} ${run.periodEnd} ${run.payslipDistributedAt ?? ""} ${run.payslipReceiptConfirmedAt ?? ""}`
        .toLowerCase()
        .includes(normalizedRunsSearchQuery)
    );
  }, [normalizedRunsSearchQuery, statusFilteredRuns]);
  const pendingRunsInViewCount = useMemo(
    () =>
      filteredRuns.filter(
        (run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null
      ).length,
    [filteredRuns]
  );
  function actorHeaders() {
    const headers: Record<string, string> = {};
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
      return headers;
    }
    headers["x-actor-role"] = "employee";
    headers["x-actor-id"] = normalizedEmployeeIdForApi || defaultEmployeeIdForApi;
    if (organizationId.trim()) {
      headers["x-actor-organization-id"] = organizationId.trim();
    }
    return headers;
  }
  function appendLog(label: string, response: Response) {
    setLogs((prev) => [
      {
        id: Date.now(),
        label,
        status: response.status,
        ok: response.ok,
        at: new Date().toLocaleString(runtimeLocale)
      },
      ...prev
    ]);
  }
  async function loadRuns() {
    if (!normalizedEmployeeIdForApi) {
      setStatusMessage(copy.employeeIdRequiredStatus);
      return;
    }
    try {
      setPendingLabel(copy.pendingLoadPayslipList);
      const query = buildPayslipReceiptQuery({
        from: toSeoulStartIso(periodStartDate),
        to: toSeoulEndIso(periodEndDate),
        employeeId: normalizedEmployeeIdForApi,
        state: "CONFIRMED"
      });
      const response = await fetch(`/api/payroll/runs${query}`, { method: "GET", headers: actorHeaders() });
      const body = await parsePayslipReceiptResponseBody(response);
      appendLog(copy.logListReceiptEligiblePayslips, response);
      if (!response.ok || !body || typeof body !== "object") {
        setStatusMessage(copy.requestFailedCheckLogsStatus);
        return;
      }
      const parsed = body as PayrollRunsResponse;
      setRuns(parsed.runs ?? []);
      setStatusMessage(`${copy.loadedConfirmedPayslipsPrefix} ${parsed.runs?.length ?? 0}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } finally {
      setPendingLabel(null);
    }
  }
  async function acknowledgeReceipt(runId: string) {
    try {
      setPendingLabel(`${copy.pendingConfirmReceiptPrefix} ${runId}`);
      const response = await fetch(`/api/payroll/payslips/${runId}/acknowledge`, {
        method: "POST",
        headers: actorHeaders()
      });
      const body = await parsePayslipReceiptResponseBody(response);
      appendLog(`${copy.logAcknowledgePayslipReceiptPrefix} (${runId})`, response);
      if (!response.ok || !body || typeof body !== "object") {
        setStatusMessage(copy.requestFailedCheckLogsStatus);
        return;
      }
      const parsed = body as ReceiptAcknowledgeResponse;
      setStatusMessage(
        parsed.receipt.alreadyConfirmed
          ? `${copy.receiptAlreadyConfirmedPrefix} ${runId}`
          : `${copy.receiptConfirmedPrefix} ${runId}`
      );
      await loadRuns();
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
          <h2>{copy.filtersTitle}</h2>
          <div className="input-grid">
            <label>{copy.employeeIdLabel}<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} /></label>
            <label>{copy.periodStartLabel}<input type="date" value={periodStartDate} onChange={(event) => setPeriodStartDate(event.target.value)} /></label>
            <label>{copy.periodEndLabel}<input type="date" value={periodEndDate} onChange={(event) => setPeriodEndDate(event.target.value)} /></label>
          </div>
          <label>{copy.accessTokenLabel}<input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder={copy.bearerTokenPlaceholder} /></label>
          <label>{copy.organizationIdFallbackLabel}<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void loadRuns()} disabled={pendingLabel !== null}>{copy.loadPayslipsAction}</button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {normalizedSupabaseSessionError ? <p className="small fail">{copy.sessionErrorPrefix}: {normalizedSupabaseSessionError}</p> : null}
        </article>
        <article className="panel">
          <h2>{copy.receiptStatusTitle}</h2>
          <ul className="simple-list">
            <li><span>{copy.totalConfirmedRunsLabel}</span><strong>{receiptSummary.total}</strong></li>
            <li><span>{copy.distributedLabel}</span><strong>{receiptSummary.distributed}</strong></li>
            <li><span>{copy.receiptConfirmedLabel}</span><strong>{receiptSummary.confirmed}</strong></li>
            <li><span>{copy.pendingConfirmationLabel}</span><strong>{receiptSummary.pending}</strong></li>
          </ul>
        </article>
        <article className="panel">
          <h2>{copy.runsTitle}</h2>
          <label>{copy.runsSearchLabel}<input value={runsSearchQuery} placeholder={copy.runsSearchPlaceholder} onChange={(event) => setRunsSearchQuery(event.target.value)} /></label>
          <label>
            {copy.runsStatusFilterLabel}
            <select value={runsStatusFilter} onChange={(event) => setRunsStatusFilter(event.target.value as "all" | "pending_confirmation" | "confirmed" | "undistributed")}>
              <option value="all">{copy.runsStatusFilterAllOption}</option>
              <option value="pending_confirmation">{copy.runsStatusFilterPendingOption}</option>
              <option value="confirmed">{copy.runsStatusFilterConfirmedOption}</option>
              <option value="undistributed">{copy.runsStatusFilterUndistributedOption}</option>
            </select>
          </label>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => setRunsSearchQuery("")} disabled={pendingLabel !== null}>{copy.clearSearchAction}</button>
            <p className="small muted">{copy.visibleRunsLabel}: {filteredRuns.length} / {runs.length}</p>
            <p className="small muted">{copy.visiblePendingRunsLabel}: {pendingRunsInViewCount}</p>
          </div>
          {runs.length === 0 ? (
            <p className="small">{copy.noConfirmedPayslipsLoaded}</p>
          ) : filteredRuns.length === 0 ? (
            <p className="small muted">{copy.noFilteredRunsMessage}</p>
          ) : (
            <ul className="log-list">
              {filteredRuns.map((run) => (
                <li key={run.id}>
                  <strong>{run.id}</strong> ({formatDateTimeByLocale(run.periodStart)} ~ {formatDateTimeByLocale(run.periodEnd)})
                  <br />
                  {copy.netLabel} {formatKrwByLocale(run.netPayKrw)} / {copy.deliveredLabel} {formatDateTimeByLocale(run.payslipDistributedAt)} / {copy.receiptLabel} {formatDateTimeByLocale(run.payslipReceiptConfirmedAt)}
                  <div className="panel-actions">
                    <button className="btn btn-secondary" onClick={() => void acknowledgeReceipt(run.id)} disabled={pendingLabel !== null || run.payslipDistributedAt === null}>
                      {copy.confirmReceiptAction}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
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
          <div className="panel-actions"><Link href="/employee" className="btn btn-secondary">{copy.backToEmployeeAction}</Link></div>
        </article>
      </section>
    </main>
  );
}
