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
    message: "\uC9C1\uC6D0 \uBC88\uD638\uB294 \uD544\uC218\uC785\uB2C8\uB2E4."
  },
  {
    pattern: /organization\s*id.*required|organizationid.*required/i,
    message: "\uC870\uC9C1 \uC2DD\uBCC4\uC790\uB294 \uD544\uC218\uC785\uB2C8\uB2E4."
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
    message:
      "\uC751\uB2F5 \uC2DC\uAC04\uC774 \uCD08\uACFC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /internal server error|service unavailable|bad gateway/i,
    message:
      "\uC11C\uBC84 \uCC98\uB9AC \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
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
