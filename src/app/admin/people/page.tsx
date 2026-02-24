"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";

type Organization = { id: string; name: string };
type Department = { id: string; organizationId: string; code: string; name: string; active: boolean };
type Position = { id: string; organizationId: string; code: string; name: string; active: boolean };
type Employee = {
  id: string;
  organizationId: string | null;
  departmentId: string | null;
  positionId: string | null;
  name: string | null;
  email: string | null;
  active: boolean;
  updatedAt: string;
};
type EmployeeHistory = {
  action: string;
  actorRole: string;
  actorId: string | null;
  payload: unknown;
  createdAt: string;
};
type ApiLog = { id: number; label: string; status: number; ok: boolean; at: string };

type ActiveFilter = "all" | "active" | "inactive";
type UpdatedWindow = "all" | "7" | "30" | "90";
type ProfileField = "organizationId" | "departmentId" | "positionId" | "name" | "email" | "active";

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function formatDateTime(value: string, runtimeLocale: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}

function toTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  return parsed.getTime();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function buildQuery(input: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value.trim() === "") {
      continue;
    }
    search.set(key, value.trim());
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

function actionLabel(action: string, isKoLocale: boolean) {
  if (action === "employee.created") {
    return isKoLocale ? "직원 생성" : "Employee created";
  }
  if (action === "employee.profile.updated") {
    return isKoLocale ? "직원 프로필 변경" : "Employee profile updated";
  }
  return action;
}

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
    const normalizedSearch = normalize(search);
    const now = Date.now();
    const updatedWindowDays =
      recentlyUpdatedDays === "all" ? null : Number.parseInt(recentlyUpdatedDays, 10);
    return employees
      .filter((employee) => {
        if (organizationId.trim() && employee.organizationId !== organizationId.trim()) {
          return false;
        }
        if (activeFilter === "active" && !employee.active) {
          return false;
        }
        if (activeFilter === "inactive" && employee.active) {
          return false;
        }
        if (departmentFilter && employee.departmentId !== departmentFilter) {
          return false;
        }
        if (positionFilter && employee.positionId !== positionFilter) {
          return false;
        }
        if (
          updatedWindowDays !== null &&
          now - toTimestamp(employee.updatedAt) > updatedWindowDays * 24 * 60 * 60 * 1000
        ) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }
        const haystack = [
          employee.id,
          employee.name ?? "",
          employee.email ?? "",
          employee.organizationId ?? "",
          employee.departmentId ?? "",
          employee.positionId ?? ""
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .sort((left, right) => {
        const leftKey = normalize(left.name) || left.id.toLowerCase();
        const rightKey = normalize(right.name) || right.id.toLowerCase();
        return leftKey.localeCompare(rightKey, runtimeLocale);
      });
  }, [activeFilter, departmentFilter, employees, organizationId, positionFilter, recentlyUpdatedDays, runtimeLocale, search]);

  const tree = useMemo(() => {
    const result = new Map<string, { orgName: string; departments: Map<string, Employee[]> }>();
    for (const employee of filteredEmployees) {
      const orgKey = employee.organizationId ?? "__none__";
      const orgName = employee.organizationId
        ? (organizationById.get(employee.organizationId)?.name ?? employee.organizationId)
        : isKoLocale
          ? "미지정 조직"
          : "Unassigned organization";
      const deptKey = employee.departmentId ?? "__none__";
      const orgBucket = result.get(orgKey) ?? { orgName, departments: new Map<string, Employee[]>() };
      if (!result.has(orgKey)) {
        result.set(orgKey, orgBucket);
      }
      const deptBucket = orgBucket.departments.get(deptKey) ?? [];
      deptBucket.push(employee);
      orgBucket.departments.set(deptKey, deptBucket);
    }
    return Array.from(result.entries()).map(([orgKey, orgValue]) => ({
      orgKey,
      orgName: orgValue.orgName,
      departments: Array.from(orgValue.departments.entries()).map(([deptKey, deptEmployees]) => ({
        deptKey,
        deptName:
          deptKey === "__none__"
            ? isKoLocale
              ? "미지정 부서"
              : "Unassigned department"
            : (departmentById.get(deptKey)?.name ?? deptKey),
        employees: deptEmployees.sort((a, b) =>
          (normalize(a.name) || a.id).localeCompare(normalize(b.name) || b.id, runtimeLocale)
        )
      }))
    }));
  }, [departmentById, filteredEmployees, isKoLocale, organizationById, runtimeLocale]);

  const compareRows = useMemo(() => {
    if (!compareEmployeeA || !compareEmployeeB) {
      return [] as Array<{ label: string; a: string; b: string; diff: boolean }>;
    }
    const rows = [
      { label: isKoLocale ? "이름" : "Name", a: compareEmployeeA.name ?? "-", b: compareEmployeeB.name ?? "-" },
      { label: isKoLocale ? "이메일" : "Email", a: compareEmployeeA.email ?? "-", b: compareEmployeeB.email ?? "-" },
      {
        label: isKoLocale ? "조직" : "Organization",
        a: compareEmployeeA.organizationId
          ? (organizationById.get(compareEmployeeA.organizationId)?.name ?? compareEmployeeA.organizationId)
          : "-",
        b: compareEmployeeB.organizationId
          ? (organizationById.get(compareEmployeeB.organizationId)?.name ?? compareEmployeeB.organizationId)
          : "-"
      },
      {
        label: isKoLocale ? "부서" : "Department",
        a: compareEmployeeA.departmentId
          ? (departmentById.get(compareEmployeeA.departmentId)?.name ?? compareEmployeeA.departmentId)
          : "-",
        b: compareEmployeeB.departmentId
          ? (departmentById.get(compareEmployeeB.departmentId)?.name ?? compareEmployeeB.departmentId)
          : "-"
      },
      {
        label: isKoLocale ? "직급" : "Position",
        a: compareEmployeeA.positionId
          ? (positionById.get(compareEmployeeA.positionId)?.name ?? compareEmployeeA.positionId)
          : "-",
        b: compareEmployeeB.positionId
          ? (positionById.get(compareEmployeeB.positionId)?.name ?? compareEmployeeB.positionId)
          : "-"
      },
      {
        label: isKoLocale ? "활성" : "Active",
        a: compareEmployeeA.active ? (isKoLocale ? "활성" : "Active") : isKoLocale ? "비활성" : "Inactive",
        b: compareEmployeeB.active ? (isKoLocale ? "활성" : "Active") : isKoLocale ? "비활성" : "Inactive"
      },
      {
        label: isKoLocale ? "최근 업데이트" : "Last updated",
        a: formatDateTime(compareEmployeeA.updatedAt, runtimeLocale),
        b: formatDateTime(compareEmployeeB.updatedAt, runtimeLocale)
      }
    ];
    return rows.map((row) => ({ ...row, diff: row.a !== row.b }));
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

  function changeHighlightClass(field: ProfileField) {
    if (field === "organizationId" || field === "departmentId") {
      return "highlight-org";
    }
    if (field === "positionId") {
      return "highlight-job";
    }
    if (field === "name" || field === "email") {
      return "highlight-identity";
    }
    return "highlight-status";
  }

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
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{isKoLocale ? "조직도/인사 이력" : "Organization chart and HR history"}</h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "조직도 트리, 직원 비교, 인사 이력 카드를 한 화면에서 관리합니다."
              : "Manage org tree, employee comparison, and HR history cards in one screen."}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => void refreshDirectory()}>
            {isKoLocale ? "디렉터리 조회" : "Refresh directory"}
          </button>
          <Link className="btn btn-secondary" href="/admin">
            {isKoLocale ? "관리자 대시보드" : "Admin dashboard"}
          </Link>
        </div>
      </header>

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>{isKoLocale ? "조직" : "Organizations"}</p>
          <strong>{organizations.length}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "부서" : "Departments"}</p>
          <strong>{departments.length}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "직급" : "Positions"}</p>
          <strong>{positions.length}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "직원" : "Employees"}</p>
          <strong>
            {filteredEmployees.length} / {employees.length}
          </strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "API 호출" : "API calls"}</p>
          <strong>
            {stats.total} ({isKoLocale ? "성공" : "OK"} {stats.success} / {isKoLocale ? "실패" : "FAIL"} {stats.fail})
          </strong>
        </article>
      </section>

      <section className="panel-grid">
        <article id="directory-filters" className="panel panel-directory-filters">
          <h2>{isKoLocale ? "필터" : "Filters"}</h2>
          <div className="input-grid">
            <label>
              {isKoLocale ? "조직 ID" : "Organization ID"}
              <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
            </label>
            <label>
              {isKoLocale ? "관리자 액터 ID" : "Admin actor ID"}
              <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
            </label>
            <label>
              직원 검색
              <input value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label>
              활성 필터
              <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}>
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </label>
            <label>
              {isKoLocale ? "부서 필터" : "Department filter"}
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option value="">{isKoLocale ? "전체" : "All"}</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} ({department.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              {isKoLocale ? "직급 필터" : "Position filter"}
              <select value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)}>
                <option value="">{isKoLocale ? "전체" : "All"}</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name} ({position.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              {isKoLocale ? "최근 업데이트 범위" : "Updated window"}
              <select
                value={recentlyUpdatedDays}
                onChange={(event) => setRecentlyUpdatedDays(event.target.value as UpdatedWindow)}
              >
                <option value="all">{isKoLocale ? "전체" : "All"}</option>
                <option value="7">{isKoLocale ? "7일" : "7 days"}</option>
                <option value="30">{isKoLocale ? "30일" : "30 days"}</option>
                <option value="90">{isKoLocale ? "90일" : "90 days"}</option>
              </select>
            </label>
            <label>
              {isKoLocale ? "이력 조회 개수" : "History limit"}
              <input type="number" min={1} max={200} value={historyLimit} onChange={(event) => setHistoryLimit(event.target.value)} />
            </label>
            {showDevTools ? (
              <label className="full">
                {isKoLocale ? "Bearer 액세스 토큰 (override)" : "Bearer access token (override)"}
                <textarea rows={3} value={accessToken} onChange={(event) => setAccessToken(event.target.value)} />
              </label>
            ) : null}
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => void loadOrganizations()}>
              {isKoLocale ? "조직 조회" : "Load organizations"}
            </button>
            <button className="btn btn-secondary" onClick={() => void loadDepartments()}>
              {isKoLocale ? "부서 조회" : "Load departments"}
            </button>
            <button className="btn btn-secondary" onClick={() => void loadPositions()}>
              {isKoLocale ? "직급 조회" : "Load positions"}
            </button>
            <button className="btn btn-secondary" onClick={() => void loadEmployees()}>
              {isKoLocale ? "직원 조회" : "Load employees"}
            </button>
            <button className="btn btn-secondary" onClick={resetDirectoryFilters}>
              {isKoLocale ? "필터 초기화" : "Reset filters"}
            </button>
          </div>
          <p className="small muted">
            {isKoLocale ? "필터 요약" : "Filter summary"}:{" "}
            {isKoLocale ? "부서" : "dept"}={departmentFilter || (isKoLocale ? "전체" : "all")} /{" "}
            {isKoLocale ? "직급" : "position"}={positionFilter || (isKoLocale ? "전체" : "all")} /{" "}
            {isKoLocale ? "최근 업데이트" : "updated"}={recentlyUpdatedDays}
          </p>
          {supabaseSessionError ? (
            <p className="small fail">
              {isKoLocale ? "세션 오류" : "Session error"}: {supabaseSessionError}
            </p>
          ) : null}
        </article>

        <article id="org-chart" className="panel panel-org-chart">
          <h2>{isKoLocale ? "조직도 트리" : "Organization chart"}</h2>
          {tree.length === 0 ? (
            <p className="small muted">{isKoLocale ? "표시할 직원이 없습니다." : "No employee to display."}</p>
          ) : (
            <ul className="org-chart-list" aria-label={isKoLocale ? "조직도 트리" : "Organization chart"}>
              {tree.map((org) => (
                <li key={org.orgKey} className="org-chart-organization">
                  <div className="org-chart-org-head">
                    <strong>{org.orgName}</strong>
                  </div>
                  <ul className="org-chart-department-list">
                    {org.departments.map((department) => (
                      <li key={`${org.orgKey}-${department.deptKey}`}>
                        <div className="org-chart-dept-head">
                          <span>{department.deptName}</span>
                          <span className="muted">{department.employees.length}명</span>
                        </div>
                        <ul className="org-chart-employee-list">
                          {department.employees.map((employee) => (
                            <li key={employee.id}>
                              <button
                                type="button"
                                className={`employee-pill${employee.id === selectedEmployeeId ? " active" : ""}`}
                                onClick={() => {
                                  setSelectedEmployeeId(employee.id);
                                  void loadSelectedEmployeeHistory(employee.id);
                                }}
                              >
                                <strong>{employee.name ?? employee.id}</strong>
                                <span className="muted">
                                  {employee.id} / {employee.active ? (isKoLocale ? "활성" : "Active") : isKoLocale ? "비활성" : "Inactive"}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article id="employee-compare" className="panel panel-employee-compare">
          <h2>{isKoLocale ? "직원 비교" : "Employee comparison"}</h2>
          <div className="input-grid">
            <label>
              {isKoLocale ? "비교 A" : "Compare A"}
              <select value={compareA} onChange={(event) => setCompareA(event.target.value)}>
                <option value="">{isKoLocale ? "선택" : "Select"}</option>
                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.id}
                    {employee.name ? ` (${employee.name})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {isKoLocale ? "비교 B" : "Compare B"}
              <select value={compareB} onChange={(event) => setCompareB(event.target.value)}>
                <option value="">{isKoLocale ? "선택" : "Select"}</option>
                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.id}
                    {employee.name ? ` (${employee.name})` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {compareRows.length === 0 ? (
            <p className="small muted">{isKoLocale ? "비교할 두 직원을 선택하세요." : "Select two employees to compare."}</p>
          ) : (
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>{isKoLocale ? "항목" : "Field"}</th>
                    <th>{compareEmployeeA?.id}</th>
                    <th>{compareEmployeeB?.id}</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.label} className={row.diff ? "compare-diff-row" : ""}>
                      <th>
                        {row.label}
                        {row.diff ? <span className="compare-change-chip">{isKoLocale ? "변경됨" : "CHANGED"}</span> : null}
                      </th>
                      <td>{row.a}</td>
                      <td>{row.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article id="employee-history" className="panel panel-employee-history">
          <h2>{isKoLocale ? "인사 이력" : "HR history"}</h2>
          {selectedEmployee ? (
            <>
              <p className="small">
                {isKoLocale ? "선택 직원" : "Selected employee"}: <strong>{selectedEmployee.id}</strong> ·{" "}
                {isKoLocale ? "최근 업데이트" : "Last updated"} {formatDateTime(selectedEmployee.updatedAt, runtimeLocale)}
              </p>
              <div className="input-grid">
                <label>
                  {isKoLocale ? "부서 재배정" : "Reassign department"}
                  <select value={editDepartmentId} onChange={(event) => setEditDepartmentId(event.target.value)}>
                    <option value="">{isKoLocale ? "미지정" : "Unassigned"}</option>
                    {selectedDepartments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name} ({department.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {isKoLocale ? "직급 재배정" : "Reassign position"}
                  <select value={editPositionId} onChange={(event) => setEditPositionId(event.target.value)}>
                    <option value="">{isKoLocale ? "미지정" : "Unassigned"}</option>
                    {selectedPositions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.name} ({position.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {isKoLocale ? "활성 상태" : "Active status"}
                  <select value={editActive} onChange={(event) => setEditActive(event.target.value)}>
                    <option value="true">{isKoLocale ? "활성" : "Active"}</option>
                    <option value="false">{isKoLocale ? "비활성" : "Inactive"}</option>
                  </select>
                </label>
              </div>
              <div className="actions">
                <button className="btn btn-primary" onClick={() => void applySelectedProfileUpdate()}>
                  {isKoLocale ? "프로필 업데이트" : "Update profile"}
                </button>
                <button className="btn btn-secondary" onClick={() => void loadSelectedEmployeeHistory(selectedEmployee.id)}>
                  {isKoLocale ? "이력 조회" : "Load history"}
                </button>
              </div>
            </>
          ) : (
            <p className="small muted">{isKoLocale ? "조직도 트리에서 직원을 선택하세요." : "Select an employee from the org chart."}</p>
          )}

          {history.length === 0 ? (
            <p className="small muted">표시할 이력이 없습니다.</p>
          ) : (
            <>
              {historyChangeSummary.length > 0 ? (
                <ul className="history-change-summary-list" aria-label={isKoLocale ? "이력 변경 요약" : "History change summary"}>
                  {historyChangeSummary.map((item) => (
                    <li key={item.field} className={`history-change-summary-chip ${changeHighlightClass(item.field)}`}>
                      <strong>{item.label}</strong>
                      <span>
                        {item.count}
                        {isKoLocale ? "건 변경" : " changes"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <ul className="history-card-list" aria-label={isKoLocale ? "직원 인사 이력" : "Employee HR history"}>
                {history.map((entry, index) => {
                  const changes = historyChanges(entry);
                  return (
                    <li key={`${entry.action}-${entry.createdAt}-${index}`} className="history-card">
                      <div className="history-card-head">
                        <strong>{actionLabel(entry.action, isKoLocale)}</strong>
                        <span className="muted">{formatDateTime(entry.createdAt, runtimeLocale)}</span>
                      </div>
                      <p className="small">
                        {isKoLocale ? "액터" : "actor"} {entry.actorRole}
                        {entry.actorId ? ` (${entry.actorId})` : ""}
                      </p>
                      {changes.length === 0 ? (
                        <p className="small muted">변경 필드 정보가 없습니다.</p>
                      ) : (
                        <ul className="history-change-list">
                          {changes.map((change) => (
                            <li
                              key={`${entry.createdAt}-${change.field}`}
                              className={`history-change-item ${changeHighlightClass(change.field)}`}
                            >
                              <span className="history-change-field">{profileFieldLabel[change.field]}</span>
                              <span className="history-before">{change.before}</span>
                              <span className="history-arrow">→</span>
                              <span className="history-after">{change.after}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </article>

        <article className="panel">
          <h2>{isKoLocale ? "요청 로그" : "Request logs"}</h2>
          <p className="small">
            {isKoLocale ? "총" : "Total"} {stats.total}
            {isKoLocale ? "건 · 성공" : " · success"} {stats.success}
            {isKoLocale ? "건 · 실패" : " · fail"} {stats.fail}
            {isKoLocale ? "건" : ""}
            {pendingLabel ? ` · ${isKoLocale ? "진행 중" : "running"} ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? (
            <p className="small muted">{isKoLocale ? "아직 API 호출 이력이 없습니다." : "No API call history yet."}</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? (isKoLocale ? "성공" : "OK") : isKoLocale ? "실패" : "FAIL"}</span>
                  <span>{log.label}</span>
                  <span className="muted">
                    {log.status} · {log.at}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}


