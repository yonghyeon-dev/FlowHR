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
import { useStickyStringState } from "@/lib/client/useStickyState";

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
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");

  const [attendanceRecordCount, setAttendanceRecordCount] = useState(0);
  const [leaveRequestCount, setLeaveRequestCount] = useState(0);
  const [confirmedPayslipCount, setConfirmedPayslipCount] = useState(0);

  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [logs, setLogs] = useState<EmployeeGuideApiLog[]>([]);

  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId?.trim() ?? "";
    if (!organizationId.trim() && orgId.length > 0) {
      setOrganizationId(orgId);
    }
    const actorId = supabaseSession?.actorId?.trim() ?? "";
    if (!employeeId.trim() && actorId.length > 0) {
      setEmployeeId(actorId);
    }
  }, [
    employeeId,
    isProductionRuntime,
    organizationId,
    setEmployeeId,
    setOrganizationId,
    supabaseSession?.actorId,
    supabaseSession?.organizationId
  ]);

  const requestJson = useCallback(
    async (label: string, path: string) => {
      const startedAt = Date.now();
      const headers: Record<string, string> = {};
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
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
    [bearerToken, employeeId, input.runtimeLocale, organizationId, usesBearerToken]
  );

  const loadGuide = useCallback(async () => {
    const targetEmployeeId = employeeId.trim() || supabaseSession?.actorId?.trim() || "";
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
    requestJson,
    supabaseSession?.actorId,
    usesBearerToken
  ]);

  useEffect(() => {
    void loadGuide();
  }, [loadGuide]);

  const checklistItems = useMemo(
    () =>
      buildEmployeeGuideChecklist({
        profileReady:
          usesBearerToken || (organizationId.trim().length > 0 && employeeId.trim().length > 0),
        attendanceRecordCount,
        leaveRequestCount,
        confirmedPayslipCount
      }),
    [
      attendanceRecordCount,
      confirmedPayslipCount,
      employeeId,
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
    Boolean(pendingLabel) ||
    (!usesBearerToken && (!organizationId.trim() || !employeeId.trim()) && !showDevTools);

  return {
    accessToken,
    attendanceRecordCount,
    checklistItems,
    confirmedPayslipCount,
    employeeId,
    isProductionRuntime,
    leaveRequestCount,
    loadGuide,
    logs,
    organizationId,
    pendingLabel,
    progressPercent,
    refreshDisabled,
    setAccessToken,
    setEmployeeId,
    setOrganizationId,
    usesBearerToken
  };
}
