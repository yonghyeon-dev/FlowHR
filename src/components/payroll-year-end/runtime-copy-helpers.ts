import type { FlowLocale } from "@/lib/i18n/locales";

const payrollYearEndReasonCodeKoMap: Record<string, string> = {
  NO_INPUT: "입력 없음",
  CAPPED_BY_RULE: "규정 상한 적용",
  APPLIED_AS_ENTERED: "입력값 적용"
};

const payrollYearEndReconciliationStatusKoMap: Record<string, string> = {
  matched: "일치",
  mismatch: "불일치",
  pending_finalization: "확정 대기"
};

const payrollYearEndBlockingReasonKoMap: Record<string, string> = {
  "no confirmed payroll runs found for selected year": "선택한 연도에 확정된 급여 실행이 없습니다.",
  "all payroll runs must be confirmed before withholding receipt issue":
    "원천징수영수증 발급 전 모든 급여 실행이 확정되어야 합니다.",
  "all confirmed runs must be distributed before withholding receipt issue":
    "원천징수영수증 발급 전 확정된 실행이 모두 배포되어야 합니다.",
  "all distributed runs must have payslip receipt confirmation before withholding receipt issue":
    "원천징수영수증 발급 전 배포된 실행은 모두 명세서 수신 확인이 필요합니다.",
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
    "주택저축 공제는 선택한 직원/연도에 적용 대상이 아닙니다.",
  "all payroll runs must be confirmed before period close":
    "기간 마감 전 모든 급여 실행이 확정되어야 합니다."
};

const koRuntimeMessagePatterns: Array<{ pattern: RegExp; message: string }> = [
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
    pattern:
      /request failed|failed to load|load failed|response failed|network error|failed to fetch|fetch failed|econnreset|econnrefused|enotfound|getaddrinfo/i,
    message: "요청이 실패했습니다. 잠시 후 다시 시도해 주세요."
  },
  {
    pattern: /timeout|timed out|gateway timeout/i,
    message: "응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
  },
  {
    pattern: /internal server error|service unavailable|bad gateway/i,
    message: "서버 처리 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
  }
];

function hasHangulText(value: string) {
  return /[\uac00-\ud7a3]/.test(value);
}

function hasLatinText(value: string) {
  return /[A-Za-z]/.test(value);
}

function resolveKnownKoRuntimeMessage(value: string) {
  for (const candidate of koRuntimeMessagePatterns) {
    if (candidate.pattern.test(value)) {
      return candidate.message;
    }
  }
  return null;
}

export function normalizePayrollYearEndRuntimeMessage(
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
  const knownKoMessage = resolveKnownKoRuntimeMessage(normalized);
  if (knownKoMessage) {
    return knownKoMessage;
  }
  if (hasHangulText(normalized)) {
    // Suppress mixed ko+latin diagnostics to avoid leaking raw English snippets in ko runtime.
    return hasLatinText(normalized) ? koFallback : normalized;
  }
  if (!hasLatinText(normalized)) {
    return normalized;
  }
  return koFallback;
}

export function extractPayrollYearEndErrorMessage(
  body: unknown,
  locale: FlowLocale,
  koFallback: string
) {
  if (!body) {
    return koFallback;
  }
  if (typeof body === "string") {
    return normalizePayrollYearEndRuntimeMessage(body, locale, koFallback);
  }
  if (typeof body !== "object" || Array.isArray(body)) {
    return normalizePayrollYearEndRuntimeMessage(String(body), locale, koFallback);
  }
  const candidateKeys = ["error", "message", "reason", "detail"];
  for (const key of candidateKeys) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return normalizePayrollYearEndRuntimeMessage(value, locale, koFallback);
    }
  }
  return koFallback;
}

export function resolvePayrollYearEndReasonCodeLabel(
  code: string | null | undefined,
  locale: FlowLocale
) {
  if (!code) {
    return "-";
  }
  const normalized = code.trim();
  if (normalized.length === 0) {
    return "-";
  }
  if (locale !== "ko") {
    return normalized;
  }
  return payrollYearEndReasonCodeKoMap[normalized] ?? "알 수 없는 사유";
}

export function resolvePayrollYearEndReconciliationStatusLabel(
  status: string | null | undefined,
  locale: FlowLocale
) {
  if (!status) {
    return "-";
  }
  const normalized = status.trim();
  if (normalized.length === 0) {
    return "-";
  }
  if (locale !== "ko") {
    return normalized;
  }
  return payrollYearEndReconciliationStatusKoMap[normalized] ?? "알 수 없음";
}

export function resolvePayrollYearEndBlockingReasonLabel(reason: string, locale: FlowLocale) {
  const normalized = reason.trim();
  if (locale !== "ko") {
    return normalized;
  }
  if (normalized.length === 0) {
    return "차단 사유를 확인할 수 없습니다.";
  }
  if (normalized in payrollYearEndBlockingReasonKoMap) {
    return payrollYearEndBlockingReasonKoMap[normalized];
  }
  return normalizePayrollYearEndRuntimeMessage(normalized, locale, "차단 사유를 확인해 주세요.");
}

export function resolvePayrollYearEndBlockingReasons(reasons: string[], locale: FlowLocale) {
  return reasons.map((reason) => resolvePayrollYearEndBlockingReasonLabel(reason, locale));
}
