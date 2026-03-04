import type { ApiLog } from "@/app/employee/page-types";
import { apiClientFetch, parseApiResponseBody } from "@/lib/api-client";

type EmployeeApiMethod = "GET" | "POST" | "PUT" | "PATCH";

type PerformEmployeeApiCallInput = {
  label: string;
  method: EmployeeApiMethod;
  path: string;
  payload?: Record<string, unknown>;
  runtimeLocale: string;
};

type PerformEmployeeApiCallResult = {
  response: Response;
  body: unknown;
  log: ApiLog;
};

export async function performEmployeeApiCall(
  input: PerformEmployeeApiCallInput
): Promise<PerformEmployeeApiCallResult> {
  const startedAt = Date.now();
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
