export function resolveContractsWorkspaceMessageToneClass(message: string | null, error: string | null) {
  return error || (message && /fail|error/i.test(message))
    ? "small fail workspace-inline-status"
    : "small workspace-inline-status";
}
