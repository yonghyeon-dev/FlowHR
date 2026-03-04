import type { Dispatch, SetStateAction } from "react";

import { performEmployeeApiCall } from "@/app/employee/page-api-helpers";
import { buildQuery, coerceNumber, toIso } from "@/app/employee/page-helpers";
import { buildEmployeeMutationActions } from "@/app/employee/page-mutation-actions";
import type { ApiLog } from "@/app/employee/page-types";

type MutationActionsInput = Omit<
  Parameters<typeof buildEmployeeMutationActions>[0],
  "callApi" | "buildQuery" | "toIso" | "coerceNumber"
>;

type BuildEmployeeMutationRuntimeInput = MutationActionsInput & {
  allowHeaderActorFallback: boolean;
  requiresLoginSession: boolean;
  requiresEmployeeIdBinding: boolean;
  productionSessionRequiredNotice: string;
  productionEmployeeIdRequiredNotice: string;
  usesBearerToken: boolean;
  bearerToken: string;
  organizationId: string;
  runtimeLocale: string;
  setLogs: Dispatch<SetStateAction<ApiLog[]>>;
  setPendingLabel: Dispatch<SetStateAction<string | null>>;
};

export function buildEmployeeMutationRuntime(input: BuildEmployeeMutationRuntimeInput) {
  const {
    allowHeaderActorFallback,
    requiresLoginSession,
    requiresEmployeeIdBinding,
    productionSessionRequiredNotice,
    productionEmployeeIdRequiredNotice,
    usesBearerToken,
    bearerToken,
    organizationId,
    runtimeLocale,
    setLogs,
    setPendingLabel,
    ...mutationInput
  } = input;

  async function callApi(
    label: string,
    method: "GET" | "POST" | "PUT" | "PATCH",
    path: string,
    payload?: Record<string, unknown>
  ) {
    if (requiresLoginSession) {
      const body = {
        error: productionSessionRequiredNotice,
        reason: "requires_login_session"
      };
      const log: ApiLog = {
        id: Date.now(),
        label,
        status: 401,
        ok: false,
        durationMs: 0,
        at: new Date().toLocaleString(runtimeLocale),
        body
      };
      setLogs((previousLogs) => [log, ...previousLogs]);
      return {
        response: new Response(JSON.stringify(body), {
          status: 401,
          headers: {
            "content-type": "application/json"
          }
        }),
        body
      };
    }

    if (requiresEmployeeIdBinding && mutationInput.employeeId.trim().length === 0) {
      const body = {
        error: productionEmployeeIdRequiredNotice,
        reason: "requires_employee_id_binding"
      };
      const log: ApiLog = {
        id: Date.now(),
        label,
        status: 400,
        ok: false,
        durationMs: 0,
        at: new Date().toLocaleString(runtimeLocale),
        body
      };
      setLogs((previousLogs) => [log, ...previousLogs]);
      return {
        response: new Response(JSON.stringify(body), {
          status: 400,
          headers: {
            "content-type": "application/json"
          }
        }),
        body
      };
    }

    setPendingLabel(label);
    try {
      const { response, body, log } = await performEmployeeApiCall({
        label,
        method,
        path,
        payload,
        usesBearerToken,
        bearerToken,
        allowHeaderActorFallback,
        employeeId: mutationInput.employeeId,
        organizationId,
        runtimeLocale
      });
      setLogs((previousLogs) => [log, ...previousLogs]);
      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  const mutationActions = buildEmployeeMutationActions({
    ...mutationInput,
    callApi,
    buildQuery,
    toIso,
    coerceNumber
  });

  const clearLogs = () => {
    setLogs([]);
  };

  return { mutationActions, clearLogs };
}
