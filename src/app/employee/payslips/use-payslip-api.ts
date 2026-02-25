import { useCallback, useState } from "react";

import type { PayslipPageCopy } from "@/app/employee/payslips/page-locale-helpers";
import {
  buildQuery,
  toIso,
  type ApiLog,
  type AttendanceAggregateDto,
  type PayrollRunDto
} from "@/app/employee/payslips/page-helpers";

type UsePayslipApiParams = {
  pageCopy: PayslipPageCopy;
  runtimeLocale: string;
  usesBearerToken: boolean;
  bearerToken: string;
  employeeId: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  setRuns: (runs: PayrollRunDto[]) => void;
  setAggregate: (aggregate: AttendanceAggregateDto | null) => void;
};

type UsePayslipApiResult = {
  logs: ApiLog[];
  pendingLabel: string | null;
  clearLogs: () => void;
  appendClientLog: (label: string, ok: boolean, status: number, body: unknown) => void;
  refreshPayslips: () => Promise<void>;
};

type ApiCallMethod = "GET" | "POST";

function buildApiLogEntry(label: string, runtimeLocale: string, status: number, ok: boolean, body: unknown): ApiLog {
  return {
    id: Date.now(),
    label,
    status,
    ok,
    at: new Date().toLocaleString(runtimeLocale),
    body
  };
}

export function usePayslipApi({
  pageCopy,
  runtimeLocale,
  usesBearerToken,
  bearerToken,
  employeeId,
  organizationId,
  periodStart,
  periodEnd,
  setRuns,
  setAggregate
}: UsePayslipApiParams): UsePayslipApiResult {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const appendClientLog = useCallback(
    (label: string, ok: boolean, status: number, body: unknown) => {
      setLogs((prev) => [buildApiLogEntry(label, runtimeLocale, status, ok, body), ...prev]);
    },
    [runtimeLocale]
  );

  const callApi = useCallback(
    async (
      label: string,
      method: ApiCallMethod,
      path: string,
      payload?: Record<string, unknown>
    ) => {
      setPendingLabel(label);
      try {
        const headers: Record<string, string> = {};
        if (payload) {
          headers["content-type"] = "application/json";
        }

        if (usesBearerToken) {
          headers.authorization = `Bearer ${bearerToken.trim()}`;
        } else {
          headers["x-actor-role"] = "employee";
          headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
          if (organizationId.trim().length > 0) {
            headers["x-actor-organization-id"] = organizationId.trim();
          }
        }

        const response = await fetch(path, {
          method,
          headers,
          body: payload ? JSON.stringify(payload) : undefined
        });

        const text = await response.text();
        let body: unknown = null;
        if (text.trim().length > 0) {
          try {
            body = JSON.parse(text);
          } catch {
            body = text;
          }
        }

        setLogs((prev) => [
          buildApiLogEntry(label, runtimeLocale, response.status, response.ok, body),
          ...prev
        ]);

        return { response, body };
      } finally {
        setPendingLabel(null);
      }
    },
    [bearerToken, employeeId, organizationId, runtimeLocale, usesBearerToken]
  );

  const refreshPayslips = useCallback(async () => {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    const targetEmployeeId = employeeId.trim() || "EMP-1001";

    const [runsRes, aggregateRes] = await Promise.all([
      callApi(
        pageCopy.logs.fetchPayslips,
        "GET",
        `/api/payroll/runs${buildQuery({
          from,
          to,
          employeeId: targetEmployeeId,
          state: "CONFIRMED"
        })}`
      ),
      callApi(
        pageCopy.logs.fetchAttendance,
        "GET",
        `/api/attendance/aggregates${buildQuery({ from, to, employeeId: targetEmployeeId })}`
      )
    ]);

    if (runsRes.response.ok) {
      const parsed = runsRes.body as { runs?: PayrollRunDto[] };
      setRuns(Array.isArray(parsed.runs) ? parsed.runs : []);
    }

    if (aggregateRes.response.ok) {
      const parsed = aggregateRes.body as { aggregates?: AttendanceAggregateDto[] };
      const aggregates = Array.isArray(parsed.aggregates) ? parsed.aggregates : [];
      setAggregate(aggregates[0] ?? null);
    }
  }, [callApi, employeeId, pageCopy.logs.fetchAttendance, pageCopy.logs.fetchPayslips, periodEnd, periodStart, setAggregate, setRuns]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    pendingLabel,
    clearLogs,
    appendClientLog,
    refreshPayslips
  };
}
