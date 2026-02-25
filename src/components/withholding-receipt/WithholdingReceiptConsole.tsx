"use client";
import { useMemo, useState } from "react";
import {
  formatDateTimeByLocale,
  normalizeRuntimeDiagnosticMessage,
  parseRequiredInt,
  resolveWithholdingBlockingReasons,
  withholdingReceiptCopyByLocale
} from "@/components/withholding-receipt/copy-runtime";
import {
  WithholdingLogsPanel,
  WithholdingSummaryPanel
} from "@/components/withholding-receipt/WithholdingReceiptPanels";
import type {
  ApiLog,
  FinalizedYearEndSettlementResponse,
  WithholdingReceiptDocumentResponse,
  WithholdingReceiptResponse
} from "@/components/withholding-receipt/types";
import { currentYear } from "@/components/withholding-receipt/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
export default function WithholdingReceiptConsole() {
  const { locale } = useI18n();
  const copy = withholdingReceiptCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const formatKrwByLocale = (value: number) =>
    `${value.toLocaleString(runtimeLocale)}${locale === "ko" ? "원" : " KRW"}`;
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");
  const [accessToken, setAccessToken] = useState("");
  const [year, setYear] = useState(String(currentYear()));
  const [documentFormat, setDocumentFormat] = useState<"json" | "text">("json");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [receipt, setReceipt] = useState<WithholdingReceiptResponse | null>(null);
  const [receiptDocument, setReceiptDocument] = useState<WithholdingReceiptDocumentResponse | null>(null);
  const [finalizedSettlement, setFinalizedSettlement] =
    useState<FinalizedYearEndSettlementResponse | null>(null);
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
    return normalizeRuntimeDiagnosticMessage(
      supabaseSessionError,
      locale,
      "인증 세션 상태를 확인하지 못했습니다."
    );
  }, [locale, supabaseSessionError]);
  function buildHeaders() {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
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
  function isErrorPayload(value: unknown): value is { error: string } {
    return typeof value === "object" && value !== null && "error" in value;
  }
  async function runRequest<T>({
    label,
    pending,
    url,
    method,
    body
  }: {
    label: string;
    pending: string;
    url: string;
    method: "GET" | "POST";
    body?: Record<string, unknown>;
  }) {
    try {
      setPendingLabel(pending);
      const response = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined
      });
      const payload = (await response.json()) as T | { error: string };
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
      if (!response.ok || isErrorPayload(payload)) {
        setStatusMessage(copy.requestFailedCheckLogsStatus);
        return null;
      }
      return payload as T;
    } catch {
      setStatusMessage(copy.invalidInputStatus);
      return null;
    } finally {
      setPendingLabel(null);
    }
  }
  async function previewReceipt() {
    const body = await runRequest<WithholdingReceiptResponse>({
      label: copy.logPreviewReceipt,
      pending: copy.pendingReceiptPreview,
      url: "/api/payroll/year-end/withholding-receipts",
      method: "POST",
      body: {
        year: parseRequiredInt(year, copy.yearLabel, locale),
        employeeId: employeeId.trim(),
        issue: false
      }
    });
    if (!body) {
      return;
    }
    setReceipt(body);
    setStatusMessage(`${copy.loadedReceiptPrefix} ${body.receipt.receiptNumber}`);
    setTimeout(() => setStatusMessage(""), 3000);
  }
  function downloadDocument(document: WithholdingReceiptDocumentResponse["document"]) {
    const blob = new Blob([document.content], { type: document.contentType });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = document.fileName;
    window.document.body.appendChild(anchor);
    anchor.click();
    window.document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }
  async function loadIssuedDocument() {
    const query = new URLSearchParams({
      year: String(parseRequiredInt(year, copy.yearLabel, locale)),
      employeeId: employeeId.trim(),
      format: documentFormat
    });
    const body = await runRequest<WithholdingReceiptDocumentResponse>({
      label: copy.logLoadDocument,
      pending: copy.pendingReceiptDocument,
      url: `/api/payroll/year-end/withholding-receipts?${query.toString()}`,
      method: "GET"
    });
    if (!body) {
      return;
    }
    setReceiptDocument(body);
    setStatusMessage(`${copy.loadedDocumentPrefix} ${body.document.fileName}`);
    setTimeout(() => setStatusMessage(""), 3000);
  }
  async function loadFinalizedSettlement() {
    const query = new URLSearchParams({
      year: String(parseRequiredInt(year, copy.yearLabel, locale)),
      employeeId: employeeId.trim()
    });
    const body = await runRequest<FinalizedYearEndSettlementResponse>({
      label: copy.logLoadFinalizedSettlement,
      pending: copy.pendingFinalizedSettlement,
      url: `/api/payroll/year-end/finalized-settlement?${query.toString()}`,
      method: "GET"
    });
    if (!body) {
      return;
    }
    setFinalizedSettlement(body);
    setStatusMessage(`${copy.loadedFinalizedSettlementPrefix} ${body.settlement.finalizationId}`);
    setTimeout(() => setStatusMessage(""), 3000);
  }
  const runGuardSnapshot = finalizedSettlement
    ? `${copy.runGuardConfirmedLabel} ${finalizedSettlement.settlement.runStates.confirmedRuns}, ${copy.runGuardPreviewedLabel} ${finalizedSettlement.settlement.runStates.previewedRuns}, ${copy.runGuardUndistributedLabel} ${finalizedSettlement.settlement.runStates.undistributedRuns}, ${copy.runGuardPendingReceiptLabel} ${finalizedSettlement.settlement.runStates.pendingReceiptRuns}`
    : "";
  const resolveDocumentFormatLabel = (format: "json" | "text" | string) => {
    const lowered = format.trim().toLowerCase();
    if (lowered === "json") {
      return copy.formatJsonLabel;
    }
    if (lowered === "text") {
      return copy.formatTextLabel;
    }
    return copy.unknownFormatLabel;
  };
  const resolveContentTypeLabel = (contentType: string) => {
    if (locale !== "ko") {
      return contentType;
    }
    const lowered = contentType.trim().toLowerCase();
    if (lowered === "application/json") {
      return "구조 데이터";
    }
    if (lowered === "text/plain") {
      return "텍스트 데이터";
    }
    return copy.unknownContentTypeLabel;
  };
  const blockingReasonText = receipt
    ? resolveWithholdingBlockingReasons(receipt.receipt.blockingReasons, locale).join(" | ") || "-"
    : "-";
  const finalizedAtText = finalizedSettlement
    ? formatDateTimeByLocale(finalizedSettlement.settlement.finalizedAt, runtimeLocale)
    : "-";
  const documentFormatTypeText = receiptDocument
    ? `${resolveDocumentFormatLabel(receiptDocument.document.format)} / ${resolveContentTypeLabel(receiptDocument.document.contentType)}`
    : "-";
  const issuedAtText = receiptDocument
    ? formatDateTimeByLocale(receiptDocument.document.issuedAt, runtimeLocale)
    : "-";
  const generatedAtText = receiptDocument
    ? formatDateTimeByLocale(receiptDocument.document.generatedAt, runtimeLocale)
    : "-";
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
            <label>
              {copy.documentFormatLabel}
              <select
                value={documentFormat}
                onChange={(event) => setDocumentFormat(event.target.value === "text" ? "text" : "json")}
              >
                <option value="json">{copy.formatJsonLabel}</option>
                <option value="text">{copy.formatTextLabel}</option>
              </select>
            </label>
          </div>
          <label>{copy.accessTokenLabel}<input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder={copy.bearerTokenPlaceholder} /></label>
          <label>{copy.organizationIdFallbackLabel}<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void previewReceipt()} disabled={pendingLabel !== null}>{copy.actionPreviewReceipt}</button>
            <button className="btn btn-secondary" onClick={() => void loadFinalizedSettlement()} disabled={pendingLabel !== null}>{copy.actionLoadFinalizedSettlement}</button>
            <button className="btn btn-secondary" onClick={() => void loadIssuedDocument()} disabled={pendingLabel !== null}>{copy.actionLoadIssuedDocument}</button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {normalizedSupabaseSessionError ? (
            <p className="small fail">
              {copy.sessionErrorPrefix}: {normalizedSupabaseSessionError}
            </p>
          ) : null}
        </article>
        <WithholdingSummaryPanel
          title={copy.receiptSummaryTitle}
          copy={copy}
          receipt={receipt}
          finalizedSettlement={finalizedSettlement}
          receiptDocument={receiptDocument}
          blockingReasonText={blockingReasonText}
          runGuardSnapshot={runGuardSnapshot}
          finalizedAtText={finalizedAtText}
          documentFormatTypeText={documentFormatTypeText}
          issuedAtText={issuedAtText}
          generatedAtText={generatedAtText}
          formatKrwByLocale={formatKrwByLocale}
          onDownloadDocument={downloadDocument}
        />
        <WithholdingLogsPanel
          title={copy.apiLogsTitle}
          copy={copy}
          logs={logs}
          stats={stats}
          pendingLabel={pendingLabel}
        />
      </section>
    </main>
  );
}
