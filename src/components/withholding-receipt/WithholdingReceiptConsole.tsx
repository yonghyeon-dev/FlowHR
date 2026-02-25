"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import type {
  ApiLog,
  FinalizedYearEndSettlementResponse,
  WithholdingReceiptDocumentResponse,
  WithholdingReceiptResponse
} from "@/components/withholding-receipt/types";
import { currentYear } from "@/components/withholding-receipt/types";
import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";

function parseRequiredInt(value: string, fieldName: string, locale: FlowLocale) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(
      locale === "ko"
        ? `${fieldName}은(는) 0 이상의 정수여야 합니다`
        : `${fieldName} must be a non-negative integer`
    );
  }
  return parsed;
}

type WithholdingReceiptCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  inputTitle: string;
  yearLabel: string;
  employeeIdLabel: string;
  documentFormatLabel: string;
  accessTokenLabel: string;
  bearerTokenPlaceholder: string;
  organizationIdFallbackLabel: string;
  formatJsonLabel: string;
  formatTextLabel: string;
  unknownFormatLabel: string;
  unknownContentTypeLabel: string;
  actionPreviewReceipt: string;
  actionLoadFinalizedSettlement: string;
  actionLoadIssuedDocument: string;
  pendingReceiptPreview: string;
  pendingReceiptDocument: string;
  pendingFinalizedSettlement: string;
  logPreviewReceipt: string;
  logLoadDocument: string;
  logLoadFinalizedSettlement: string;
  requestFailedStatus: string;
  requestFailedCheckLogsStatus: string;
  invalidInputStatus: string;
  loadedReceiptPrefix: string;
  loadedDocumentPrefix: string;
  loadedFinalizedSettlementPrefix: string;
  sessionErrorPrefix: string;
  receiptSummaryTitle: string;
  noReceiptSummary: string;
  noFinalizedSettlement: string;
  noIssuedDocument: string;
  receiptNumberLabel: string;
  canIssueIssuedLabel: string;
  grossNetLabel: string;
  withholdingSocialLabel: string;
  pendingReceiptRunsLabel: string;
  blockingReasonsLabel: string;
  finalizationIdLabel: string;
  finalizedAtLabel: string;
  settlementHashLabel: string;
  taxLiabilityLabel: string;
  priorWithheldLabel: string;
  withholdingDeltaLabel: string;
  additionalDueRefundLabel: string;
  runGuardSnapshotLabel: string;
  runGuardConfirmedLabel: string;
  runGuardPreviewedLabel: string;
  runGuardUndistributedLabel: string;
  runGuardPendingReceiptLabel: string;
  documentFileLabel: string;
  formatTypeLabel: string;
  issuedAtLabel: string;
  generatedAtLabel: string;
  contentSha256Label: string;
  actionDownloadLoadedDocument: string;
  apiLogsTitle: string;
  apiLogsTotalLabel: string;
  apiLogsSuccessLabel: string;
  apiLogsFailLabel: string;
  apiLogsRunningLabel: string;
  apiLogsEmpty: string;
  okLabel: string;
  failLabel: string;
  yesLabel: string;
  noLabel: string;
  actionBackToEmployee: string;
};

