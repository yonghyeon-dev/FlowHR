import type { FlowLocale } from "@/lib/i18n/locales";

function hasHangulText(value: string) {
  return /[\uac00-\ud7a3]/.test(value);
}

function hasLatinText(value: string) {
  return /[A-Za-z]/.test(value);
}

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
    pattern: /request failed|failed to load|load failed|response failed|network error/i,
    message: "요청이 실패했습니다. 잠시 후 다시 시도해 주세요."
  }
];

function resolveKnownKoRuntimeMessage(value: string) {
  for (const candidate of koRuntimeMessagePatterns) {
    if (candidate.pattern.test(value)) {
      return candidate.message;
    }
  }
  return null;
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
  if (hasHangulText(normalized)) {
    return normalized;
  }
  const knownKoMessage = resolveKnownKoRuntimeMessage(normalized);
  if (knownKoMessage) {
    return knownKoMessage;
  }
  if (!hasLatinText(normalized)) {
    return normalized;
  }
  return koFallback;
}
