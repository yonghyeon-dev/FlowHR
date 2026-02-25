"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  asRecord,
  buildCompareRows,
  buildOrgTree,
  buildQuery,
  filterEmployees,
  isTruthyFlag
} from "@/app/admin/people/page-helpers";
import { AdminPeoplePageView } from "@/app/admin/people/page-view";
import {
  type ActiveFilter,
  type ApiLog,
  type Department,
  type Employee,
  type EmployeeHistory,
  type Organization,
  type Position,
  type ProfileField,
  type UpdatedWindow
} from "@/app/admin/people/page-types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminPeoplePage() {
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [recentlyUpdatedDays, setRecentlyUpdatedDays] = useState<UpdatedWindow>("all");
  const [historyLimit, setHistoryLimit] = useState("30");

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<EmployeeHistory[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editPositionId, setEditPositionId] = useState("");
  const [editActive, setEditActive] = useState("true");

  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";

  const profileFieldLabel = useMemo<Record<ProfileField, string>>(() => {
    return {
      organizationId: isKoLocale ? "조직" : "Organization",
      departmentId: isKoLocale ? "부서" : "Department",
      positionId: isKoLocale ? "직급" : "Position",
      name: isKoLocale ? "이름" : "Name",
      email: isKoLocale ? "이메일" : "Email",
      active: isKoLocale ? "활성" : "Active"
    };
  }, [isKoLocale]);

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
    if (organizationId.trim()) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  const organizationById = useMemo(() => new Map(organizations.map((row) => [row.id, row])), [organizations]);
  const departmentById = useMemo(() => new Map(departments.map((row) => [row.id, row])), [departments]);
  const positionById = useMemo(() => new Map(positions.map((row) => [row.id, row])), [positions]);
  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId]
  );
  const compareEmployeeA = useMemo(
    () => employees.find((employee) => employee.id === compareA) ?? null,
    [compareA, employees]
  );
  const compareEmployeeB = useMemo(
    () => employees.find((employee) => employee.id === compareB) ?? null,
    [compareB, employees]
  );

  useEffect(() => {
    if (!selectedEmployee) {
      setEditDepartmentId("");
      setEditPositionId("");
      setEditActive("true");
      return;
    }
    setEditDepartmentId(selectedEmployee.departmentId ?? "");
    setEditPositionId(selectedEmployee.positionId ?? "");
    setEditActive(selectedEmployee.active ? "true" : "false");
  }, [selectedEmployee]);

  const filteredEmployees = useMemo(() => {
    return filterEmployees({
      employees,
      organizationId,
      activeFilter,
      departmentFilter,
      positionFilter,
      recentlyUpdatedDays,
      search,
      runtimeLocale
    });
  }, [activeFilter, departmentFilter, employees, organizationId, positionFilter, recentlyUpdatedDays, runtimeLocale, search]);

  const tree = useMemo(() => {
    return buildOrgTree({
      filteredEmployees,
      organizationById,
      departmentById,
      isKoLocale,
      runtimeLocale
    });
  }, [departmentById, filteredEmployees, isKoLocale, organizationById, runtimeLocale]);

  const compareRows = useMemo(() => {
    return buildCompareRows({
      compareEmployeeA,
      compareEmployeeB,
      organizationById,
      departmentById,
      positionById,
      isKoLocale,
      runtimeLocale
    });
  }, [compareEmployeeA, compareEmployeeB, departmentById, isKoLocale, organizationById, positionById, runtimeLocale]);

  const formatProfileValue = useCallback(
    (field: ProfileField, value: unknown) => {
      if (value === null || value === undefined) {
        return "-";
      }
      if (field === "active") {
        if (typeof value === "boolean") {
          return value ? (isKoLocale ? "활성" : "Active") : isKoLocale ? "비활성" : "Inactive";
        }
        return String(value);
      }
      if (field === "organizationId") {
        const key = String(value);
        return organizationById.get(key)?.name ?? key;
      }
      if (field === "departmentId") {
        const key = String(value);
        return departmentById.get(key)?.name ?? key;
      }
      if (field === "positionId") {
        const key = String(value);
        return positionById.get(key)?.name ?? key;
      }
      return String(value);
    },
    [departmentById, isKoLocale, organizationById, positionById]
  );

  const historyChanges = useCallback(
    (entry: EmployeeHistory) => {
      const payload = asRecord(entry.payload);
      if (!payload) {
        return [] as Array<{ field: ProfileField; before: string; after: string }>;
      }
      if (entry.action === "employee.created") {
        const fields: ProfileField[] = ["organizationId", "departmentId", "positionId", "name", "email", "active"];
        return fields
          .filter((field) => field in payload)
          .map((field) => ({ field, before: "-", after: formatProfileValue(field, payload[field]) }));
      }
      const before = asRecord(payload.before);
      const after = asRecord(payload.after);
      if (!before || !after) {
        return [];
      }
      const fields: ProfileField[] = ["organizationId", "departmentId", "positionId", "name", "email", "active"];
      return fields
        .filter((field) => before[field] !== after[field])
        .map((field) => ({
          field,
          before: formatProfileValue(field, before[field]),
          after: formatProfileValue(field, after[field])
        }));
    },
    [formatProfileValue]
  );

  async function callApi(label: string, method: "GET" | "PATCH", path: string, payload?: Record<string, unknown>) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (organizationId.trim()) {
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
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadOrganizations() {
    const { response, body } = await callApi(
      isKoLocale ? "조직 목록 조회" : "Load organizations",
      "GET",
      "/api/people/organizations"
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { organizations?: Organization[] };
    setOrganizations(Array.isArray(parsed.organizations) ? parsed.organizations : []);
  }

  async function loadDepartments() {
    const { response, body } = await callApi(
      isKoLocale ? "부서 목록 조회" : "Load departments",
      "GET",
      `/api/people/departments${buildQuery({ organizationId: organizationId.trim() || undefined })}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { departments?: Department[] };
    setDepartments(Array.isArray(parsed.departments) ? parsed.departments : []);
  }

  async function loadPositions() {
    const { response, body } = await callApi(
      isKoLocale ? "직급 목록 조회" : "Load positions",
      "GET",
      `/api/people/positions${buildQuery({ organizationId: organizationId.trim() || undefined })}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { positions?: Position[] };
    setPositions(Array.isArray(parsed.positions) ? parsed.positions : []);
  }

  async function loadEmployees() {
    const { response, body } = await callApi(
      isKoLocale ? "직원 목록 조회" : "Load employees",
      "GET",
      `/api/people/employees${buildQuery({ organizationId: organizationId.trim() || undefined })}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { employees?: Employee[] };
    const nextEmployees = Array.isArray(parsed.employees) ? parsed.employees : [];
    setEmployees(nextEmployees);
    if (!selectedEmployeeId && nextEmployees.length > 0) {
      setSelectedEmployeeId(nextEmployees[0]!.id);
    }
  }

  async function refreshDirectory() {
    await loadOrganizations();
    await Promise.all([loadDepartments(), loadPositions(), loadEmployees()]);
  }

  async function loadSelectedEmployeeHistory(employeeId: string) {
    if (!employeeId.trim()) {
      return;
    }
    const { response, body } = await callApi(
      isKoLocale ? "직원 인사 이력 조회" : "Load employee history",
      "GET",
      `/api/people/employees/${encodeURIComponent(employeeId)}/history${buildQuery({
        limit: historyLimit.trim() || undefined
      })}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { history?: EmployeeHistory[] };
    setHistory(Array.isArray(parsed.history) ? parsed.history : []);
  }

  async function applySelectedProfileUpdate() {
    if (!selectedEmployeeId.trim()) {
      return;
    }
    const payload = {
      departmentId: editDepartmentId.trim() || null,
      positionId: editPositionId.trim() || null,
      active: editActive === "true"
    };
    const { response } = await callApi(
      isKoLocale ? "직원 프로필 업데이트" : "Update employee profile",
      "PATCH",
      `/api/people/employees/${encodeURIComponent(selectedEmployeeId)}`,
      payload
    );
    if (!response.ok) {
      return;
    }
    await loadEmployees();
    await loadSelectedEmployeeHistory(selectedEmployeeId);
  }

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  const historyChangeSummary = useMemo(() => {
    const counters: Record<ProfileField, number> = {
      organizationId: 0,
      departmentId: 0,
      positionId: 0,
      name: 0,
      email: 0,
      active: 0
    };
    const fields: ProfileField[] = ["organizationId", "departmentId", "positionId", "name", "email", "active"];

    for (const entry of history) {
      const payload = asRecord(entry.payload);
      if (!payload) {
        continue;
      }

      if (entry.action === "employee.created") {
        for (const field of fields) {
          if (field in payload) {
            counters[field] += 1;
          }
        }
        continue;
      }

      const before = asRecord(payload.before);
      const after = asRecord(payload.after);
      if (!before || !after) {
        continue;
      }
      for (const field of fields) {
        if (before[field] !== after[field]) {
          counters[field] += 1;
        }
      }
    }

    return (Object.keys(counters) as ProfileField[])
      .filter((field) => counters[field] > 0)
      .map((field) => ({
        field,
        label: profileFieldLabel[field],
        count: counters[field]
      }))
      .sort((left, right) => right.count - left.count);
  }, [history, profileFieldLabel]);

  const selectedDepartments = selectedEmployee?.organizationId
    ? departments.filter((department) => department.organizationId === selectedEmployee.organizationId)
    : departments;
  const selectedPositions = selectedEmployee?.organizationId
    ? positions.filter((position) => position.organizationId === selectedEmployee.organizationId)
    : positions;

  function resetDirectoryFilters() {
    setSearch("");
    setActiveFilter("all");
    setDepartmentFilter("");
    setPositionFilter("");
    setRecentlyUpdatedDays("all");
  }

  return (
    <AdminPeoplePageView
      isKoLocale={isKoLocale}
      runtimeLocale={runtimeLocale}
      organizations={organizations}
      departments={departments}
      positions={positions}
      employees={employees}
      filteredEmployees={filteredEmployees}
      tree={tree}
      stats={stats}
      refreshDirectory={refreshDirectory}
      organizationId={organizationId}
      setOrganizationId={setOrganizationId}
      adminActorId={adminActorId}
      setAdminActorId={setAdminActorId}
      search={search}
      setSearch={setSearch}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      departmentFilter={departmentFilter}
      setDepartmentFilter={setDepartmentFilter}
      positionFilter={positionFilter}
      setPositionFilter={setPositionFilter}
      recentlyUpdatedDays={recentlyUpdatedDays}
      setRecentlyUpdatedDays={setRecentlyUpdatedDays}
      historyLimit={historyLimit}
      setHistoryLimit={setHistoryLimit}
      showDevTools={showDevTools}
      accessToken={accessToken}
      setAccessToken={setAccessToken}
      loadOrganizations={loadOrganizations}
      loadDepartments={loadDepartments}
      loadPositions={loadPositions}
      loadEmployees={loadEmployees}
      resetDirectoryFilters={resetDirectoryFilters}
      supabaseSessionError={supabaseSessionError}
      selectedEmployeeId={selectedEmployeeId}
      setSelectedEmployeeId={setSelectedEmployeeId}
      loadSelectedEmployeeHistory={loadSelectedEmployeeHistory}
      compareA={compareA}
      setCompareA={setCompareA}
      compareB={compareB}
      setCompareB={setCompareB}
      compareRows={compareRows}
      compareEmployeeA={compareEmployeeA}
      compareEmployeeB={compareEmployeeB}
      selectedEmployee={selectedEmployee}
      editDepartmentId={editDepartmentId}
      setEditDepartmentId={setEditDepartmentId}
      editPositionId={editPositionId}
      setEditPositionId={setEditPositionId}
      editActive={editActive}
      setEditActive={setEditActive}
      selectedDepartments={selectedDepartments}
      selectedPositions={selectedPositions}
      applySelectedProfileUpdate={applySelectedProfileUpdate}
      history={history}
      historyChangeSummary={historyChangeSummary}
      historyChanges={historyChanges}
      profileFieldLabel={profileFieldLabel}
      logs={logs}
      pendingLabel={pendingLabel}
    />
  );
}


