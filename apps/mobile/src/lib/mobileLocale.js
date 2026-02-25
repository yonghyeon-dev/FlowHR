export function resolveMobileLocale() {
  const runtimeLocale =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().locale ?? "" : "";
  const normalized = String(runtimeLocale).trim().toLowerCase();
  return normalized.startsWith("ko") ? "ko" : "en";
}
