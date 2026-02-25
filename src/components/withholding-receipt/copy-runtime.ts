import { type FlowLocale } from "@/lib/i18n/locales";

export function parseRequiredInt(value: string, fieldName: string, locale: FlowLocale) {
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

export type WithholdingReceiptCopy = {
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

export const withholdingReceiptCopyByLocale: Record<FlowLocale, WithholdingReceiptCopy> = {
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
    message: "\uC9C1\uC6D0 \uBC88\uD638\uB294 \uD544\uC218\uC785\uB2C8\uB2E4."
  },
  {
    pattern: /organization\s*id.*required|organizationid.*required/i,
    message: "\uC870\uC9C1 \uC2DD\uBCC4\uC790\uB294 \uD544\uC218\uC785\uB2C8\uB2E4."
  },
  {
    pattern: /session.*(missing|expired|invalid|not\s*found)|unauthorized|forbidden/i,
    message: "\uC778\uC99D \uC138\uC158\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /permission|not\s*allowed|insufficient/i,
    message: "\uAD8C\uD55C\uC774 \uC5C6\uC5B4 \uC694\uCCAD\uC744 \uCC98\uB9AC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /invalid input|validation/i,
    message: "\uC785\uB825\uAC12\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /request failed|failed to load|load failed|response failed|network error/i,
    message: "\uC694\uCCAD\uC774 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /timeout|timed out|gateway timeout/i,
    message: "\uC751\uB2F5 \uC2DC\uAC04\uC774 \uCD08\uACFC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /internal server error|service unavailable|bad gateway/i,
    message: "\uC11C\uBC84 \uCC98\uB9AC \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
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

export function normalizeRuntimeDiagnosticMessage(
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

export function resolveWithholdingBlockingReasons(reasons: string[], locale: FlowLocale) {
  return reasons.map((reason) => resolveWithholdingBlockingReasonLabel(reason, locale));
}

export function formatDateTimeByLocale(value: string | null | undefined, runtimeLocale: string) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}
