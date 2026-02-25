let runtimeLocaleOverride: string | null = null;

export function setPayslipRuntimeLocale(value: string | null) {
  const normalized = value?.trim();
  runtimeLocaleOverride = normalized && normalized.length > 0 ? normalized : null;
}

export function resolveRuntimeLocale() {
  if (runtimeLocaleOverride) {
    return runtimeLocaleOverride;
  }
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang?.trim().toLowerCase();
    if (htmlLang.startsWith("ko")) {
      return "ko-KR";
    }
    if (htmlLang.startsWith("en")) {
      return "en-US";
    }
  }
  if (typeof navigator !== "undefined" && navigator.language.trim().length > 0) {
    return navigator.language;
  }
  return "ko-KR";
}

function isRuntimeKoLocale() {
  return resolveRuntimeLocale().toLowerCase().startsWith("ko");
}

function hasHangulText(value: string) {
  return /[\uac00-\ud7a3]/.test(value);
}

function hasLatinText(value: string) {
  return /[A-Za-z]/.test(value);
}

const koRuntimeErrorMessagePatterns: Array<{ pattern: RegExp; message: string }> = [
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

function resolveKnownKoRuntimeErrorMessage(value: string) {
  for (const candidate of koRuntimeErrorMessagePatterns) {
    if (candidate.pattern.test(value)) {
      return candidate.message;
    }
  }
  return null;
}

function normalizeLocaleErrorMessage(
  value: string,
  koLocale: boolean,
  koFallback = "요청 처리 중 오류가 발생했습니다."
) {
  const normalized = value.trim();
  if (!koLocale) {
    return normalized;
  }
  if (normalized.length === 0) {
    return koFallback;
  }
  if (hasHangulText(normalized)) {
    return normalized;
  }
  const knownKoMessage = resolveKnownKoRuntimeErrorMessage(normalized);
  if (knownKoMessage) {
    return knownKoMessage;
  }
  if (!hasLatinText(normalized)) {
    return normalized;
  }
  return koFallback;
}

export function normalizeRuntimeDiagnosticMessage(
  value: string,
  isKoLocale: boolean,
  koFallback: string
) {
  return normalizeLocaleErrorMessage(value, isKoLocale, koFallback);
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(resolveRuntimeLocale());
}

export function formatKrw(value: number | null) {
  if (value === null) {
    return "-";
  }
  const runtimeLocale = resolveRuntimeLocale();
  const unitLabel = runtimeLocale.toLowerCase().startsWith("ko") ? "원" : " KRW";
  return `${value.toLocaleString(runtimeLocale)}${unitLabel}`;
}

export function extractErrorMessage(body: unknown) {
  const koLocale = isRuntimeKoLocale();
  if (!body) {
    return koLocale ? "원인을 확인할 수 없습니다." : "Unable to identify the cause.";
  }
  if (typeof body === "string") {
    return normalizeLocaleErrorMessage(body, koLocale);
  }
  if (typeof body !== "object" || Array.isArray(body)) {
    return normalizeLocaleErrorMessage(String(body), koLocale);
  }

  const candidateKeys = ["error", "message", "reason", "detail"];
  for (const key of candidateKeys) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return normalizeLocaleErrorMessage(value, koLocale);
    }
  }
  return normalizeLocaleErrorMessage(JSON.stringify(body), koLocale);
}

export function formatDiffKrw(value: number | null) {
  if (value === null) {
    return "-";
  }
  const runtimeLocale = resolveRuntimeLocale();
  const unitLabel = runtimeLocale.toLowerCase().startsWith("ko") ? "원" : " KRW";
  const abs = Math.abs(value).toLocaleString(runtimeLocale);
  if (value > 0) {
    return `+${abs}${unitLabel}`;
  }
  if (value < 0) {
    return `-${abs}${unitLabel}`;
  }
  return `0${unitLabel}`;
}

export function formatDateOnly(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(resolveRuntimeLocale());
}

export function formatMonthLabel(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const runtimeLocale = resolveRuntimeLocale();
  if (runtimeLocale.toLowerCase().startsWith("ko")) {
    return `${parsed.getFullYear()}년 ${String(parsed.getMonth() + 1).padStart(2, "0")}월`;
  }
  return new Intl.DateTimeFormat(runtimeLocale, { year: "numeric", month: "long" }).format(parsed);
}

export function resolveCompareInsightTitle(isKoLocale: boolean) {
  return isKoLocale ? "전월 대비 설명" : "Month-over-month explanation";
}

export function resolveCompareInsightAriaLabel(isKoLocale: boolean) {
  return isKoLocale ? "전월 대비 설명 카드" : "Month-over-month explanation cards";
}

export function formatCompareWindowLabel(
  selectedLabel: string,
  compareLabel: string,
  isKoLocale: boolean
) {
  return isKoLocale ? `${selectedLabel} 대비 ${compareLabel}` : `${selectedLabel} vs ${compareLabel}`;
}
