"use client";

import { useCallback, useMemo, useState } from "react";

import { buildAdminSchedulingHeaders } from "@/components/scheduling/admin-scheduling-api";
import {
  extractErrorMessage,
  parseResponseBody,
  type ScheduleApiLog
} from "@/components/scheduling/helpers";

type AdminSchedulingApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export function useAdminSchedulingApi(input: {
  usesBearerToken: boolean;
  bearerToken: string;
  adminActorId: string;
  organizationId: string;
  runtimeLocale: string;
  isKoLocale: boolean;
  loadErrorPrefix: string;
}) {
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [logs, setLogs] = useState<ScheduleApiLog[]>([]);

  const callApi = useCallback(
    async (
      label: string,
      method: AdminSchedulingApiMethod,
      path: string,
      payload?: Record<string, unknown>
    ) => {
      setPendingLabel(label);
      try {
        const response = await fetch(path, {
          method,
          headers: buildAdminSchedulingHeaders({
            payloadIncluded: Boolean(payload),
            usesBearerToken: input.usesBearerToken,
            bearerToken: input.bearerToken,
            adminActorId: input.adminActorId,
            organizationId: input.organizationId
          }),
          body: payload ? JSON.stringify(payload) : undefined
        });
        const body = await parseResponseBody(response);
        setLogs((previous) => [
          {
            id: Date.now(),
            label,
            status: response.status,
            ok: response.ok,
            at: new Date().toLocaleString(input.runtimeLocale),
            body
          },
          ...previous
        ]);

        if (!response.ok) {
          throw new Error(`${input.loadErrorPrefix}: ${extractErrorMessage(body, input.isKoLocale)}`);
        }
        return body;
      } finally {
        setPendingLabel(null);
      }
    },
    [
      input.adminActorId,
      input.bearerToken,
      input.isKoLocale,
      input.loadErrorPrefix,
      input.organizationId,
      input.runtimeLocale,
      input.usesBearerToken
    ]
  );

  const logStats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  return {
    pendingLabel,
    logs,
    logStats,
    callApi
  };
}
