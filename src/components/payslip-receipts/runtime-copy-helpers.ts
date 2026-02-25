import type { FlowLocale } from "@/lib/i18n/locales";

function hasHangulText(value: string) {
  return /[\uac00-\ud7a3]/.test(value);
}

function isAsciiHeavyText(value: string) {
  const compact = value.replace(/\s+/g, "");
  if (compact.length === 0) {
    return false;
  }
  const asciiCount = (compact.match(/[A-Za-z0-9]/g) ?? []).length;
  return asciiCount / compact.length >= 0.6;
}

export function normalizePayslipReceiptRuntimeMessage(
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
  if (hasHangulText(normalized) || !isAsciiHeavyText(normalized)) {
    return normalized;
  }
  return koFallback;
}
