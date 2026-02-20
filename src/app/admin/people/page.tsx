"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

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
type HistorySearchScope = "all" | "action" | "actor" | "field" | "detail";
type HistorySortOption = "recent_desc" | "oldest_asc" | "change_count_desc" | "risk_desc";
type HistoryRiskLevel = "normal" | "watch" | "critical";

type HistorySearchSortRow = {
  key: string;
  action: string;
  actionText: string;
  actor: string;
  createdAt: string;
  createdAtTs: number;
  changeCount: number;
  changedFields: ProfileField[];
  detail: string;
  riskLevel: HistoryRiskLevel;
  hasOrgJobChange: boolean;
  hasIdentityChange: boolean;
  hasDeactivateChange: boolean;
};

type HistoryRiskPredictionCard = {
  key: string;
  label: string;
  severity: HistoryRiskLevel;
  etaLabel: string;
  count: number;
  detail: string;
  targetSectionId: string;
};

type PeopleMobileFollowUpTone = "ready" | "pending" | "fail";
type PeopleMobileFollowUpAction = "jump" | "load_history" | "risk_filter" | "select_employee";

type PeopleMobileFollowUpGuideCard = {
  key: string;
  label: string;
  tone: PeopleMobileFollowUpTone;
  detail: string;
  ctaLabel: string;
  action: PeopleMobileFollowUpAction;
  targetSectionId: string;
};

const profileFieldLabel: Record<ProfileField, string> = {
  organizationId: "조직",
  departmentId: "부서",
  positionId: "직급",
  name: "이름",
  email: "이메일",
  active: "활성"
};

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
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

function actionLabel(action: string) {
  if (action === "employee.created") {
    return "직원 생성";
  }
  if (action === "employee.profile.updated") {
    return "직원 프로필 변경";
  }
  return action;
}

function historyRiskRank(level: HistoryRiskLevel) {
  if (level === "critical") {
    return 3;
  }
  if (level === "watch") {
    return 2;
  }
  return 1;
}

function historyRiskTone(level: HistoryRiskLevel): PeopleMobileFollowUpTone {
  if (level === "critical") {
    return "fail";
  }
  if (level === "watch") {
    return "pending";
  }
  return "ready";
}

