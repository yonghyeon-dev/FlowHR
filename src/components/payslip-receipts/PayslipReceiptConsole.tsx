"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import type {
  ApiLog,
  PayrollRunReceiptDto,
  PayrollRunsResponse,
  ReceiptAcknowledgeResponse
} from "@/components/payslip-receipts/types";
import { payslipReceiptCopyByLocale } from "@/components/payslip-receipts/copy";
import { normalizePayslipReceiptRuntimeMessage } from "@/components/payslip-receipts/runtime-copy-helpers";
import {
  defaultMonthRange,
  toSeoulEndIso,
  toSeoulStartIso
} from "@/components/payslip-receipts/types";

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || value.trim() === "") {
      continue;
    }
    search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export default function PayslipReceiptConsole() {
  const { locale } = useI18n();
  const copy = payslipReceiptCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const formatKrwByLocale = (value: number | null) =>
    value === null ? "-" : `${value.toLocaleString(runtimeLocale)}${locale === "ko" ? "원" : " KRW"}`;
  const formatDateTimeByLocale = (value: string | null) =>
    value ? new Date(value).toLocaleString(runtimeLocale) : "-";

  const range = defaultMonthRange();
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");
  const [accessToken, setAccessToken] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState(range.periodStartDate);
  const [periodEndDate, setPeriodEndDate] = useState(range.periodEndDate);
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

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);
  const normalizedSupabaseSessionError = useMemo(() => {
    if (!supabaseSessionError) {
      return null;
    }
    return normalizePayslipReceiptRuntimeMessage(
      supabaseSessionError,
      locale,
      "인증 세션 상태를 확인하지 못했습니다."
    );
  }, [locale, supabaseSessionError]);

  const receiptSummary = useMemo(() => {
    const distributed = runs.filter((run) => run.payslipDistributedAt !== null).length;
    const confirmed = runs.filter((run) => run.payslipReceiptConfirmedAt !== null).length;
    const pending = runs.filter(
      (run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null
    ).length;
    return {
      total: runs.length,
      distributed,
      confirmed,
      pending
    };
  }, [runs]);

  function actorHeaders() {
    const headers: Record<string, string> = {};
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
    } else {
      headers["x-actor-role"] = "employee";
      headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
      if (organizationId.trim()) {
        headers["x-actor-organization-id"] = organizationId.trim();
      }
    }
    return headers;
  }

  async function loadRuns() {
    if (!employeeId.trim()) {
      setStatusMessage(copy.employeeIdRequiredStatus);
      return;
    }

    try {
      setPendingLabel(copy.pendingLoadPayslipList);
      const query = buildQuery({
        from: toSeoulStartIso(periodStartDate),
        to: toSeoulEndIso(periodEndDate),
        employeeId: employeeId.trim(),
        state: "CONFIRMED"
      });
      const response = await fetch(`/api/payroll/runs${query}`, {
        method: "GET",
        headers: actorHeaders()
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
          label: copy.logListReceiptEligiblePayslips,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);

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
          label: `${copy.logAcknowledgePayslipReceiptPrefix} (${runId})`,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);

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
            <label>
              {copy.employeeIdLabel}
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
            </label>
            <label>
              {copy.periodStartLabel}
              <input type="date" value={periodStartDate} onChange={(event) => setPeriodStartDate(event.target.value)} />
            </label>
            <label>
              {copy.periodEndLabel}
              <input type="date" value={periodEndDate} onChange={(event) => setPeriodEndDate(event.target.value)} />
            </label>
          </div>
          <label>
            {copy.accessTokenLabel}
            <input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder={copy.bearerTokenPlaceholder} />
          </label>
          <label>
            {copy.organizationIdFallbackLabel}
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void loadRuns()} disabled={pendingLabel !== null}>
              {copy.loadPayslipsAction}
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {normalizedSupabaseSessionError ? (
            <p className="small fail">{copy.sessionErrorPrefix}: {normalizedSupabaseSessionError}</p>
          ) : null}
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
          {runs.length === 0 ? (
            <p className="small">{copy.noConfirmedPayslipsLoaded}</p>
          ) : (
            <ul className="log-list">
              {runs.map((run) => (
                <li key={run.id}>
                  <strong>{run.id}</strong> ({formatDateTimeByLocale(run.periodStart)} ~ {formatDateTimeByLocale(run.periodEnd)})
                  <br />
                  {copy.netLabel} {formatKrwByLocale(run.netPayKrw)} / {copy.deliveredLabel}{" "}
                  {formatDateTimeByLocale(run.payslipDistributedAt)} / {copy.receiptLabel}{" "}
                  {formatDateTimeByLocale(run.payslipReceiptConfirmedAt)}
                  <div className="panel-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => void acknowledgeReceipt(run.id)}
                      disabled={pendingLabel !== null || run.payslipDistributedAt === null}
                    >
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
          <div className="panel-actions">
            <Link href="/employee" className="btn btn-secondary">{copy.backToEmployeeAction}</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
