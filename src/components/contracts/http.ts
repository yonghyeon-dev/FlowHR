function isKoRuntimeLocale() {
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
  const asciiCount = (normalized.match(/[A-Za-z0-9]/g) ?? []).length;
  return asciiCount / normalized.length >= 0.6;
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
