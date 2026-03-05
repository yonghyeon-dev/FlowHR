"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  asRecord,
  buildCompareRows,
  buildOrgTree,
  filterEmployees
} from "@/app/admin/people/page-helpers";
import {
  type AdminPeopleFocusPanel,
  type AdminPeopleSourceContext,
  normalizeActiveFilter,
  normalizeAdminPeopleFocusPanel,
  normalizeAdminPeopleSourceContext,
  normalizeHistoryLimit,
  normalizeUpdatedWindow
} from "@/app/admin/people/page-deeplink-helpers";
import { useAdminPeopleDirectoryActions } from "@/app/admin/people/page-directory-actions";
import { AdminPeoplePageView } from "@/app/admin/people/page-view";
import {
  type ActiveFilter,
  type ApiLog,
  type Department,
  type Employee,
  type EmployeeHistory,
  type HistoryActionFilter,
  type HistoryFieldFilter,
  type Organization,
  type Position,
  type ProfileField,
  type UpdatedWindow
} from "@/app/admin/people/page-types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function AdminPeoplePage() {
  const searchParams = useSearchParams();
  const queryHydratedRef = useRef(false);
  const autoLoadTriggeredRef = useRef(false);
  const autoHistoryFetchKeyRef = useRef<string | null>(null);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [recentlyUpdatedDays, setRecentlyUpdatedDays] = useState<UpdatedWindow>("all");
  const [historyLimit, setHistoryLimit] = useState("30");
  const [historyActionFilter, setHistoryActionFilter] = useState<HistoryActionFilter>("all");
  const [historyFieldFilter, setHistoryFieldFilter] = useState<HistoryFieldFilter>("all");
  const [focusPanel, setFocusPanel] = useState<AdminPeopleFocusPanel | null>(null);
  const [sourceContext, setSourceContext] = useState<AdminPeopleSourceContext | null>(null);

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
  const {
    snapshot: supabaseSession,
    error: supabaseSessionError,
    loading: supabaseSessionLoading
  } = useSupabaseSession();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "").trim();

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

  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const requiresLoginSession = !supabaseSessionLoading && isProductionRuntime && !usesBearerToken;

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

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      if (historyActionFilter !== "all" && entry.action !== historyActionFilter) {
        return false;
      }
      if (historyFieldFilter === "all") {
        return true;
      }
      return historyChanges(entry).some((change) => change.field === historyFieldFilter);
    });
  }, [history, historyActionFilter, historyChanges, historyFieldFilter]);

  const {
    loadOrganizations,
    loadDepartments,
    loadPositions,
    loadEmployees,
    refreshDirectory,
    loadSelectedEmployeeHistory,
    applySelectedProfileUpdate,
    stats
  } = useAdminPeopleDirectoryActions({
    isKoLocale,
    runtimeLocale,
    organizationId,
    historyLimit,
    selectedEmployeeId,
    editDepartmentId,
    editPositionId,
    editActive,
    logs,
    setPendingLabel,
    setLogs,
    setOrganizations,
    setDepartments,
    setPositions,
    setEmployees,
    setHistory,
    setSelectedEmployeeId
  });

  const loadOrganizationsWithSessionGuard = useCallback(async () => {
    if (supabaseSessionLoading) {
      return;
    }
    await loadOrganizations();
  }, [loadOrganizations, supabaseSessionLoading]);

  const loadDepartmentsWithSessionGuard = useCallback(async () => {
    if (supabaseSessionLoading) {
      return;
    }
    await loadDepartments();
  }, [loadDepartments, supabaseSessionLoading]);

  const loadPositionsWithSessionGuard = useCallback(async () => {
    if (supabaseSessionLoading) {
      return;
    }
    await loadPositions();
  }, [loadPositions, supabaseSessionLoading]);

  const loadEmployeesWithSessionGuard = useCallback(async () => {
    if (supabaseSessionLoading) {
      return;
    }
    await loadEmployees();
  }, [loadEmployees, supabaseSessionLoading]);

  const refreshDirectoryWithSessionGuard = useCallback(async () => {
    if (supabaseSessionLoading) {
      return;
    }
    await refreshDirectory();
  }, [refreshDirectory, supabaseSessionLoading]);

  const loadSelectedEmployeeHistoryWithSessionGuard = useCallback(
    async (employeeId: string) => {
      if (supabaseSessionLoading) {
        return;
      }
      await loadSelectedEmployeeHistory(employeeId);
    },
    [loadSelectedEmployeeHistory, supabaseSessionLoading]
  );

  const applySelectedProfileUpdateWithSessionGuard = useCallback(async () => {
    if (supabaseSessionLoading) {
      return;
    }
    await applySelectedProfileUpdate();
  }, [applySelectedProfileUpdate, supabaseSessionLoading]);

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

    for (const entry of filteredHistory) {
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
  }, [filteredHistory, profileFieldLabel]);

  const selectedDepartments = selectedEmployee?.organizationId
    ? departments.filter((department) => department.organizationId === selectedEmployee.organizationId)
    : departments;
  const selectedPositions = selectedEmployee?.organizationId
    ? positions.filter((position) => position.organizationId === selectedEmployee.organizationId)
    : positions;

  useEffect(() => {
    if (queryHydratedRef.current) {
      return;
    }
    queryHydratedRef.current = true;

    const source = normalizeAdminPeopleSourceContext(searchParams.get("source"));
    if (source) {
      setSourceContext(source);
    }

    const panel = normalizeAdminPeopleFocusPanel(searchParams.get("panel"));
    if (panel) {
      setFocusPanel(panel);
      setTimeout(() => {
        document.getElementById(panel)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }

    const search = (searchParams.get("q") ?? "").trim();
    if (search) {
      setSearch(search);
    }

    const active = normalizeActiveFilter(searchParams.get("active"));
    if (active) {
      setActiveFilter(active);
    }

    const updatedWindow = normalizeUpdatedWindow(searchParams.get("updatedDays"));
    if (updatedWindow) {
      setRecentlyUpdatedDays(updatedWindow);
    }

    const limit = normalizeHistoryLimit(searchParams.get("historyLimit"));
    if (limit) {
      setHistoryLimit(limit);
    }

    const departmentId = (searchParams.get("departmentId") ?? "").trim();
    if (departmentId) {
      setDepartmentFilter(departmentId);
    }

    const positionId = (searchParams.get("positionId") ?? "").trim();
    if (positionId) {
      setPositionFilter(positionId);
    }

    const employeeId = (searchParams.get("employeeId") ?? "").trim();
    if (employeeId) {
      setSelectedEmployeeId(employeeId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (autoLoadTriggeredRef.current) {
      return;
    }
    if (supabaseSessionLoading) {
      return;
    }
    if (requiresLoginSession) {
      return;
    }
    autoLoadTriggeredRef.current = true;
    void refreshDirectoryWithSessionGuard();
  }, [refreshDirectoryWithSessionGuard, requiresLoginSession, supabaseSessionLoading]);

  useEffect(() => {
    const employeeId = selectedEmployeeId.trim();
    if (!employeeId) {
      autoHistoryFetchKeyRef.current = null;
      setHistory([]);
      return;
    }

    const historyKey = `${employeeId}:${historyLimit.trim() || "30"}`;
    if (autoHistoryFetchKeyRef.current === historyKey) {
      return;
    }
    if (supabaseSessionLoading) {
      return;
    }
    autoHistoryFetchKeyRef.current = historyKey;
    void loadSelectedEmployeeHistoryWithSessionGuard(employeeId);
  }, [historyLimit, loadSelectedEmployeeHistoryWithSessionGuard, selectedEmployeeId, supabaseSessionLoading]);

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
      refreshDirectory={refreshDirectoryWithSessionGuard}
      organizationId={organizationId}
      adminActorId={adminActorId}
      isProductionRuntime={isProductionRuntime && !supabaseSessionLoading}
      usesBearerToken={usesBearerToken}
      bearerToken={bearerToken}
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
      loadOrganizations={loadOrganizationsWithSessionGuard}
      loadDepartments={loadDepartmentsWithSessionGuard}
      loadPositions={loadPositionsWithSessionGuard}
      loadEmployees={loadEmployeesWithSessionGuard}
      resetDirectoryFilters={resetDirectoryFilters}
      supabaseSessionError={supabaseSessionError}
      selectedEmployeeId={selectedEmployeeId}
      setSelectedEmployeeId={setSelectedEmployeeId}
      loadSelectedEmployeeHistory={loadSelectedEmployeeHistoryWithSessionGuard}
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
      applySelectedProfileUpdate={applySelectedProfileUpdateWithSessionGuard}
      history={history}
      filteredHistory={filteredHistory}
      historyActionFilter={historyActionFilter}
      setHistoryActionFilter={setHistoryActionFilter}
      historyFieldFilter={historyFieldFilter}
      setHistoryFieldFilter={setHistoryFieldFilter}
      historyChangeSummary={historyChangeSummary}
      historyChanges={historyChanges}
      profileFieldLabel={profileFieldLabel}
      logs={logs}
      pendingLabel={pendingLabel}
      showDevTools={showDevTools}
      sourceContext={sourceContext}
      focusPanel={focusPanel}
    />
  );
}


