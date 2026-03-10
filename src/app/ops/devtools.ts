const TRUTHY_FLAGS = new Set(["1", "true", "yes", "on", "enabled"]);

export function isOpsDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  return TRUTHY_FLAGS.has(raw.trim().toLowerCase());
}