const withholdingReceiptCopyByLocale: Record<FlowLocale, WithholdingReceiptCopy> = {
  ko: {
    heroEyebrow: "FlowHR 직원",
    title: "원천징수영수증",
    description: "연간 원천징수영수증 발급 가능 상태와 정산 요약을 확인합니다.",
    inputTitle: "입력",
    yearLabel: "연도",
    employeeIdLabel: "직원 번호",
    documentFormatLabel: "문서 포맷",
    accessTokenLabel: "액세스 토큰(선택)",
    bearerTokenPlaceholder: "인증 토큰",
    organizationIdFallbackLabel: "조직 식별자(개발 대체값)",
    formatJsonLabel: "구조 데이터",
    formatTextLabel: "텍스트",
    unknownFormatLabel: "알 수 없는 형식",
    unknownContentTypeLabel: "알 수 없는 타입",
    actionPreviewReceipt: "영수증 미리보기",
    actionLoadFinalizedSettlement: "확정 정산 불러오기",
    actionLoadIssuedDocument: "발급 문서 불러오기",
    pendingReceiptPreview: "원천징수영수증 미리보기",
    pendingReceiptDocument: "원천징수영수증 문서 조회",
    pendingFinalizedSettlement: "연말 확정 정산 조회",
    logPreviewReceipt: "원천징수영수증 미리보기",
    logLoadDocument: "원천징수영수증 문서 조회",
    logLoadFinalizedSettlement: "연말 확정 정산 조회",
    requestFailedStatus: "요청이 실패했습니다",
    requestFailedCheckLogsStatus: "요청이 실패했습니다. 로그를 확인하세요.",
    invalidInputStatus: "입력값이 올바르지 않습니다",
    loadedReceiptPrefix: "영수증 로드 완료",
    loadedDocumentPrefix: "문서 로드 완료",
    loadedFinalizedSettlementPrefix: "확정 정산 로드 완료",
    sessionErrorPrefix: "세션 오류",
    receiptSummaryTitle: "영수증 요약",
    noReceiptSummary: "아직 영수증 요약이 없습니다.",
    noFinalizedSettlement: "아직 확정 정산을 불러오지 않았습니다.",
    noIssuedDocument: "아직 발급 문서를 불러오지 않았습니다.",
    receiptNumberLabel: "영수증 번호",
    canIssueIssuedLabel: "발급 가능 / 발급 완료",
    grossNetLabel: "총급여 / 실수령",
    withholdingSocialLabel: "원천징수 / 사회보험",
    pendingReceiptRunsLabel: "수신확인 대기 실행",
    blockingReasonsLabel: "차단 사유",
    finalizationIdLabel: "확정 번호",
    finalizedAtLabel: "확정 시각",
    settlementHashLabel: "정산 해시",
    taxLiabilityLabel: "세부담",
    priorWithheldLabel: "기납부 원천징수",
    withholdingDeltaLabel: "원천징수 차액",
    additionalDueRefundLabel: "추가 납부 / 환급",
    runGuardSnapshotLabel: "실행 가드 스냅샷",
    runGuardConfirmedLabel: "확정",
    runGuardPreviewedLabel: "미리보기",
    runGuardUndistributedLabel: "미배포",
    runGuardPendingReceiptLabel: "수신확인 대기",
    documentFileLabel: "문서 파일",
    formatTypeLabel: "포맷 / 타입",
    issuedAtLabel: "발급 시각",
    generatedAtLabel: "생성 시각",
    contentSha256Label: "콘텐츠 해시값",
    actionDownloadLoadedDocument: "불러온 문서 다운로드",
    apiLogsTitle: "요청 로그",
    apiLogsTotalLabel: "총",
    apiLogsSuccessLabel: "성공",
    apiLogsFailLabel: "실패",
    apiLogsRunningLabel: "실행 중",
    apiLogsEmpty: "아직 요청 이력이 없습니다.",
    okLabel: "성공",
    failLabel: "실패",
    yesLabel: "예",
    noLabel: "아니오",
    actionBackToEmployee: "직원 화면으로"
  },
  en: {
    heroEyebrow: "FlowHR Employee",
    title: "Withholding Receipt",
    description: "Preview your yearly withholding receipt readiness and settlement totals.",
    inputTitle: "Input",
    yearLabel: "Year",
    employeeIdLabel: "Employee ID",
    documentFormatLabel: "Document Format",
    accessTokenLabel: "Access Token (optional)",
    bearerTokenPlaceholder: "Bearer token",
    organizationIdFallbackLabel: "Organization ID (dev fallback)",
    formatJsonLabel: "JSON",
    formatTextLabel: "Text",
    unknownFormatLabel: "Unknown format",
    unknownContentTypeLabel: "Unknown type",
    actionPreviewReceipt: "Preview Receipt",
    actionLoadFinalizedSettlement: "Load Finalized Settlement",
    actionLoadIssuedDocument: "Load Issued Document",
    pendingReceiptPreview: "withholding receipt preview",
    pendingReceiptDocument: "withholding receipt document",
    pendingFinalizedSettlement: "year-end finalized settlement",
    logPreviewReceipt: "preview withholding receipt",
    logLoadDocument: "load withholding receipt document",
    logLoadFinalizedSettlement: "load finalized year-end settlement",
    requestFailedStatus: "request failed",
    requestFailedCheckLogsStatus: "request failed; check logs",
    invalidInputStatus: "invalid input",
    loadedReceiptPrefix: "loaded receipt",
    loadedDocumentPrefix: "loaded document",
    loadedFinalizedSettlementPrefix: "loaded finalized settlement",
    sessionErrorPrefix: "Session error",
    receiptSummaryTitle: "Receipt Summary",
    noReceiptSummary: "No receipt summary yet.",
    noFinalizedSettlement: "No finalized settlement loaded.",
    noIssuedDocument: "No issued document loaded.",
    receiptNumberLabel: "Receipt Number",
    canIssueIssuedLabel: "Can Issue / Issued",
    grossNetLabel: "Gross / Net",
    withholdingSocialLabel: "Withholding / Social",
    pendingReceiptRunsLabel: "Pending Receipt Runs",
    blockingReasonsLabel: "Blocking Reasons",
    finalizationIdLabel: "Finalization ID",
    finalizedAtLabel: "Finalized At",
    settlementHashLabel: "Settlement Hash",
    taxLiabilityLabel: "Tax Liability",
    priorWithheldLabel: "Prior Withheld",
    withholdingDeltaLabel: "Withholding Delta",
    additionalDueRefundLabel: "Additional Due / Refund",
    runGuardSnapshotLabel: "Run Guard Snapshot",
    runGuardConfirmedLabel: "confirmed",
    runGuardPreviewedLabel: "previewed",
    runGuardUndistributedLabel: "undistributed",
    runGuardPendingReceiptLabel: "pending receipt",
    documentFileLabel: "Document File",
    formatTypeLabel: "Format / Type",
    issuedAtLabel: "Issued At",
    generatedAtLabel: "Generated At",
    contentSha256Label: "Content SHA256",
    actionDownloadLoadedDocument: "Download Loaded Document",
    apiLogsTitle: "API Logs",
    apiLogsTotalLabel: "total",
    apiLogsSuccessLabel: "success",
    apiLogsFailLabel: "fail",
    apiLogsRunningLabel: "running",
    apiLogsEmpty: "No API call yet.",
    okLabel: "OK",
    failLabel: "FAIL",
    yesLabel: "YES",
    noLabel: "NO",
    actionBackToEmployee: "Back to Employee"
  }
};

