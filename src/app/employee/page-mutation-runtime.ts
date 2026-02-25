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
  usesBearerToken: boolean;
  bearerToken: string;
  organizationId: string;
  runtimeLocale: string;
  setLogs: Dispatch<SetStateAction<ApiLog[]>>;
  setPendingLabel: Dispatch<SetStateAction<string | null>>;
};

export function buildEmployeeMutationRuntime(input: BuildEmployeeMutationRuntimeInput) {
  const {
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
    setPendingLabel(label);
    try {
      const { response, body, log } = await performEmployeeApiCall({
        label,
        method,
        path,
        payload,
        usesBearerToken,
        bearerToken,
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
