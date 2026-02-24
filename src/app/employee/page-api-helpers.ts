import type { ApiLog } from "@/app/employee/page-types";

type EmployeeApiMethod = "GET" | "POST" | "PUT" | "PATCH";

type PerformEmployeeApiCallInput = {
  label: string;
  method: EmployeeApiMethod;
  path: string;
  payload?: Record<string, unknown>;
  usesBearerToken: boolean;
  bearerToken: string;
  employeeId: string;
  organizationId: string;
  runtimeLocale: string;
};

type PerformEmployeeApiCallResult = {
  response: Response;
  body: unknown;
  log: ApiLog;
};

function buildEmployeeRequestHeaders(input: PerformEmployeeApiCallInput): Record<string, string> {
  const headers: Record<string, string> = {};
  if (input.payload) {
    headers["content-type"] = "application/json";
  }

  if (input.usesBearerToken) {
    headers.authorization = `Bearer ${input.bearerToken.trim()}`;
    return headers;
  }

  headers["x-actor-role"] = "employee";
  headers["x-actor-id"] = input.employeeId.trim() || "EMP-1001";
  if (input.organizationId.trim().length > 0) {
    headers["x-actor-organization-id"] = input.organizationId.trim();
  }
  return headers;
}

export async function performEmployeeApiCall(
  input: PerformEmployeeApiCallInput
): Promise<PerformEmployeeApiCallResult> {
  const startedAt = Date.now();
  const headers = buildEmployeeRequestHeaders(input);

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
