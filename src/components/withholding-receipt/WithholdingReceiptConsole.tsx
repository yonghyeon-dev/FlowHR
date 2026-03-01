"use client";
import { useMemo, useState } from "react";
import {
  formatDateTimeByLocale,
  normalizeWithholdingDocumentFileName,
  normalizeRuntimeDiagnosticMessage,
  resolveWithholdingBlockingReasons,
  withholdingReceiptCopyByLocale
} from "@/components/withholding-receipt/copy-runtime";
import { WithholdingReceiptInputPanel } from "@/components/withholding-receipt/WithholdingReceiptInputPanel";
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
import { useWithholdingReceiptRequests } from "@/components/withholding-receipt/useWithholdingReceiptRequests";
import { currentYear } from "@/components/withholding-receipt/types";
import { isDevToolsEnabled } from "@/app/employee/page-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import {
  getLocalizedEmployeeIdInputDefault,
  normalizeEmployeeIdForApi,
  normalizeEmployeeIdForLocaleInput
} from "@/lib/i18n/employee-id-locale";
import { useI18n } from "@/lib/i18n/provider";
export default function WithholdingReceiptConsole() {
  const { locale } = useI18n();
  const copy = withholdingReceiptCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const localeEmployeeIdDefault = getLocalizedEmployeeIdInputDefault(locale);
  const formatKrwByLocale = (value: number) =>
    `${value.toLocaleString(runtimeLocale)}${locale === "ko" ? "\uC6D0" : " KRW"}`;
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const showDevTools = isDevToolsEnabled();
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const employeeId =
    normalizeEmployeeIdForLocaleInput(
      (supabaseSession?.actorId ?? supabaseSession?.userId ?? localeEmployeeIdDefault).trim() ||
        localeEmployeeIdDefault,
      locale
    ) || localeEmployeeIdDefault;
  const [year, setYear] = useState(String(currentYear()));
  const [documentFormat, setDocumentFormat] = useState<"json" | "text">("json");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [receipt, setReceipt] = useState<WithholdingReceiptResponse | null>(null);
  const [receiptDocument, setReceiptDocument] = useState<WithholdingReceiptDocumentResponse | null>(null);
  const [finalizedSettlement, setFinalizedSettlement] =
    useState<FinalizedYearEndSettlementResponse | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
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
    return normalizeRuntimeDiagnosticMessage(
      supabaseSessionError,
      locale,
      "\uC778\uC99D \uC138\uC158 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."
    );
  }, [locale, supabaseSessionError]);
  const normalizedEmployeeIdForApi = useMemo(() => {
    const normalized = normalizeEmployeeIdForApi(employeeId, locale);
    if (normalized) {
      return normalized;
    }
    return normalizeEmployeeIdForApi(localeEmployeeIdDefault, locale);
  }, [employeeId, locale, localeEmployeeIdDefault]);

  const { previewReceipt, loadIssuedDocument, loadFinalizedSettlement } = useWithholdingReceiptRequests({
    copy,
    locale,
    runtimeLocale,
    year,
    organizationId,
    documentFormat,
    usesBearerToken,
    bearerToken,
    normalizedEmployeeIdForApi,
    setPendingLabel,
    setStatusMessage,
    setLogs,
    setReceipt,
    setReceiptDocument,
    setFinalizedSettlement
  });

  function downloadDocument(
    document: WithholdingReceiptDocumentResponse["document"],
    downloadFileName: string
  ) {
    const blob = new Blob([document.content], { type: document.contentType });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = downloadFileName;
    window.document.body.appendChild(anchor);
    anchor.click();
    window.document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }
  async function copyDocumentMetadata(document: WithholdingReceiptDocumentResponse["document"]) {
    const metadataText = [
      `${copy.metadataReceiptNumberLabel}: ${document.receiptNumber}`,
      `${copy.metadataFormatLabel}: ${resolveDocumentFormatLabel(document.format)}`,
      `${copy.metadataContentTypeLabel}: ${resolveContentTypeLabel(document.contentType)}`,
      `${copy.metadataIssuedAtLabel}: ${formatDateTimeByLocale(document.issuedAt, runtimeLocale)}`,
      `${copy.metadataGeneratedAtLabel}: ${formatDateTimeByLocale(document.generatedAt, runtimeLocale)}`,
      `${copy.metadataContentSha256Label}: ${document.contentSha256}`
    ].join("\n");
    try {
      await navigator.clipboard.writeText(metadataText);
      setStatusMessage(copy.copiedDocumentMetadataStatus);
    } catch {
      setStatusMessage(copy.requestFailedCheckLogsStatus);
    }
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
      return "\uAD6C\uC870 \uB370\uC774\uD130";
    }
    if (lowered === "text/plain") {
      return "\uD14D\uC2A4\uD2B8 \uB370\uC774\uD130";
    }
    return copy.unknownContentTypeLabel;
  };
  const blockingReasonText = receipt
    ? resolveWithholdingBlockingReasons(receipt.receipt.blockingReasons, locale).join(" | ") || "-"
    : "-";
  const validationBlockedCount = receipt?.receipt.blockingReasons.length ?? 0;
  const validationMissingGuardCount = receipt
    ? [receipt.receipt.runStates.previewedRuns, receipt.receipt.runStates.undistributedRuns, receipt.receipt.runStates.pendingReceiptRuns].filter((count) => count > 0).length
    : 0;
  const validationNeedsAction = validationBlockedCount > 0 || validationMissingGuardCount > 0;
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
  const normalizedDocumentFileName = receiptDocument
    ? normalizeWithholdingDocumentFileName(
        receiptDocument.document.fileName,
        receiptDocument.document.receiptNumber,
        receiptDocument.document.format,
        locale
      )
    : "-";
  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>
      <section className="panel-grid">
        <WithholdingReceiptInputPanel
          copy={copy}
          showDevTools={showDevTools}
          year={year}
          documentFormat={documentFormat}
          sessionOrganizationId={organizationId}
          sessionEmployeeId={employeeId}
          pendingLabel={pendingLabel}
          statusMessage={statusMessage}
          normalizedSupabaseSessionError={normalizedSupabaseSessionError}
          onYearChange={setYear}
          onDocumentFormatChange={setDocumentFormat}
          onPreviewReceipt={() => void previewReceipt()}
          onLoadFinalizedSettlement={() => void loadFinalizedSettlement()}
          onLoadIssuedDocument={() => void loadIssuedDocument()}
        />
        <WithholdingSummaryPanel
          title={copy.receiptSummaryTitle}
          copy={copy}
          receipt={receipt}
          finalizedSettlement={finalizedSettlement}
          receiptDocument={receiptDocument}
          validationBlockedCount={validationBlockedCount}
          validationMissingGuardCount={validationMissingGuardCount}
          validationNeedsAction={validationNeedsAction}
          blockingReasonText={blockingReasonText}
          runGuardSnapshot={runGuardSnapshot}
          finalizedAtText={finalizedAtText}
          documentFormatTypeText={documentFormatTypeText}
          issuedAtText={issuedAtText}
          generatedAtText={generatedAtText}
          documentFileNameText={normalizedDocumentFileName}
          hideDocumentRawPreview={locale === "ko"}
          formatKrwByLocale={formatKrwByLocale}
          onDownloadDocument={(document) => downloadDocument(document, normalizedDocumentFileName)}
          onCopyDocumentMetadata={(document) => void copyDocumentMetadata(document)}
        />
        {showDevTools ? (
          <WithholdingLogsPanel
            locale={locale}
            title={copy.apiLogsTitle}
            copy={copy}
            logs={logs}
            stats={stats}
            pendingLabel={pendingLabel}
          />
        ) : null}
      </section>
    </main>
  );
}
