"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminAttendanceLiveContextPanel,
  AdminAttendanceLiveLogsPanel,
  AdminAttendanceLiveSummaryCards,
  AdminAttendanceLiveTablePanel,
  type AttendanceLiveApiLog,
  type AttendanceLiveDepartmentOption,
  type AttendanceLiveFilterStatus
} from "@/components/admin-attendance-live/AdminAttendanceLiveSections";
import { attendanceLiveCopyByLocale } from "@/components/admin-attendance-live/copy";
import {
  buildQuery,
  getTodayRangeLocal,
  isTruthyFlag,
  parseArray,
  toIso
} from "@/components/admin-attendance-live/helpers";
import {
  buildAttendanceLiveSnapshot,
  summarizeAttendanceLiveRows,
  type AttendanceLiveSnapshot
} from "@/features/admin-attendance-live/summary";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type EmployeeLite = { id: string; name: string | null; departmentId: string | null };
type DepartmentLite = { id: string; name: string };
type ScheduleLite = { id: string; employeeId: string; startAt: string; endAt: string };
type AttendanceRecordLite = {
  id: string;
  employeeId: string;
  checkInAt: string;
  checkOutAt: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED";
};

export function AdminAttendanceLiveDashboard() {
  const { locale } = useI18n();
  const copy = attendanceLiveCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const initialRange = useMemo(() => getTodayRangeLocal(), []);
  const [periodStart, setPeriodStart] = useState(initialRange.from);
  const [periodEnd, setPeriodEnd] = useState(initialRange.to);

  const [lateThresholdMinutes, setLateThresholdMinutes] = useState("15");
  const [criticalThresholdMinutes, setCriticalThresholdMinutes] = useState("60");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceLiveFilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [departments, setDepartments] = useState<AttendanceLiveDepartmentOption[]>([]);
  const [snapshot, setSnapshot] = useState<AttendanceLiveSnapshot | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [logs, setLogs] = useState<AttendanceLiveApiLog[]>([]);

  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession } = useSupabaseSession();
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";
  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const requestJson = useCallback(
    async (label: string, path: string) => {
      const startedAt = Date.now();
      const headers: Record<string, string> = {};
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
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
          at: new Date().toLocaleString(runtimeLocale),
          durationMs: Date.now() - startedAt
        },
        ...prev
      ]);

      if (!response.ok) {
        throw new Error(`${label} failed (${response.status})`);
      }
      return body;
    },
    [adminActorId, bearerToken, organizationId, runtimeLocale, usesBearerToken]
  );

  const loadSnapshot = useCallback(async () => {
    if (!usesBearerToken && !organizationId.trim()) {
      return;
    }

    const lateThreshold = normalizeThreshold(lateThresholdMinutes, 15);
    const criticalThreshold = Math.max(
      lateThreshold,
      normalizeThreshold(criticalThresholdMinutes, 60)
    );

    setPendingLabel(copy.loadingLabel);
    try {
      const rangeQuery = buildQuery({ from: toIso(periodStart), to: toIso(periodEnd) });
      const orgQuery = buildQuery({ organizationId: organizationId.trim() || undefined, active: "true" });
      const [employeesBody, departmentsBody, schedulesBody, attendanceBody] = await Promise.all([
        requestJson("employees", `/api/people/employees${orgQuery}`),
        requestJson("departments", `/api/people/departments${orgQuery}`),
        requestJson("schedules", `/api/scheduling/schedules${rangeQuery}`),
        requestJson("attendance records", `/api/attendance/records${rangeQuery}`)
      ]);

      const employees = parseArray<EmployeeLite>(employeesBody, "employees");
      const departmentRows = parseArray<DepartmentLite>(departmentsBody, "departments");
      const schedules = parseArray<ScheduleLite>(schedulesBody, "schedules");
      const records = parseArray<AttendanceRecordLite>(attendanceBody, "records");

      setDepartments(
        departmentRows
          .map((row) => ({ id: row.id, name: row.name }))
          .sort((left, right) => left.name.localeCompare(right.name, runtimeLocale))
      );

      setSnapshot(
        buildAttendanceLiveSnapshot({
          employees,
          departments: departmentRows,
          schedules,
          records,
          now: new Date(),
          lateThresholdMinutes: lateThreshold,
          criticalLateThresholdMinutes: criticalThreshold
        })
      );
    } finally {
      setPendingLabel(null);
    }
  }, [
    copy.loadingLabel,
    criticalThresholdMinutes,
    lateThresholdMinutes,
    organizationId,
    periodEnd,
    periodStart,
    requestJson,
    runtimeLocale,
    usesBearerToken
  ]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const filteredRows = useMemo(() => {
    const sourceRows = snapshot?.rows ?? [];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sourceRows.filter((row) => {
      if (departmentFilter && row.departmentId !== departmentFilter) {
        return false;
      }
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const haystack = `${row.employeeId} ${row.employeeName ?? ""} ${row.departmentName ?? ""}`
        .trim()
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [departmentFilter, searchQuery, snapshot?.rows, statusFilter]);

  const filteredSummary = useMemo(() => summarizeAttendanceLiveRows(filteredRows), [filteredRows]);

  const refreshDisabled = Boolean(pendingLabel) || (!usesBearerToken && !organizationId.trim());

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          {copy.productionWarning} <Link href="/login">{copy.loginCta}</Link>
        </p>
      ) : null}

      <AdminAttendanceLiveContextPanel
        copy={copy}
        sessionOrganizationId={organizationId}
        sessionActorId={adminActorId}
        periodStart={periodStart}
        periodEnd={periodEnd}
        lateThresholdMinutes={lateThresholdMinutes}
        criticalThresholdMinutes={criticalThresholdMinutes}
        departmentFilter={departmentFilter}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        departments={departments}
        pendingLabel={pendingLabel}
        refreshDisabled={refreshDisabled}
        onSetPeriodStart={setPeriodStart}
        onSetPeriodEnd={setPeriodEnd}
        onSetLateThresholdMinutes={setLateThresholdMinutes}
        onSetCriticalThresholdMinutes={setCriticalThresholdMinutes}
        onSetDepartmentFilter={setDepartmentFilter}
        onSetStatusFilter={setStatusFilter}
        onSetSearchQuery={setSearchQuery}
        onSetToday={() => {
          const today = getTodayRangeLocal();
          setPeriodStart(today.from);
          setPeriodEnd(today.to);
        }}
        onRefresh={() => {
          void loadSnapshot();
        }}
      />

      <AdminAttendanceLiveSummaryCards copy={copy} summary={filteredSummary} />

      <section className="panel-grid">
        <AdminAttendanceLiveTablePanel copy={copy} rows={filteredRows} locale={runtimeLocale} />
        {showDevTools ? <AdminAttendanceLiveLogsPanel copy={copy} logs={logs} /> : null}
      </section>
    </main>
  );
}

function normalizeThreshold(value: string, fallback: number) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function safeParseBody(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