const withholdingBlockingReasonKoMap: Record<string, string> = {
  "no confirmed payroll runs found for selected year": "선택한 연도에 확정된 급여 실행이 없습니다.",
  "all payroll runs must be confirmed before withholding receipt issue":
    "원천징수영수증 발급 전 모든 급여 실행이 확정되어야 합니다.",
  "all confirmed runs must be distributed before withholding receipt issue":
    "원천징수영수증 발급 전 확정된 실행이 모두 배포되어야 합니다.",
  "all distributed runs must have payslip receipt confirmation before withholding receipt issue":
    "원천징수영수증 발급 전 배포된 실행의 명세서 수신 확인이 필요합니다.",
  "personalPensionKrw deduction is not eligible for selected employee/year":
    "개인연금 공제는 선택한 직원/연도에 적용 대상이 아닙니다.",
  "insurancePremiumKrw deduction is not eligible for selected employee/year":
    "보험료 공제는 선택한 직원/연도에 적용 대상이 아닙니다.",
  "medicalExpenseKrw deduction is not eligible for selected employee/year":
    "의료비 공제는 선택한 직원/연도에 적용 대상이 아닙니다.",
  "educationExpenseKrw deduction is not eligible for selected employee/year":
    "교육비 공제는 선택한 직원/연도에 적용 대상이 아닙니다.",
  "donationKrw deduction is not eligible for selected employee/year":
    "기부금 공제는 선택한 직원/연도에 적용 대상이 아닙니다.",
  "housingSavingsKrw deduction is not eligible for selected employee/year":
    "주택저축 공제는 선택한 직원/연도에 적용 대상이 아닙니다."
};

function hasHangulText(value: string) {
  return /[\uac00-\ud7a3]/.test(value);
}

function hasLatinText(value: string) {
  return /[A-Za-z]/.test(value);
}

const koRuntimeDiagnosticPatterns: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /employee\s*id.*required|employeeid.*required/i,
    message: "직원 번호는 필수입니다."
  },
  {
    pattern: /organization\s*id.*required|organizationid.*required/i,
    message: "조직 식별자는 필수입니다."
  },
  {
    pattern: /session.*(missing|expired|invalid|not\s*found)|unauthorized|forbidden/i,
    message: "인증 세션이 유효하지 않습니다. 다시 로그인해 주세요."
  },
  {
    pattern: /permission|not\s*allowed|insufficient/i,
    message: "권한이 없어 요청을 처리할 수 없습니다."
  },
  {
    pattern: /invalid input|validation/i,
    message: "입력값을 확인해 주세요."
  },
  {
    pattern: /request failed|failed to load|load failed|response failed|network error/i,
    message: "요청이 실패했습니다. 잠시 후 다시 시도해 주세요."
  }
];

