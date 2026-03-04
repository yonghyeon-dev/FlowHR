import { useCallback, useEffect, useMemo, useState } from "react";

import type { EmployeeGuideApiLog } from "@/components/employee-guide/EmployeeGuideSections";
import {
  buildQuery,
  isTruthyFlag,
  parseArray,
  pastDaysRangeIso,
  safeParseBody
} from "@/components/employee-guide/helpers";
import {
  buildEmployeeGuideChecklist,
  employeeGuideProgressPercent
} from "@/features/employee-guide/checklist";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type AttendanceRecordLite = { id: string };
type LeaveRequestLite = { id: string };
type PayrollRunLite = { id: string; state: "PREVIEWED" | "CONFIRMED" };

type UseEmployeeGuideDataInput = {
  loadingLabel: string;
  runtimeLocale: string;
  requestLabels: {
    attendanceRecords: string;
    leaveRequests: string;
    confirmedPayslips: string;
  };
};

export function useEmployeeGuideData(input: UseEmployeeGuideDataInput) {
  const [attendanceRecordCount, setAttendanceRecordCount] = useState(0);
  const [leaveRequestCount, setLeaveRequestCount] = useState(0);
  const [confirmedPayslipCount, setConfirmedPayslipCount] = useState(0);

  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [logs, setLogs] = useState<EmployeeGuideApiLog[]>([]);

  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const productionSessionRequiredNotice =
    input.runtimeLocale === "ko-KR"
      ? "프로덕션에서는 로그인 세션이 필요합니다. /login에서 다시 로그인해 주세요."
      : "A login session is required in production. Please sign in again at /login.";
  const { snapshot: supabaseSession } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const employeeId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "EMP-1001").trim() || "EMP-1001";

  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const allowHeaderActorFallback = showDevTools || !isProductionRuntime;
  const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;

  const requestJson = useCallback(
    async (label: string, path: string) => {
      const startedAt = Date.now();
      const headers: Record<string, string> = {};
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else if (allowHeaderActorFallback) {
        headers["x-actor-role"] = "employee";
        headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, { method: "GET", headers });
      const text = await response.text();
      const body = text.trim().length > 0 ? safeParseBody(text) : null;

      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          ok: response.ok,
          status: response.status,
          at: new Date().toLocaleString(input.runtimeLocale),
          durationMs: Date.now() - startedAt
        },
        ...prev
      ]);

      if (!response.ok) {
        throw new Error(`${label} failed (${response.status})`);
      }
      return body;
    },
    [
      allowHeaderActorFallback,
      bearerToken,
      employeeId,
      input.runtimeLocale,
      organizationId,
      usesBearerToken
    ]
  );

  const loadGuide = useCallback(async () => {
    if (requiresLoginSession) {
      return;
    }
    const targetEmployeeId = employeeId.trim();
    if (!usesBearerToken && (!organizationId.trim() || !targetEmployeeId)) {
      return;
    }

    setPendingLabel(input.loadingLabel);
    try {
      const range = pastDaysRangeIso(14);
      const attendanceQuery = buildQuery({
        from: range.from,
        to: range.to,
        employeeId: targetEmployeeId || undefined
      });
      const leaveQuery = buildQuery({
        from: range.from,
        to: range.to,
        employeeId: targetEmployeeId || undefined
      });
      const payslipQuery = buildQuery({
        from: range.from,
        to: range.to,
        employeeId: targetEmployeeId || undefined,
        state: "CONFIRMED"
      });

      const [attendanceBody, leaveBody, payslipBody] = await Promise.all([
        requestJson(input.requestLabels.attendanceRecords, `/api/attendance/records${attendanceQuery}`),
        requestJson(input.requestLabels.leaveRequests, `/api/leave/requests${leaveQuery}`),
        requestJson(input.requestLabels.confirmedPayslips, `/api/payroll/runs${payslipQuery}`)
      ]);

      const attendanceRows = parseArray<AttendanceRecordLite>(attendanceBody, "records");
      const leaveRows = parseArray<LeaveRequestLite>(leaveBody, "requests");
      const payslipRows = parseArray<PayrollRunLite>(payslipBody, "runs");

      setAttendanceRecordCount(attendanceRows.length);
      setLeaveRequestCount(leaveRows.length);
      setConfirmedPayslipCount(payslipRows.filter((row) => row.state === "CONFIRMED").length);
    } finally {
      setPendingLabel(null);
    }
  }, [
    employeeId,
    input.loadingLabel,
    input.requestLabels.attendanceRecords,
    input.requestLabels.confirmedPayslips,
    input.requestLabels.leaveRequests,
    organizationId,
    requiresLoginSession,
    requestJson,
    usesBearerToken
  ]);

  useEffect(() => {
    void loadGuide();
  }, [loadGuide]);

  const checklistItems = useMemo(
    () =>
      buildEmployeeGuideChecklist({
        profileReady: usesBearerToken || (allowHeaderActorFallback && organizationId.trim().length > 0 && employeeId.trim().length > 0),
        attendanceRecordCount,
        leaveRequestCount,
        confirmedPayslipCount
      }),
    [
      attendanceRecordCount,
      confirmedPayslipCount,
      employeeId,
      allowHeaderActorFallback,
      leaveRequestCount,
      organizationId,
      usesBearerToken
    ]
  );
  const progressPercent = useMemo(
    () => employeeGuideProgressPercent(checklistItems),
    [checklistItems]
  );

  const refreshDisabled =
    Boolean(pendingLabel) || requiresLoginSession || (!usesBearerToken && (!organizationId.trim() || !employeeId.trim()));

  return {
    attendanceRecordCount,
    checklistItems,
    confirmedPayslipCount,
    employeeId,
    isProductionRuntime,
    requiresLoginSession,
    leaveRequestCount,
    loadGuide,
    logs,
    organizationId,
    pendingLabel,
    progressPercent,
    productionSessionRequiredNotice,
    refreshDisabled,
    showDevTools,
    usesBearerToken
  };
}
