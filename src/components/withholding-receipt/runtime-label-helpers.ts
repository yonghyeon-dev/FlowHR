import { type FlowLocale } from "@/lib/i18n/locales";

const withholdingActivityLabelKoMap: Record<string, string> = {
  "withholding receipt preview": "원천징수영수증 미리보기",
  "withholding receipt document": "원천징수영수증 문서 조회",
  "year-end finalized settlement": "연말 확정 정산 조회",
  "preview withholding receipt": "원천징수영수증 미리보기",
  "load withholding receipt document": "원천징수영수증 문서 조회",
  "load finalized year-end settlement": "연말 확정 정산 조회"
};

export function normalizeWithholdingActivityLabel(value: string, locale: FlowLocale) {
  const normalized = value.trim();
  if (locale !== "ko") {
    return normalized;
  }
  if (normalized.length === 0) {
    return "요청 실행";
  }
  const lowered = normalized.toLowerCase();
  return withholdingActivityLabelKoMap[lowered] ?? normalized;
}