function resolveKnownKoRuntimeDiagnosticMessage(value: string) {
  for (const candidate of koRuntimeDiagnosticPatterns) {
    if (candidate.pattern.test(value)) {
      return candidate.message;
    }
  }
  return null;
}

function normalizeRuntimeDiagnosticMessage(
  value: string,
  locale: FlowLocale,
  koFallback: string
) {
  const normalized = value.trim();
  if (locale !== "ko") {
    return normalized;
  }
  if (normalized.length === 0) {
    return koFallback;
  }
  if (hasHangulText(normalized)) {
    return normalized;
  }
  const knownKoMessage = resolveKnownKoRuntimeDiagnosticMessage(normalized);
  if (knownKoMessage) {
    return knownKoMessage;
  }
  if (!hasLatinText(normalized)) {
    return normalized;
  }
  return koFallback;
}

function resolveWithholdingBlockingReasonLabel(reason: string, locale: FlowLocale) {
  const normalized = reason.trim();
  if (locale !== "ko") {
    return normalized;
  }
  if (normalized.length === 0) {
    return "발급 조건을 확인할 수 없습니다.";
  }
  if (normalized in withholdingBlockingReasonKoMap) {
    return withholdingBlockingReasonKoMap[normalized];
  }
  return normalizeRuntimeDiagnosticMessage(
    normalized,
    locale,
    "발급 조건을 충족하지 않아 원천징수영수증을 발급할 수 없습니다."
  );
}

function resolveWithholdingBlockingReasons(reasons: string[], locale: FlowLocale) {
  return reasons.map((reason) => resolveWithholdingBlockingReasonLabel(reason, locale));
}

