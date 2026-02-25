import type { FlowLocale } from "@/lib/i18n/locales";

let contractsLocaleOverride: FlowLocale | null = null;

export function setContractsRuntimeLocale(locale: FlowLocale | null) {
  contractsLocaleOverride = locale;
}

function isKoRuntimeLocale() {
  if (contractsLocaleOverride) {
    return contractsLocaleOverride === "ko";
  }
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang?.trim().toLowerCase();
    if (htmlLang.startsWith("ko")) {
      return true;
    }
    if (htmlLang.startsWith("en")) {
      return false;
    }
  }
  if (typeof navigator !== "undefined") {
    const runtimeLanguage = navigator.language?.trim().toLowerCase() ?? "";
    if (runtimeLanguage.startsWith("ko")) {
      return true;
    }
  }
  return false;
}

function resolveContractsHttpFallbackMessage(status: number) {
  return isKoRuntimeLocale()
    ? `요청이 실패했습니다 (${status})`
    : `request failed (${status})`;
}

function shouldSuppressRawEnglishMessage(message: string, koRuntime: boolean) {
  if (!koRuntime) {
    return false;
  }
  const normalized = message.trim();
  if (normalized.length === 0) {
    return false;
  }
  if (/[\uac00-\ud7a3]/.test(normalized)) {
    return false;
  }
  return /[A-Za-z]/.test(normalized);
}

const koContractsErrorMessagePatterns: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /signature\s*input.*required/i,
    message: "서명 입력값은 필수입니다."
  },
  {
    pattern: /employee\s*id.*required|employeeid.*required/i,
    message: "직원 번호는 필수입니다."
  },
  {
    pattern: /organization\s*id.*required|organizationid.*required/i,
    message: "조직 식별자는 필수입니다."
  },
  {
    pattern: /document.*not\s*found|contract.*not\s*found/i,
    message: "계약 문서를 찾을 수 없습니다."
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

function resolveKnownKoContractsErrorMessage(value: string) {
  for (const candidate of koContractsErrorMessagePatterns) {
    if (candidate.pattern.test(value)) {
      return candidate.message;
    }
  }
  return null;
}

function extractErrorText(body: unknown) {
  if (typeof body === "string" && body.trim().length > 0) {
    return body;
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }
  const errorKeys = ["error", "message", "reason", "detail"];
  for (const key of errorKeys) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

export function normalizeContractsErrorMessageForRuntime(message: string, fallbackMessage: string) {
  const koRuntime = isKoRuntimeLocale();
  const normalized = message.trim();
  if (normalized.length === 0) {
    return fallbackMessage;
  }
  if (koRuntime) {
    if (/[\uac00-\ud7a3]/.test(normalized)) {
      return normalized;
    }
    const knownKoMessage = resolveKnownKoContractsErrorMessage(normalized);
    if (knownKoMessage) {
      return knownKoMessage;
    }
  }
  return shouldSuppressRawEnglishMessage(normalized, koRuntime) ? fallbackMessage : normalized;
}

export async function readJson(response: Response, fallbackMessage?: string) {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const resolvedFallbackMessage = fallbackMessage ?? resolveContractsHttpFallbackMessage(response.status);
    const rawMessage = extractErrorText(body) ?? resolvedFallbackMessage;
    const message = normalizeContractsErrorMessageForRuntime(rawMessage, resolvedFallbackMessage);
    throw new Error(message);
  }

  return body;
}
