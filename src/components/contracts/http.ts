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
    message: "\uC11C\uBA85 \uC785\uB825\uAC12\uC740 \uD544\uC218\uC785\uB2C8\uB2E4."
  },
  {
    pattern: /employee\s*id.*required|employeeid.*required/i,
    message: "\uC9C1\uC6D0 \uBC88\uD638\uB294 \uD544\uC218\uC785\uB2C8\uB2E4."
  },
  {
    pattern: /organization\s*id.*required|organizationid.*required/i,
    message: "\uC870\uC9C1 \uC2DD\uBCC4\uC790\uB294 \uD544\uC218\uC785\uB2C8\uB2E4."
  },
  {
    pattern: /document.*not\s*found|contract.*not\s*found/i,
    message: "\uACC4\uC57D \uBB38\uC11C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
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