function formatDateTimeByLocale(value: string | null | undefined, runtimeLocale: string) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}

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

  async function previewReceipt() {
    try {
      setPendingLabel(copy.pendingReceiptPreview);
      const payload = {
        year: parseRequiredInt(year, copy.yearLabel, locale),
        employeeId: employeeId.trim(),
        issue: false
      };
      const response = await fetch("/api/payroll/year-end/withholding-receipts", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as WithholdingReceiptResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: copy.logPreviewReceipt,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage(copy.requestFailedCheckLogsStatus);
        return;
      }
      setReceipt(body);
      setStatusMessage(`${copy.loadedReceiptPrefix} ${body.receipt.receiptNumber}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch {
      setStatusMessage(copy.invalidInputStatus);
    } finally {
      setPendingLabel(null);
    }
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
    try {
      setPendingLabel(copy.pendingReceiptDocument);
      const query = new URLSearchParams({
        year: String(parseRequiredInt(year, copy.yearLabel, locale)),
        employeeId: employeeId.trim(),
        format: documentFormat
      });
      const response = await fetch(`/api/payroll/year-end/withholding-receipts?${query.toString()}`, {
        method: "GET",
        headers: buildHeaders()
      });
      const body = (await response.json()) as
        | WithholdingReceiptDocumentResponse
        | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: copy.logLoadDocument,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage(copy.requestFailedCheckLogsStatus);
        return;
      }
      setReceiptDocument(body);
      setStatusMessage(`${copy.loadedDocumentPrefix} ${body.document.fileName}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch {
      setStatusMessage(copy.invalidInputStatus);
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadFinalizedSettlement() {
    try {
      setPendingLabel(copy.pendingFinalizedSettlement);
      const query = new URLSearchParams({
        year: String(parseRequiredInt(year, copy.yearLabel, locale)),
        employeeId: employeeId.trim()
      });
      const response = await fetch(`/api/payroll/year-end/finalized-settlement?${query.toString()}`, {
        method: "GET",
        headers: buildHeaders()
      });
      const body = (await response.json()) as
        | FinalizedYearEndSettlementResponse
        | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: copy.logLoadFinalizedSettlement,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage(copy.requestFailedCheckLogsStatus);
        return;
      }
      setFinalizedSettlement(body);
      setStatusMessage(`${copy.loadedFinalizedSettlementPrefix} ${body.settlement.finalizationId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch {
      setStatusMessage(copy.invalidInputStatus);
    } finally {
      setPendingLabel(null);
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
        <article className="panel">
          <h2>{copy.receiptSummaryTitle}</h2>
          {!receipt ? <p className="small">{copy.noReceiptSummary}</p> : (
            <ul className="simple-list">
              <li><span>{copy.receiptNumberLabel}</span><strong>{receipt.receipt.receiptNumber}</strong></li>
              <li><span>{copy.canIssueIssuedLabel}</span><strong>{receipt.receipt.canIssue ? copy.yesLabel : copy.noLabel} / {receipt.receipt.issued ? copy.yesLabel : copy.noLabel}</strong></li>
              <li><span>{copy.grossNetLabel}</span><strong>{formatKrwByLocale(receipt.receipt.annualTotalsKrw.grossPayKrw)} / {formatKrwByLocale(receipt.receipt.annualTotalsKrw.netPayKrw)}</strong></li>
              <li><span>{copy.withholdingSocialLabel}</span><strong>{formatKrwByLocale(receipt.receipt.annualTotalsKrw.withholdingTaxKrw)} / {formatKrwByLocale(receipt.receipt.annualTotalsKrw.socialInsuranceKrw)}</strong></li>
              <li><span>{copy.pendingReceiptRunsLabel}</span><strong>{receipt.receipt.runStates.pendingReceiptRunIds.join(", ") || "-"}</strong></li>
              <li><span>{copy.blockingReasonsLabel}</span><strong>{blockingReasonText}</strong></li>
            </ul>
          )}
          {!finalizedSettlement ? <p className="small">{copy.noFinalizedSettlement}</p> : (
            <ul className="simple-list">
              <li><span>{copy.finalizationIdLabel}</span><strong>{finalizedSettlement.settlement.finalizationId}</strong></li>
              <li>
                <span>{copy.finalizedAtLabel}</span>
                <strong>{formatDateTimeByLocale(finalizedSettlement.settlement.finalizedAt, runtimeLocale)}</strong>
              </li>
              <li><span>{copy.settlementHashLabel}</span><strong>{finalizedSettlement.settlement.settlementHash.slice(0, 16)}...</strong></li>
              <li><span>{copy.taxLiabilityLabel}</span><strong>{formatKrwByLocale(finalizedSettlement.settlement.settlementKrw.annualTaxLiabilityKrw)}</strong></li>
              <li><span>{copy.priorWithheldLabel}</span><strong>{formatKrwByLocale(finalizedSettlement.settlement.settlementKrw.priorWithheldTaxKrw)}</strong></li>
              <li><span>{copy.withholdingDeltaLabel}</span><strong>{formatKrwByLocale(finalizedSettlement.settlement.settlementKrw.withholdingDeltaKrw)}</strong></li>
              <li><span>{copy.additionalDueRefundLabel}</span><strong>{formatKrwByLocale(finalizedSettlement.settlement.settlementKrw.additionalWithholdingDueKrw)} / {formatKrwByLocale(finalizedSettlement.settlement.settlementKrw.withholdingRefundKrw)}</strong></li>
              <li><span>{copy.runGuardSnapshotLabel}</span><strong>{runGuardSnapshot}</strong></li>
            </ul>
          )}
          {!receiptDocument ? <p className="small">{copy.noIssuedDocument}</p> : (
            <>
              <ul className="simple-list">
                <li><span>{copy.documentFileLabel}</span><strong>{receiptDocument.document.fileName}</strong></li>
                <li>
                  <span>{copy.formatTypeLabel}</span>
                  <strong>
                    {resolveDocumentFormatLabel(receiptDocument.document.format)} /{" "}
                    {resolveContentTypeLabel(receiptDocument.document.contentType)}
                  </strong>
                </li>
                <li>
                  <span>{copy.issuedAtLabel}</span>
                  <strong>{formatDateTimeByLocale(receiptDocument.document.issuedAt, runtimeLocale)}</strong>
                </li>
                <li>
                  <span>{copy.generatedAtLabel}</span>
                  <strong>{formatDateTimeByLocale(receiptDocument.document.generatedAt, runtimeLocale)}</strong>
                </li>
                <li><span>{copy.contentSha256Label}</span><strong>{receiptDocument.document.contentSha256.slice(0, 16)}...</strong></li>
              </ul>
              <div className="panel-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => downloadDocument(receiptDocument.document)}
                >
                  {copy.actionDownloadLoadedDocument}
                </button>
              </div>
              <pre className="small">{receiptDocument.document.content.slice(0, 1000)}</pre>
            </>
          )}
        </article>
        <article className="panel">
          <h2>{copy.apiLogsTitle}</h2>
          <p className="small">
            {copy.apiLogsTotalLabel} {stats.total} / {copy.apiLogsSuccessLabel} {stats.success} / {copy.apiLogsFailLabel} {stats.fail}
            {pendingLabel ? ` / ${copy.apiLogsRunningLabel} ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? <p className="small">{copy.apiLogsEmpty}</p> : (
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
            <Link href="/employee" className="btn btn-secondary">{copy.actionBackToEmployee}</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
