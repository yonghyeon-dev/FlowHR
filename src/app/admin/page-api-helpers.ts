import type { ApiLog } from "@/app/admin/page-types";

type AdminApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type PerformAdminApiCallInput = {
  label: string;
  method: AdminApiMethod;
  path: string;
  payload?: Record<string, unknown>;
  usesBearerToken: boolean;
  bearerToken: string;
  adminActorId: string;
  organizationId: string;
  runtimeLocale: string;
  omitOrganizationHeader?: boolean;
};

type PerformAdminApiCallResult = {
  response: Response;
  body: unknown;
  log: ApiLog;
};

function buildAdminRequestHeaders(input: PerformAdminApiCallInput): Record<string, string> {
  const headers: Record<string, string> = {};
  if (input.payload) {
    headers["content-type"] = "application/json";
  }

  if (input.usesBearerToken) {
    headers.authorization = `Bearer ${input.bearerToken.trim()}`;
    return headers;
  }

  headers["x-actor-role"] = "admin";
  headers["x-actor-id"] = input.adminActorId.trim() || "ADM-1001";
  if (!input.omitOrganizationHeader && input.organizationId.trim().length > 0) {
    headers["x-actor-organization-id"] = input.organizationId.trim();
  }
  return headers;
}

export async function performAdminApiCall(
  input: PerformAdminApiCallInput
): Promise<PerformAdminApiCallResult> {
  const startedAt = Date.now();
  const headers = buildAdminRequestHeaders(input);

  const response = await fetch(input.path, {
    method: input.method,
    headers,
    body: input.payload ? JSON.stringify(input.payload) : undefined
  });

  const raw = await response.text();
  let body: unknown = null;
  if (raw.trim().length > 0) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = raw;
    }
  }

  const durationMs = Date.now() - startedAt;
  const log: ApiLog = {
    id: Date.now(),
    label: input.label,
    status: response.status,
    ok: response.ok,
    durationMs,
    at: new Date().toLocaleString(input.runtimeLocale),
    body
  };

  return {
    response,
    body,
    log
  };
}
