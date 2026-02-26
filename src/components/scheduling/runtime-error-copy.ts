const koSchedulingErrorPatterns: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /missing or invalid actor context|unauthorized|forbidden|session.*(missing|expired|invalid|not\s*found)/i,
    message: "\uC778\uC99D \uC138\uC158\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /employeeid\s*is\s*required\s*for\s*manager\s*schedule\s*list\s*queries/i,
    message: "\uAD00\uB9AC\uC790 \uC870\uD68C\uC5D0\uC11C\uB294 \uC9C1\uC6D0 \uC2DD\uBCC4\uC790\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."
  },
  {
    pattern: /employee\s*can\s*only\s*list\s*own\s*schedules/i,
    message: "\uC9C1\uC6D0\uC740 \uBCF8\uC778 \uC77C\uC815\uB9CC \uC870\uD68C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /schedule\s*list\s*requires\s*permission|permission|not\s*allowed|insufficient/i,
    message: "\uAD8C\uD55C\uC774 \uC5C6\uC5B4 \uC77C\uC815 \uC694\uCCAD\uC744 \uCC98\uB9AC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /endat\s*must\s*be\s*after\s*startat|to\s*must\s*be\s*after\s*from|to\s*must\s*be\s*greater\s*than\s*or\s*equal\s*to\s*from|todate\s*must\s*be\s*on\s*or\s*after\s*fromdate/i,
    message: "\uAE30\uAC04 \uC2DC\uC791/\uC885\uB8CC \uC785\uB825\uAC12\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /date\s*must\s*follow\s*yyyy-mm-dd|invalid\s*date|invalid\s*datetime/i,
    message: "\uB0A0\uC9DC \uB610\uB294 \uC2DC\uAC04 \uD615\uC2DD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /overlapping\s*schedule\s*exists|generated\s*schedules\s*overlap/i,
    message: "\uC774\uBBF8 \uACB9\uCE58\uB294 \uADFC\uBB34 \uC77C\uC815\uC774 \uC874\uC7AC\uD569\uB2C8\uB2E4."
  },
  {
    pattern: /schedule\s*not\s*found/i,
    message: "\uADFC\uBB34 \uC77C\uC815\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
  },
  {
    pattern: /organizationid\s*is\s*required|employee\s*not\s*found\s*in\s*organization\s*scope|employee\s*not\s*found/i,
    message: "\uC870\uC9C1 \uB610\uB294 \uC9C1\uC6D0 \uC815\uBCF4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /timeout|timed out|gateway timeout/i,
    message: "\uC694\uCCAD \uC2DC\uAC04\uC774 \uCD08\uACFC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern:
      /request failed|failed to load|load failed|response failed|network error|failed to fetch|fetch failed|econnreset|econnrefused|enotfound|getaddrinfo/i,
    message: "\uC694\uCCAD\uC774 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
  },
  {
    pattern: /internal server error|service unavailable|bad gateway/i,
    message: "\uC11C\uBC84 \uCC98\uB9AC \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
  }
];

function resolveKnownKoSchedulingErrorMessage(value: string) {
  for (const candidate of koSchedulingErrorPatterns) {
    if (candidate.pattern.test(value)) {
      return candidate.message;
    }
  }
  return null;
}

export function normalizeSchedulingRuntimeMessage(
  message: string,
  isKoLocale: boolean,
  koFallbackMessage = "\uC694\uCCAD \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
) {
  const normalized = message.trim();
  if (normalized.length === 0) {
    return isKoLocale ? koFallbackMessage : message;
  }
  if (!isKoLocale) {
    return normalized;
  }

  const knownKoMessage = resolveKnownKoSchedulingErrorMessage(normalized);
  if (knownKoMessage) {
    return knownKoMessage;
  }

  const hasHangul = /[\uac00-\ud7a3]/.test(normalized);
  if (hasHangul && /[A-Za-z]/.test(normalized)) {
    return koFallbackMessage;
  }
  if (!hasHangul && /[A-Za-z]/.test(normalized)) {
    return koFallbackMessage;
  }
  return normalized;
}
