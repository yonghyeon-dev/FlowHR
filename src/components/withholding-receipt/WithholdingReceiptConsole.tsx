"use client";
import { useEffect, useMemo, useState } from "react";
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
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
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
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState(
    "flowhr:ctx:employeeId",
    localeEmployeeIdDefault
  );
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
      "\uC778\uC99D \uC138\uC158 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."
    );
  }, [locale, supabaseSessionError]);
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
      `receiptNumber=${document.receiptNumber}`,
      `format=${document.format}`,
      `contentType=${document.contentType}`,
      `issuedAt=${document.issuedAt}`,
      `generatedAt=${document.generatedAt}`,
      `contentSha256=${document.contentSha256}`
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
          year={year}
          employeeId={employeeId}
          documentFormat={documentFormat}
          accessToken={accessToken}
          organizationId={organizationId}
          pendingLabel={pendingLabel}
          statusMessage={statusMessage}
          normalizedSupabaseSessionError={normalizedSupabaseSessionError}
          onYearChange={setYear}
          onEmployeeIdChange={setEmployeeId}
          onEmployeeIdBlur={() => {
            if (!employeeId.trim()) {
              setEmployeeId(localeEmployeeIdDefault);
            }
          }}
          onDocumentFormatChange={setDocumentFormat}
          onAccessTokenChange={setAccessToken}
          onOrganizationIdChange={setOrganizationId}
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
