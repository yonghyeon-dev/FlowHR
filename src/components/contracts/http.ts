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
    pattern: /missing or invalid actor context|actor context/i,
    message: "\uC778\uC99D \uC138\uC158\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /invalid datetime|invalid date|datetime value/i,
    message: "\uB0A0\uC9DC \uB610\uB294 \uC2DC\uAC04 \uD615\uC2DD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694."
  },
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
    pattern: /organization\s*not\s*found/i,
    message: "\uC870\uC9C1 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /contract\s*template\s*not\s*found/i,
    message: "\uACC4\uC57D \uD15C\uD50C\uB9BF\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /employee\s*not\s*found/i,
    message: "\uC9C1\uC6D0 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /signed\s*contract\s*signature\s*evidence\s*not\s*found/i,
    message: "\uC11C\uBA85 \uC99D\uBE59 \uD30C\uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /document.*not\s*found|contract.*not\s*found/i,
    message: "\uACC4\uC57D \uBB38\uC11C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /approval\s*can\s*be\s*requested\s*only\s*from\s*draft\s*state/i,
    message: "\uC2B9\uC778 \uC694\uCCAD\uC740 \uCD08\uC548 \uC0C1\uD0DC\uC5D0\uC11C\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4."
  },
  {
    pattern: /approval\s*action\s*is\s*allowed\s*only\s*for\s*approval_requested\s*state/i,
    message: "\uC2B9\uC778 \uCC98\uB9AC\uB294 \uC2B9\uC778 \uC694\uCCAD \uC0C1\uD0DC\uC5D0\uC11C\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4."
  },
  {
    pattern: /approval\s*cycle\s*is\s*not\s*initialized/i,
    message: "\uC2B9\uC778 \uD750\uB984\uC774 \uCD08\uAE30\uD654\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /document\s*can\s*be\s*sent\s*only\s*from\s*draft\s*state/i,
    message: "\uBB38\uC11C \uBC1C\uC1A1\uC740 \uCD08\uC548 \uC0C1\uD0DC\uC5D0\uC11C\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4."
  },
  {
    pattern: /document\s*approval\s*must\s*be\s*completed\s*before\s*sending/i,
    message: "\uBB38\uC11C\uB97C \uBC1C\uC1A1\uD558\uB824\uBA74 \uC2B9\uC778 \uC644\uB8CC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."
  },
  {
    pattern: /employee\s*response\s*is\s*allowed\s*only\s*when\s*status\s*is\s*sent/i,
    message: "\uC9C1\uC6D0 \uC751\uB2F5\uC740 \uBC1C\uC1A1 \uC644\uB8CC \uC0C1\uD0DC\uC5D0\uC11C\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4."
  },
  {
    pattern: /expected\s*document\s*hash\s*mismatch|expecteddocumenthash\s*mismatch/i,
    message:
      "\uBB38\uC11C \uD574\uC2DC\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uCD5C\uC2E0 \uBB38\uC11C\uB85C \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /manual\s*expire\s*is\s*allowed\s*only\s*for\s*sent\s*document/i,
    message: "\uC218\uB3D9 \uB9CC\uB8CC \uCC98\uB9AC\uB294 \uBC1C\uC1A1\uB41C \uBB38\uC11C\uC5D0\uC11C\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4."
  },
  {
    pattern: /renew\s*is\s*allowed\s*only\s*for\s*signed\/rejected\/expired\s*documents/i,
    message: "\uAC31\uC2E0\uC740 \uC11C\uBA85/\uAC70\uC808/\uB9CC\uB8CC \uC0C1\uD0DC \uBB38\uC11C\uC5D0\uC11C\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4."
  },
  {
    pattern: /session.*(missing|expired|invalid|not\s*found)|unauthorized|forbidden/i,
    message: "\uC778\uC99D \uC138\uC158\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /contract\s*admin\s*permission\s*required/i,
    message: "\uACC4\uC57D \uAD00\uB9AC \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
  },
  {
    pattern: /employee\s*can\s*only\s*read\s*own\s*contract\s*documents|employee\s*can\s*only\s*respond\s*to\s*own\s*document/i,
    message: "\uBCF8\uC778 \uACC4\uC57D \uBB38\uC11C\uB9CC \uC870\uD68C\uD558\uAC70\uB098 \uC751\uB2F5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /contract\s*response\s*permission\s*denied|contract\s*signature\s*evidence\s*permission\s*denied/i,
    message: "\uACC4\uC57D \uC751\uB2F5 \uB610\uB294 \uC99D\uBE59 \uC870\uD68C \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
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
    pattern:
      /request failed|failed to load|load failed|response failed|network error|failed to fetch|fetch failed|econnreset|econnrefused|enotfound|getaddrinfo/i,
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
    const knownKoMessage = resolveKnownKoContractsErrorMessage(normalized);
    if (knownKoMessage) {
      return knownKoMessage;
    }
    const hasHangulText = /[\uac00-\ud7a3]/.test(normalized);
    if (hasHangulText) {
      // Suppress mixed ko+latin diagnostics to avoid leaking raw English snippets in ko runtime.
      return /[A-Za-z]/.test(normalized) ? fallbackMessage : normalized;
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
