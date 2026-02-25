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

export async function readJson(response: Response, fallbackMessage?: string) {
  const koRuntime = isKoRuntimeLocale();
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const rawMessage =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : fallbackMessage ?? resolveContractsHttpFallbackMessage(response.status);
    const message = shouldSuppressRawEnglishMessage(rawMessage, koRuntime)
      ? fallbackMessage ?? resolveContractsHttpFallbackMessage(response.status)
      : rawMessage;
    throw new Error(message);
  }

  return body;
}
