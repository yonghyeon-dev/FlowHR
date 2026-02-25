import { type FlowLocale } from "@/lib/i18n/locales";

export const defaultEmployeeIdForApi = "EMP-1001";
const koreanEmployeeIdPrefix = "직원-";

const englishEmployeeIdPattern = /^emp-(\d+)$/i;
const koreanEmployeeIdPattern = /^직원-(\d+)$/u;

function normalizeEnglishEmployeeId(value: string) {
  const match = englishEmployeeIdPattern.exec(value);
  if (!match) {
    return value;
  }
  return `EMP-${match[1]}`;
}

export function getLocalizedEmployeeIdInputDefault(locale: FlowLocale) {
  return locale === "ko" ? `${koreanEmployeeIdPrefix}1001` : defaultEmployeeIdForApi;
}

export function normalizeEmployeeIdForApi(value: string, locale: FlowLocale) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const normalizedEnglish = normalizeEnglishEmployeeId(trimmed);
  const koreanMatch = koreanEmployeeIdPattern.exec(trimmed);
  if (koreanMatch) {
    return `EMP-${koreanMatch[1]}`;
  }

  if (locale === "ko") {
    return normalizedEnglish;
  }

  return normalizedEnglish;
}

export function normalizeEmployeeIdForLocaleInput(value: string, locale: FlowLocale) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const englishMatch = englishEmployeeIdPattern.exec(trimmed);
  const koreanMatch = koreanEmployeeIdPattern.exec(trimmed);

  if (locale === "ko") {
    if (englishMatch) {
      return `${koreanEmployeeIdPrefix}${englishMatch[1]}`;
    }
    return trimmed;
  }

  if (koreanMatch) {
    return `EMP-${koreanMatch[1]}`;
  }
  if (englishMatch) {
    return `EMP-${englishMatch[1]}`;
  }
  return trimmed;
}
