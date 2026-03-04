import type { ApiLog } from "@/app/admin/page-types";
import { apiClientFetch, parseApiResponseBody } from "@/lib/api-client";

type AdminApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type PerformAdminApiCallInput = {
  label: string;
  method: AdminApiMethod;
  path: string;
  payload?: Record<string, unknown>;
  runtimeLocale: string;
  omitOrganizationHeader?: boolean;
};

type PerformAdminApiCallResult = {
  response: Response;
  body: unknown;
  log: ApiLog;
};

export async function performAdminApiCall(
  input: PerformAdminApiCallInput
): Promise<PerformAdminApiCallResult> {
  const startedAt = Date.now();
  void input.omitOrganizationHeader;
  try {
    const response = await apiClientFetch({
      method: input.method,
      path: input.path,
      payload: input.payload
    });
    const body = await parseApiResponseBody(response);
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
  } catch (error) {
    const body = {
      error: error instanceof Error ? error.message : String(error)
    };
    const response = new Response(JSON.stringify(body), {
      status: 401,
      headers: {
        "content-type": "application/json"
      }
    });
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
}