function matchesHistorySearch(scope: HistorySearchScope, query: string, row: HistorySearchSortRow) {
  if (!query) {
    return true;
  }

  if (scope === "action") {
    return row.actionText.toLowerCase().includes(query) || row.action.toLowerCase().includes(query);
  }
  if (scope === "actor") {
    return row.actor.toLowerCase().includes(query);
  }
  if (scope === "field") {
    return row.changedFields.some((field) => profileFieldLabel[field].toLowerCase().includes(query));
  }
  if (scope === "detail") {
    return row.detail.toLowerCase().includes(query);
  }

  return (
    row.actionText.toLowerCase().includes(query) ||
    row.action.toLowerCase().includes(query) ||
    row.actor.toLowerCase().includes(query) ||
    row.detail.toLowerCase().includes(query) ||
    row.changedFields.some((field) => profileFieldLabel[field].toLowerCase().includes(query))
  );
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
  const [historySearchScope, setHistorySearchScope] = useState<HistorySearchScope>("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historySortOption, setHistorySortOption] = useState<HistorySortOption>("recent_desc");
  const [historyRiskOnly, setHistoryRiskOnly] = useState(false);

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
  const [mobileFlowFeedback, setMobileFlowFeedback] = useState("");
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const normalizedHistorySearchQuery = historySearchQuery.trim().toLowerCase();

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
        return leftKey.localeCompare(rightKey, "ko");
      });
  }, [activeFilter, departmentFilter, employees, organizationId, positionFilter, recentlyUpdatedDays, search]);

  const tree = useMemo(() => {
    const result = new Map<string, { orgName: string; departments: Map<string, Employee[]> }>();
    for (const employee of filteredEmployees) {
      const orgKey = employee.organizationId ?? "__none__";
      const orgName = employee.organizationId
        ? (organizationById.get(employee.organizationId)?.name ?? employee.organizationId)
        : "미지정 조직";
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
            ? "미지정 부서"
            : (departmentById.get(deptKey)?.name ?? deptKey),
        employees: deptEmployees.sort((a, b) =>
          (normalize(a.name) || a.id).localeCompare(normalize(b.name) || b.id, "ko")
        )
      }))
    }));
  }, [departmentById, filteredEmployees, organizationById]);

  const compareRows = useMemo(() => {
    if (!compareEmployeeA || !compareEmployeeB) {
      return [] as Array<{ label: string; a: string; b: string; diff: boolean }>;
    }
    const rows = [
      { label: "이름", a: compareEmployeeA.name ?? "-", b: compareEmployeeB.name ?? "-" },
      { label: "이메일", a: compareEmployeeA.email ?? "-", b: compareEmployeeB.email ?? "-" },
      {
        label: "조직",
        a: compareEmployeeA.organizationId
          ? (organizationById.get(compareEmployeeA.organizationId)?.name ?? compareEmployeeA.organizationId)
          : "-",
        b: compareEmployeeB.organizationId
          ? (organizationById.get(compareEmployeeB.organizationId)?.name ?? compareEmployeeB.organizationId)
          : "-"
      },
      {
        label: "부서",
        a: compareEmployeeA.departmentId
          ? (departmentById.get(compareEmployeeA.departmentId)?.name ?? compareEmployeeA.departmentId)
          : "-",
        b: compareEmployeeB.departmentId
          ? (departmentById.get(compareEmployeeB.departmentId)?.name ?? compareEmployeeB.departmentId)
          : "-"
      },
      {
        label: "직급",
        a: compareEmployeeA.positionId
          ? (positionById.get(compareEmployeeA.positionId)?.name ?? compareEmployeeA.positionId)
          : "-",
        b: compareEmployeeB.positionId
          ? (positionById.get(compareEmployeeB.positionId)?.name ?? compareEmployeeB.positionId)
          : "-"
      },
      { label: "활성", a: compareEmployeeA.active ? "활성" : "비활성", b: compareEmployeeB.active ? "활성" : "비활성" },
      { label: "최근 업데이트", a: formatDateTime(compareEmployeeA.updatedAt), b: formatDateTime(compareEmployeeB.updatedAt) }
    ];
    return rows.map((row) => ({ ...row, diff: row.a !== row.b }));
  }, [compareEmployeeA, compareEmployeeB, departmentById, organizationById, positionById]);

  const formatProfileValue = useCallback(
    (field: ProfileField, value: unknown) => {
      if (value === null || value === undefined) {
        return "-";
      }
      if (field === "active") {
        if (typeof value === "boolean") {
          return value ? "활성" : "비활성";
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
    [departmentById, organizationById, positionById]
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

  function jumpPeopleSection(sectionId: string, label: string) {
    const section = document.getElementById(sectionId);
    if (!section) {
      setMobileFlowFeedback(`${label} 섹션을 찾지 못했습니다.`);
      return;
    }
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileFlowFeedback(`${label} 섹션으로 이동했습니다.`);
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
        { id: Date.now(), label, status: response.status, ok: response.ok, at: new Date().toLocaleString("ko-KR") },
        ...prev
      ]);
      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadOrganizations() {
    const { response, body } = await callApi("조직 목록 조회", "GET", "/api/people/organizations");
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { organizations?: Organization[] };
    setOrganizations(Array.isArray(parsed.organizations) ? parsed.organizations : []);
  }

  async function loadDepartments() {
    const { response, body } = await callApi(
      "부서 목록 조회",
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
      "직급 목록 조회",
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
      "직원 목록 조회",
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
      "직원 인사 이력 조회",
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
      "직원 프로필 업데이트",
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
  }, [history]);

  const historySearchSortRows = useMemo<HistorySearchSortRow[]>(() => {
    return history.map((entry, index) => {
      const changes = historyChanges(entry);
      const changedFields = changes.map((change) => change.field);
      const hasOrgJobChange = changedFields.some(
        (field) => field === "organizationId" || field === "departmentId" || field === "positionId"
      );
      const hasIdentityChange = changedFields.some((field) => field === "name" || field === "email");
      const hasDeactivateChange = changes.some((change) => change.field === "active" && change.after === "비활성");
      const riskLevel: HistoryRiskLevel =
        hasDeactivateChange || (hasOrgJobChange && changedFields.length >= 2)
          ? "critical"
          : hasOrgJobChange || hasIdentityChange || changedFields.length >= 2
            ? "watch"
            : "normal";

      const detail =
        changes.length === 0
          ? "변경 필드 정보 없음"
          : changes
              .slice(0, 5)
              .map((change) => `${profileFieldLabel[change.field]}: ${change.before} -> ${change.after}`)
              .join(" | ");

      return {
        key: `${entry.action}-${entry.createdAt}-${index}`,
        action: entry.action,
        actionText: actionLabel(entry.action),
        actor: `${entry.actorRole}${entry.actorId ? ` (${entry.actorId})` : ""}`,
        createdAt: entry.createdAt,
        createdAtTs: toTimestamp(entry.createdAt),
        changeCount: changes.length,
        changedFields,
        detail,
        riskLevel,
        hasOrgJobChange,
        hasIdentityChange,
        hasDeactivateChange
      };
    });
  }, [history, historyChanges]);

  const filteredHistorySearchSortRows = useMemo(() => {
    const filtered = historySearchSortRows.filter((row) => {
      if (historyRiskOnly && row.riskLevel === "normal") {
        return false;
      }
      return matchesHistorySearch(historySearchScope, normalizedHistorySearchQuery, row);
    });

    return [...filtered].sort((left, right) => {
      if (historySortOption === "oldest_asc") {
        return left.createdAtTs - right.createdAtTs;
      }
      if (historySortOption === "change_count_desc") {
        const changeDiff = right.changeCount - left.changeCount;
        if (changeDiff !== 0) {
          return changeDiff;
        }
        return right.createdAtTs - left.createdAtTs;
      }
      if (historySortOption === "risk_desc") {
        const riskDiff = historyRiskRank(right.riskLevel) - historyRiskRank(left.riskLevel);
        if (riskDiff !== 0) {
          return riskDiff;
        }
        const changeDiff = right.changeCount - left.changeCount;
        if (changeDiff !== 0) {
          return changeDiff;
        }
        return right.createdAtTs - left.createdAtTs;
      }
      return right.createdAtTs - left.createdAtTs;
    });
  }, [
    historyRiskOnly,
    historySearchScope,
    historySearchSortRows,
    historySortOption,
    normalizedHistorySearchQuery
  ]);

  const historyRiskPredictionCards = useMemo<HistoryRiskPredictionCard[]>(() => {
    const highRiskRows = historySearchSortRows.filter((row) => row.riskLevel !== "normal");
    const orgJobRows = historySearchSortRows.filter((row) => row.hasOrgJobChange);
    const identityRows = historySearchSortRows.filter((row) => row.hasIdentityChange);
    const deactivateRows = historySearchSortRows.filter((row) => row.hasDeactivateChange);

    const toCard = (
      key: string,
      label: string,
      rows: HistorySearchSortRow[],
      targetSectionId: string
    ): HistoryRiskPredictionCard => {
      const count = rows.length;
      const maxChangeCount = count > 0 ? Math.max(...rows.map((row) => row.changeCount)) : 0;
      const criticalCount = rows.filter((row) => row.riskLevel === "critical").length;
      const watchCount = rows.filter((row) => row.riskLevel === "watch").length;
      const severity: HistoryRiskLevel =
        count >= 3 || criticalCount >= 1 || maxChangeCount >= 3 ? "critical" : count > 0 ? "watch" : "normal";
      const etaLabel = count === 0 ? "stable" : severity === "critical" ? "review now" : "within today";

      return {
        key,
        label,
        severity,
        etaLabel,
        count,
        detail:
          count === 0
            ? "위험 신호 없음"
            : `items ${count} / critical ${criticalCount} / watch ${watchCount} / max-field-change ${maxChangeCount}`,
        targetSectionId
      };
    };

    return [
      toCard("overall-risk", "overall history risk", highRiskRows, "history-search-sort"),
      toCard("org-job-risk", "org/job reassignment risk", orgJobRows, "org-chart"),
      toCard("identity-risk", "identity change risk", identityRows, "employee-compare"),
      toCard("deactivation-risk", "deactivation risk", deactivateRows, "directory-filters")
    ].sort((left, right) => {
      const severityDiff = historyRiskRank(right.severity) - historyRiskRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.count - left.count;
    });
  }, [historySearchSortRows]);

  const peopleMobileFollowUpGuideCards = useMemo<PeopleMobileFollowUpGuideCard[]>(() => {
    const topRiskCard = historyRiskPredictionCards[0] ?? null;
    const topRiskTone = historyRiskTone(topRiskCard?.severity ?? "normal");
    const hasHighRiskRows = historySearchSortRows.some((row) => row.riskLevel !== "normal");

    return [
      {
        key: "history-search-sort-follow-up",
        label: "history search/sort follow-up",
        tone: filteredHistorySearchSortRows.length > 0 ? "ready" : "pending",
        detail:
          filteredHistorySearchSortRows.length > 0
            ? `${filteredHistorySearchSortRows.length} row(s) match current history options.`
            : "No history row matches current options. Reset and search again.",
        ctaLabel: "open search/sort",
        action: "jump",
        targetSectionId: "history-search-sort"
      },
      {
        key: "risk-prediction-follow-up",
        label: "risk prediction follow-up",
        tone: topRiskTone,
        detail: topRiskCard?.detail ?? "Review change risk prediction feedback and adjust follow-up priority.",
        ctaLabel: "open risk prediction",
        action: "jump",
        targetSectionId: "history-risk-prediction"
      },
      {
        key: "selected-history-follow-up",
        label: "selected employee history follow-up",
        tone: !selectedEmployee ? "fail" : history.length > 0 ? "ready" : "pending",
        detail: !selectedEmployee
          ? "No selected employee. Select an employee in org chart first."
          : history.length > 0
            ? `Loaded ${history.length} history record(s) for ${selectedEmployee.id}.`
            : "No loaded history for selected employee. Refresh history.",
        ctaLabel: !selectedEmployee ? "select employee" : "refresh history",
        action: !selectedEmployee ? "select_employee" : "load_history",
        targetSectionId: !selectedEmployee ? "org-chart" : "employee-history"
      },
      {
        key: "high-risk-filter-follow-up",
        label: "high-risk filter follow-up",
        tone: hasHighRiskRows ? "pending" : "ready",
        detail: hasHighRiskRows
          ? "There are high-risk history rows. Open risk-first view."
          : "No high-risk row now. Keep monitoring with recent-desc sort.",
        ctaLabel: "risk-first view",
        action: "risk_filter",
        targetSectionId: "history-search-sort"
      }
    ];
  }, [
    filteredHistorySearchSortRows.length,
    history.length,
    historyRiskPredictionCards,
    historySearchSortRows,
    selectedEmployee
  ]);

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

  function resetHistorySearchSortControls() {
    setHistorySearchScope("all");
    setHistorySearchQuery("");
    setHistorySortOption("recent_desc");
    setHistoryRiskOnly(false);
  }

  function applyHistoryRiskFirstFilter() {
    setHistorySortOption("risk_desc");
    setHistoryRiskOnly(true);
    setHistorySearchScope("all");
    setHistorySearchQuery("");
  }

  function runPeopleMobileFollowUpAction(card: PeopleMobileFollowUpGuideCard) {
    if (card.action === "load_history") {
      if (selectedEmployee) {
        void loadSelectedEmployeeHistory(selectedEmployee.id);
      }
      jumpPeopleSection(card.targetSectionId, card.label);
      return;
    }
    if (card.action === "risk_filter") {
      applyHistoryRiskFirstFilter();
      jumpPeopleSection(card.targetSectionId, card.label);
      return;
    }
    if (card.action === "select_employee") {
      const fallbackEmployeeId = filteredEmployees[0]?.id ?? employees[0]?.id;
      if (fallbackEmployeeId) {
        setSelectedEmployeeId(fallbackEmployeeId);
        void loadSelectedEmployeeHistory(fallbackEmployeeId);
      }
      jumpPeopleSection(card.targetSectionId, card.label);
      return;
    }
    jumpPeopleSection(card.targetSectionId, card.label);
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">조직도/인사 이력</h1>
          <p className="page-subtitle">조직도 트리, 직원 비교, 인사 이력 카드를 한 화면에서 관리합니다.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => void refreshDirectory()}>
            디렉터리 조회
          </button>
          <Link className="btn btn-secondary" href="/admin">
            관리자 대시보드
          </Link>
        </div>
      </header>

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>조직</p>
          <strong>{organizations.length}</strong>
        </article>
        <article className="kpi-card">
          <p>부서</p>
          <strong>{departments.length}</strong>
        </article>
        <article className="kpi-card">
          <p>직급</p>
          <strong>{positions.length}</strong>
        </article>
        <article className="kpi-card">
          <p>직원</p>
          <strong>
            {filteredEmployees.length} / {employees.length}
          </strong>
        </article>
        <article className="kpi-card">
          <p>API 호출</p>
          <strong>
            {stats.total} (OK {stats.success} / FAIL {stats.fail})
          </strong>
        </article>
      </section>

      <section className="panel-grid">
        <article id="directory-filters" className="panel panel-directory-filters">
          <h2>필터</h2>
          <div className="input-grid">
            <label>
              Organization ID
              <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
            </label>
            <label>
              Admin Actor ID
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
              Department Filter
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option value="">All</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} ({department.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Position Filter
              <select value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)}>
                <option value="">All</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name} ({position.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Updated Window
              <select
                value={recentlyUpdatedDays}
                onChange={(event) => setRecentlyUpdatedDays(event.target.value as UpdatedWindow)}
              >
                <option value="all">All</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </label>
            <label>
              History Limit
              <input type="number" min={1} max={200} value={historyLimit} onChange={(event) => setHistoryLimit(event.target.value)} />
            </label>
            {showDevTools ? (
              <label className="full">
                Bearer Access Token (override)
                <textarea rows={3} value={accessToken} onChange={(event) => setAccessToken(event.target.value)} />
              </label>
            ) : null}
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => void loadOrganizations()}>
              조직 조회
            </button>
            <button className="btn btn-secondary" onClick={() => void loadDepartments()}>
              부서 조회
            </button>
            <button className="btn btn-secondary" onClick={() => void loadPositions()}>
              직급 조회
            </button>
            <button className="btn btn-secondary" onClick={() => void loadEmployees()}>
              직원 조회
            </button>
            <button className="btn btn-secondary" onClick={resetDirectoryFilters}>
              Filter Reset
            </button>
          </div>
          <p className="small muted">
            filter summary: dept={departmentFilter || "all"} / position={positionFilter || "all"} / updated=
            {recentlyUpdatedDays}
          </p>
          {supabaseSessionError ? <p className="small fail">세션 오류: {supabaseSessionError}</p> : null}
        </article>

        <article id="people-mobile-flow" className="panel panel-people-mobile-flow">
          <h2>모바일 탐색 흐름</h2>
          <p className="small">필터, 트리, 비교, 이력 섹션 사이를 빠르게 이동할 수 있습니다.</p>
          <div className="people-mobile-nav-grid">
            <button type="button" className="btn btn-secondary" onClick={() => jumpPeopleSection("directory-filters", "필터")}>
              필터 이동
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => jumpPeopleSection("org-chart", "조직도 트리")}>
              트리 이동
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => jumpPeopleSection("employee-compare", "직원 비교")}>
              비교 이동
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => jumpPeopleSection("employee-history", "인사 이력")}>
              이력 이동
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => jumpPeopleSection("history-search-sort", "이력 검색/정렬")}
            >
              이력 검색/정렬
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => jumpPeopleSection("history-risk-prediction", "위험 예측")}
            >
              위험 예측
            </button>
          </div>
          <p className="people-mobile-feedback">{mobileFlowFeedback || "이동할 섹션을 선택하세요."}</p>
        </article>

        <article id="org-chart" className="panel panel-org-chart">
          <h2>조직도 트리</h2>
          {tree.length === 0 ? (
            <p className="small muted">표시할 직원이 없습니다.</p>
          ) : (
            <ul className="org-chart-list" aria-label="조직도 트리">
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
                                  {employee.id} / {employee.active ? "활성" : "비활성"}
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
          <h2>직원 비교</h2>
          <div className="input-grid">
            <label>
              비교 A
              <select value={compareA} onChange={(event) => setCompareA(event.target.value)}>
                <option value="">선택</option>
                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.id}
                    {employee.name ? ` (${employee.name})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              비교 B
              <select value={compareB} onChange={(event) => setCompareB(event.target.value)}>
                <option value="">선택</option>
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
            <p className="small muted">비교할 두 직원을 선택하세요.</p>
          ) : (
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>항목</th>
                    <th>{compareEmployeeA?.id}</th>
                    <th>{compareEmployeeB?.id}</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.label} className={row.diff ? "compare-diff-row" : ""}>
                      <th>
                        {row.label}
                        {row.diff ? <span className="compare-change-chip">CHANGED</span> : null}
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
          <h2>인사 이력</h2>
          {selectedEmployee ? (
            <>
              <p className="small">
                선택 직원: <strong>{selectedEmployee.id}</strong> · 최근 업데이트{" "}
                {formatDateTime(selectedEmployee.updatedAt)}
              </p>
              <div className="input-grid">
                <label>
                  부서 재배정
                  <select value={editDepartmentId} onChange={(event) => setEditDepartmentId(event.target.value)}>
                    <option value="">미지정</option>
                    {selectedDepartments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name} ({department.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  직급 재배정
                  <select value={editPositionId} onChange={(event) => setEditPositionId(event.target.value)}>
                    <option value="">미지정</option>
                    {selectedPositions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.name} ({position.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  활성 상태
                  <select value={editActive} onChange={(event) => setEditActive(event.target.value)}>
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                </label>
              </div>
              <div className="actions">
                <button className="btn btn-primary" onClick={() => void applySelectedProfileUpdate()}>
                  프로필 업데이트
                </button>
                <button className="btn btn-secondary" onClick={() => void loadSelectedEmployeeHistory(selectedEmployee.id)}>
                  이력 조회
                </button>
              </div>
            </>
          ) : (
            <p className="small muted">조직도 트리에서 직원을 선택하세요.</p>
          )}

          {history.length === 0 ? (
            <p className="small muted">표시할 이력이 없습니다.</p>
          ) : (
            <>
              {historyChangeSummary.length > 0 ? (
                <ul className="history-change-summary-list" aria-label="History Change Summary">
                  {historyChangeSummary.map((item) => (
                    <li key={item.field} className={`history-change-summary-chip ${changeHighlightClass(item.field)}`}>
                      <strong>{item.label}</strong>
                      <span>{item.count} changes</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <ul className="history-card-list" aria-label="직원 인사 이력">
                {history.map((entry, index) => {
                  const changes = historyChanges(entry);
                  return (
                    <li key={`${entry.action}-${entry.createdAt}-${index}`} className="history-card">
                      <div className="history-card-head">
                        <strong>{actionLabel(entry.action)}</strong>
                        <span className="muted">{formatDateTime(entry.createdAt)}</span>
                      </div>
                      <p className="small">
                        actor {entry.actorRole}
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

        <article id="history-search-sort" className="panel panel-history-search-sort">
          <h2>이력 검색/정렬</h2>
          <p className="small">인사 이력 항목을 검색 범위/위험도/변경 개수 기준으로 빠르게 탐색합니다.</p>
          <div className="history-search-toolbar">
            <label>
              검색 범위
              <select value={historySearchScope} onChange={(event) => setHistorySearchScope(event.target.value as HistorySearchScope)}>
                <option value="all">전체</option>
                <option value="action">액션</option>
                <option value="actor">액터</option>
                <option value="field">변경 필드</option>
                <option value="detail">상세</option>
              </select>
            </label>
            <label className="full">
              검색어
              <input
                value={historySearchQuery}
                onChange={(event) => setHistorySearchQuery(event.target.value)}
                placeholder="예: 프로필, 부서, 비활성, ADM-1001"
              />
            </label>
            <label>
              정렬
              <select value={historySortOption} onChange={(event) => setHistorySortOption(event.target.value as HistorySortOption)}>
                <option value="recent_desc">최신순</option>
                <option value="oldest_asc">오래된순</option>
                <option value="change_count_desc">변경 항목 많은순</option>
                <option value="risk_desc">위험도 우선</option>
              </select>
            </label>
            <label className="history-risk-only-toggle">
              <input type="checkbox" checked={historyRiskOnly} onChange={(event) => setHistoryRiskOnly(event.target.checked)} />
              위험 항목만 보기
            </label>
            <div className="history-search-actions">
              <button type="button" className="btn btn-secondary btn-small" onClick={resetHistorySearchSortControls}>
                초기화
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={applyHistoryRiskFirstFilter}>
                위험 우선
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => jumpPeopleSection("employee-history", "인사 이력")}
              >
                이력 원본 보기
              </button>
            </div>
          </div>
          {filteredHistorySearchSortRows.length === 0 ? (
            <p className="small muted">현재 조건에 맞는 이력 항목이 없습니다.</p>
          ) : (
            <ul className="history-search-list" aria-label="people history search and sort list">
              {filteredHistorySearchSortRows.slice(0, 30).map((row) => (
                <li key={row.key} className={`risk-${row.riskLevel}`}>
                  <div className="history-search-head">
                    <strong>{row.actionText}</strong>
                    <span className="queue-history-chip">risk {row.riskLevel}</span>
                  </div>
                  <p>{row.detail}</p>
                  <div className="history-search-meta">
                    <span className="queue-history-chip">{formatDateTime(row.createdAt)}</span>
                    <span className="queue-history-chip">{row.actor}</span>
                    <span className="queue-history-chip">fields {row.changeCount}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article id="history-risk-prediction" className="panel panel-history-risk-prediction">
          <h2>변경 위험 예측 피드백</h2>
          <p className="small">조직/직급 재배치, 식별정보 변경, 비활성 전환 위험을 카드로 요약합니다.</p>
          <ul className="history-risk-prediction-list" aria-label="people history risk prediction feedback list">
            {historyRiskPredictionCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="history-risk-prediction-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">ETA {card.etaLabel}</span>
                </div>
                <p>{card.detail}</p>
                <div className="history-risk-prediction-meta">
                  <span className="queue-history-chip">count {card.count}</span>
                  <span className="queue-history-chip">severity {card.severity}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpPeopleSection(card.targetSectionId, card.label)}
                >
                  관련 섹션 이동
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article id="people-mobile-follow-up-guide" className="panel panel-people-mobile-follow-up-guide">
          <h2>모바일 후속 액션 가이드</h2>
          <p className="small">검색/예측/선택 상태를 바탕으로 다음 액션을 한 번에 실행합니다.</p>
          <ul className="people-mobile-follow-up-guide-list" aria-label="people mobile follow-up action guide list">
            {peopleMobileFollowUpGuideCards.map((card) => (
              <li key={card.key} className={`tone-${card.tone}`}>
                <div className="people-mobile-follow-up-guide-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">{card.tone}</span>
                </div>
                <p>{card.detail}</p>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => runPeopleMobileFollowUpAction(card)}>
                  {card.ctaLabel}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>요청 로그</h2>
          <p className="small">
            총 {stats.total}건 · 성공 {stats.success}건 · 실패 {stats.fail}건
            {pendingLabel ? ` · 진행 중 ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? (
            <p className="small muted">아직 API 호출 이력이 없습니다.</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span>
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

