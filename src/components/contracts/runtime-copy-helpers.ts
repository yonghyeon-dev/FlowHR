export function normalizeContractsEntityTitle(title: string, stableId: string, isKoLocale: boolean) {
  if (!isKoLocale) {
    return title;
  }

  const normalized = title.trim();
  if (normalized.length === 0) {
    return `계약서 ${stableId.slice(0, 8)}`;
  }
  if (/[\uac00-\ud7a3]/.test(normalized)) {
    return normalized;
  }

  const asciiCount = (normalized.match(/[A-Za-z0-9]/g) ?? []).length;
  if (asciiCount / normalized.length >= 0.6) {
    return `계약서 ${stableId.slice(0, 8)}`;
  }
  return normalized;
}
