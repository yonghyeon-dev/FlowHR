import {
  type ActiveFilter,
  type CompareRow,
  type Employee,
  type EmployeeHistory,
  type HistoryChangeSummaryItem,
  type HistoryEntryChange,
  type OrgTreeNode,
  type ProfileField,
  type UpdatedWindow
} from "@/app/admin/people/page-types";

export function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function formatDateTime(value: string, runtimeLocale: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}

export function toTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  return parsed.getTime();
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function buildQuery(input: Record<string, string | undefined>) {
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

export function actionLabel(action: string, isKoLocale: boolean) {
  if (action === "employee.created") {
    return isKoLocale ? "직원 생성" : "Employee created";
  }
  if (action === "employee.profile.updated") {
    return isKoLocale ? "직원 프로필 변경" : "Employee profile updated";
  }
  return action;
}

export function changeHighlightClass(field: ProfileField) {
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

const PROFILE_FIELDS: ProfileField[] = ["organizationId", "departmentId", "positionId", "name", "email", "active"];

export function resolveAdminPeopleProfileFieldLabel(isKoLocale: boolean): Record<ProfileField, string> {
  return {
    organizationId: isKoLocale ? "조직" : "Organization",
    departmentId: isKoLocale ? "부서" : "Department",
    positionId: isKoLocale ? "직급" : "Position",
    name: isKoLocale ? "이름" : "Name",
    email: isKoLocale ? "이메일" : "Email",
    active: isKoLocale ? "활성" : "Active"
  };
}

type FormatAdminPeopleProfileValueInput = {
  field: ProfileField;
  value: unknown;
  isKoLocale: boolean;
  organizationById: Map<string, { name: string }>;
  departmentById: Map<string, { name: string }>;
  positionById: Map<string, { name: string }>;
};

export function formatAdminPeopleProfileValue(input: FormatAdminPeopleProfileValueInput) {
  const { field, value, isKoLocale, organizationById, departmentById, positionById } = input;
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
}

export function extractEmployeeHistoryChanges(
  entry: EmployeeHistory,
  formatProfileValue: (field: ProfileField, value: unknown) => string
): HistoryEntryChange[] {
  const payload = asRecord(entry.payload);
  if (!payload) {
    return [];
  }
  if (entry.action === "employee.created") {
    return PROFILE_FIELDS
      .filter((field) => field in payload)
      .map((field) => ({ field, before: "-", after: formatProfileValue(field, payload[field]) }));
  }
  const before = asRecord(payload.before);
  const after = asRecord(payload.after);
  if (!before || !after) {
    return [];
  }
  return PROFILE_FIELDS
    .filter((field) => before[field] !== after[field])
    .map((field) => ({
      field,
      before: formatProfileValue(field, before[field]),
      after: formatProfileValue(field, after[field])
    }));
}

type BuildEmployeeHistoryChangeSummaryInput = {
  history: EmployeeHistory[];
  profileFieldLabel: Record<ProfileField, string>;
};

export function buildEmployeeHistoryChangeSummary(
  input: BuildEmployeeHistoryChangeSummaryInput
): HistoryChangeSummaryItem[] {
  const { history, profileFieldLabel } = input;
  const counters: Record<ProfileField, number> = {
    organizationId: 0,
    departmentId: 0,
    positionId: 0,
    name: 0,
    email: 0,
    active: 0
  };

  for (const entry of history) {
    const payload = asRecord(entry.payload);
    if (!payload) {
      continue;
    }

    if (entry.action === "employee.created") {
      for (const field of PROFILE_FIELDS) {
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
    for (const field of PROFILE_FIELDS) {
      if (before[field] !== after[field]) {
        counters[field] += 1;
      }
    }
  }

  return PROFILE_FIELDS
    .filter((field) => counters[field] > 0)
    .map((field) => ({ field, label: profileFieldLabel[field], count: counters[field] }))
    .sort((left, right) => right.count - left.count);
}

type FilterEmployeesInput = {
  employees: Employee[];
  organizationId: string;
  activeFilter: ActiveFilter;
  departmentFilter: string;
  positionFilter: string;
  recentlyUpdatedDays: UpdatedWindow;
  search: string;
  runtimeLocale: string;
};

export function filterEmployees(input: FilterEmployeesInput) {
  const {
    employees,
    organizationId,
    activeFilter,
    departmentFilter,
    positionFilter,
    recentlyUpdatedDays,
    search,
    runtimeLocale
  } = input;
  const normalizedSearch = normalize(search);
  const now = Date.now();
  const updatedWindowDays = recentlyUpdatedDays === "all" ? null : Number.parseInt(recentlyUpdatedDays, 10);

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
      if (updatedWindowDays !== null && now - toTimestamp(employee.updatedAt) > updatedWindowDays * 24 * 60 * 60 * 1000) {
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
}

type BuildOrgTreeInput = {
  filteredEmployees: Employee[];
  organizationById: Map<string, { id: string; name: string }>;
  departmentById: Map<string, { id: string; organizationId: string; code: string; name: string; active: boolean }>;
  isKoLocale: boolean;
  runtimeLocale: string;
};

export function buildOrgTree(input: BuildOrgTreeInput): OrgTreeNode[] {
  const { filteredEmployees, organizationById, departmentById, isKoLocale, runtimeLocale } = input;
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
}

type BuildCompareRowsInput = {
  compareEmployeeA: Employee | null;
  compareEmployeeB: Employee | null;
  organizationById: Map<string, { id: string; name: string }>;
  departmentById: Map<string, { id: string; organizationId: string; code: string; name: string; active: boolean }>;
  positionById: Map<string, { id: string; organizationId: string; code: string; name: string; active: boolean }>;
  isKoLocale: boolean;
  runtimeLocale: string;
};

export function buildCompareRows(input: BuildCompareRowsInput): CompareRow[] {
  const {
    compareEmployeeA,
    compareEmployeeB,
    organizationById,
    departmentById,
    positionById,
    isKoLocale,
    runtimeLocale
  } = input;
  if (!compareEmployeeA || !compareEmployeeB) {
    return [];
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
}
