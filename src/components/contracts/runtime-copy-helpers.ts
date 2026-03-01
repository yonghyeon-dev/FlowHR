const contractEnglishKeywordPatterns = [
  /\bcontract(?:s)?\b/i,
  /\bemployment\b/i,
  /\bamendment\b/i,
  /\baddendum\b/i,
  /\bannex\b/i,
  /\boffer\b/i,
  /\bletter\b/i,
  /\bprobation\b/i,
  /\bsalary\b/i,
  /\bcompensation\b/i,
  /\btemplate\b/i,
  /\bdraft\b/i,
  /\bpolicy\b/i,
  /\bnda\b/i,
  /\bconsent\b/i,
  /\bagreement\b/i,
  /\bsign(?:ature|ed|ing)?\b/i,
  /\brenew(?:ed|al)?\b/i
];

function hasHangulText(value: string) {
  return /[\uac00-\ud7a3]/.test(value);
}

function resolveAsciiRatio(value: string) {
  const compact = value.replace(/\s+/g, "");
  if (compact.length === 0) {
    return 0;
  }
  const asciiCount = (compact.match(/[A-Za-z0-9]/g) ?? []).length;
  return asciiCount / compact.length;
}

function shouldNormalizeAsKoFallbackTitle(value: string) {
  if (contractEnglishKeywordPatterns.some((pattern) => pattern.test(value))) {
    return true;
  }
  const asciiRatio = resolveAsciiRatio(value);
  if (!hasHangulText(value)) {
    return asciiRatio >= 0.4;
  }
  return asciiRatio >= 0.25;
}

function toKoFallbackTitle(stableId: string) {
  return `계약서 ${stableId.slice(0, 8)}`;
}

function resolveFileExtension(fileName: string) {
  const match = /\.([A-Za-z0-9]+)$/.exec(fileName.trim());
  if (!match) {
    return ".txt";
  }
  return `.${match[1].toLowerCase()}`;
}

export function normalizeContractsEntityTitle(title: string, stableId: string, isKoLocale: boolean) {
  const normalized = title.trim();
  if (!isKoLocale) {
    return normalized.length > 0 ? normalized : title;
  }
  if (normalized.length === 0) {
    return toKoFallbackTitle(stableId);
  }
  if (shouldNormalizeAsKoFallbackTitle(normalized)) {
    return toKoFallbackTitle(stableId);
  }
  return normalized;
}

export function normalizeContractsEvidenceFileName(
  fileName: string,
  stableId: string,
  isKoLocale: boolean
) {
  const normalized = fileName.trim();
  if (!isKoLocale) {
    return normalized.length > 0 ? normalized : fileName;
  }
  const extension = resolveFileExtension(normalized);
  const fallbackName = `계약-증빙-${stableId.slice(0, 8)}${extension}`;
  if (normalized.length === 0) {
    return fallbackName;
  }
  if (hasHangulText(normalized) && !shouldNormalizeAsKoFallbackTitle(normalized)) {
    return normalized;
  }
  return shouldNormalizeAsKoFallbackTitle(normalized) ? fallbackName : normalized;
}
