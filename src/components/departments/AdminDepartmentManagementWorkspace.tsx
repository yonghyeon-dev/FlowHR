"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type DepartmentItem = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  active: boolean;
  parentId: string | null;
  managerId: string | null;
};

type EmployeeItem = {
  id: string;
  organizationId: string | null;
  departmentId: string | null;
  name: string | null;
  email: string | null;
  active: boolean;
};

type ApiEnvelope = {
  error?: string;
  departments?: DepartmentItem[];
  employees?: EmployeeItem[];
  department?: DepartmentItem;
};

function buildQuery(input: Record<string, string>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value.trim().length > 0) {
      query.set(key, value.trim());
    }
  }
  const encoded = query.toString();
  return encoded.length > 0 ? `?${encoded}` : "";
}

export default function AdminDepartmentManagementWorkspace() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const { snapshot: supabaseSession } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const actorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";
  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [formManagerId, setFormManagerId] = useState("");

  const departmentById = useMemo(
    () => new Map(departments.map((department) => [department.id, department] as const)),
    [departments]
  );
  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee] as const)),
    [employees]
  );
  const employeeCountByDepartmentId = useMemo(() => {
    const counters = new Map<string, number>();
    for (const employee of employees) {
      if (!employee.departmentId) {
        continue;
      }
      counters.set(employee.departmentId, (counters.get(employee.departmentId) ?? 0) + 1);
    }
    return counters;
  }, [employees]);

  const parentDepartmentOptions = useMemo(() => {
    const editingId = editingDepartmentId;
    return departments.filter((department) => department.id !== editingId);
  }, [departments, editingDepartmentId]);
  const managerOptions = useMemo(() => {
    return employees.filter((employee) => employee.active);
  }, [employees]);

  const callApi = useCallback(
    async (
      action: string,
      method: "GET" | "POST" | "PATCH" | "DELETE",
      path: string,
      payload?: Record<string, unknown>
    ) => {
      setPendingLabel(action);
      try {
        const headers: Record<string, string> = payload ? { "content-type": "application/json" } : {};
        if (usesBearerToken) {
          headers.authorization = `Bearer ${bearerToken}`;
        } else {
          headers["x-actor-role"] = "admin";
          headers["x-actor-id"] = actorId;
          headers["x-actor-organization-id"] = organizationId;
        }
        const response = await fetch(path, {
          method,
          headers,
          body: payload ? JSON.stringify(payload) : undefined
        });
        const text = await response.text();
        const parsed = text.trim().length > 0 ? (JSON.parse(text) as ApiEnvelope) : {};
        return { response, parsed };
      } finally {
        setPendingLabel(null);
      }
    },
    [actorId, bearerToken, organizationId, usesBearerToken]
  );

  const loadWorkspace = useCallback(async () => {
    if (!organizationId && !usesBearerToken) {
      setStatusMessage(
        isKoLocale
          ? "조직 컨텍스트가 필요합니다. 세션 또는 x-actor-organization-id를 확인해 주세요."
          : "Organization context is required. Check session or x-actor-organization-id."
      );
      return;
    }

    const query = buildQuery({ organizationId });
    const [departmentResult, employeeResult] = await Promise.all([
      callApi(
        isKoLocale ? "부서 목록 조회" : "Load departments",
        "GET",
        `/api/people/departments${query}`
      ),
      callApi(
        isKoLocale ? "직원 목록 조회" : "Load employees",
        "GET",
        `/api/people/employees${query}`
      )
    ]);

    if (!departmentResult.response.ok || !employeeResult.response.ok) {
      setStatusMessage(
        isKoLocale ? "부서/직원 데이터를 불러오지 못했습니다." : "Failed to load departments/employees."
      );
      return;
    }

    setDepartments(Array.isArray(departmentResult.parsed.departments) ? departmentResult.parsed.departments : []);
    setEmployees(Array.isArray(employeeResult.parsed.employees) ? employeeResult.parsed.employees : []);
    setStatusMessage("");
  }, [callApi, isKoLocale, organizationId, usesBearerToken]);

  useEffect(() => {
    if (autoLoadAttempted || (!organizationId && !usesBearerToken)) {
      return;
    }
    setAutoLoadAttempted(true);
    void loadWorkspace();
  }, [autoLoadAttempted, loadWorkspace, organizationId, usesBearerToken]);

  function resetFormState() {
    setEditingDepartmentId(null);
    setFormName("");
    setFormParentId("");
    setFormManagerId("");
  }

  function openCreateModal() {
    resetFormState();
    setIsFormOpen(true);
  }

  function openEditModal(department: DepartmentItem) {
    setEditingDepartmentId(department.id);
    setFormName(department.name);
    setFormParentId(department.parentId ?? "");
    setFormManagerId(department.managerId ?? "");
    setIsFormOpen(true);
  }

  function closeModal() {
    setIsFormOpen(false);
    resetFormState();
  }

  async function submitDepartment() {
    const normalizedName = formName.trim();
    if (!normalizedName) {
      setStatusMessage(isKoLocale ? "부서 이름을 입력해 주세요." : "Department name is required.");
      return;
    }

    if (editingDepartmentId) {
      const updateResult = await callApi(
        isKoLocale ? "부서 수정" : "Update department",
        "PATCH",
        `/api/people/departments/${encodeURIComponent(editingDepartmentId)}`,
        {
          name: normalizedName,
          parentId: formParentId.trim() ? formParentId.trim() : null,
          managerId: formManagerId.trim() ? formManagerId.trim() : null
        }
      );

      if (!updateResult.response.ok) {
        setStatusMessage(
          updateResult.parsed.error ??
            (isKoLocale ? "부서 수정에 실패했습니다." : "Failed to update department.")
        );
        return;
      }

      setStatusMessage(isKoLocale ? "부서를 수정했습니다." : "Department updated.");
      closeModal();
      await loadWorkspace();
      return;
    }

    const createResult = await callApi(
      isKoLocale ? "부서 생성" : "Create department",
      "POST",
      "/api/people/departments",
      {
        name: normalizedName,
        parentId: formParentId.trim() ? formParentId.trim() : undefined,
        managerId: formManagerId.trim() ? formManagerId.trim() : undefined
      }
    );

    if (!createResult.response.ok) {
      setStatusMessage(
        createResult.parsed.error ??
          (isKoLocale ? "부서 생성에 실패했습니다." : "Failed to create department.")
      );
      return;
    }

    setStatusMessage(isKoLocale ? "부서를 생성했습니다." : "Department created.");
    closeModal();
    await loadWorkspace();
  }

  async function deleteDepartment(department: DepartmentItem) {
    const shouldDelete = window.confirm(
      isKoLocale
        ? `부서 "${department.name}"를 삭제하시겠습니까?`
        : `Delete "${department.name}" department?`
    );
    if (!shouldDelete) {
      return;
    }

    const deleteResult = await callApi(
      isKoLocale ? "부서 삭제" : "Delete department",
      "DELETE",
      `/api/people/departments/${encodeURIComponent(department.id)}`
    );

    if (!deleteResult.response.ok) {
      setStatusMessage(
        deleteResult.parsed.error ??
          (isKoLocale ? "부서 삭제에 실패했습니다." : "Failed to delete department.")
      );
      return;
    }

    setStatusMessage(isKoLocale ? "부서를 삭제했습니다." : "Department deleted.");
    await loadWorkspace();
  }

  function employeeLabel(employeeId: string | null) {
    if (!employeeId) {
      return "-";
    }
    const employee = employeeById.get(employeeId);
    if (!employee) {
      return employeeId;
    }
    if (employee.name && employee.name.trim().length > 0) {
      return `${employee.name} (${employee.id})`;
    }
    return employee.id;
  }

  return (
    <section id="departments" className="saas-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isKoLocale ? "부서 관리" : "Department Management"}
          </h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "부서를 생성/조회/수정/삭제하고 상위 부서와 매니저를 설정합니다."
              : "Create, list, update, and delete departments with parent and manager settings."}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={() => void loadWorkspace()}>
            {isKoLocale ? "새로고침" : "Refresh"}
          </button>
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            {isKoLocale ? "부서 추가" : "Add Department"}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>{isKoLocale ? "이름" : "Name"}</th>
                <th>{isKoLocale ? "상위 부서" : "Parent Department"}</th>
                <th>{isKoLocale ? "매니저" : "Manager"}</th>
                <th>{isKoLocale ? "직원 수" : "Employee Count"}</th>
                <th>{isKoLocale ? "작업" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    {isKoLocale ? "등록된 부서가 없습니다." : "No departments found."}
                  </td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr key={department.id}>
                    <td>{department.name}</td>
                    <td>{department.parentId ? (departmentById.get(department.parentId)?.name ?? department.parentId) : "-"}</td>
                    <td>{employeeLabel(department.managerId)}</td>
                    <td>{employeeCountByDepartmentId.get(department.id) ?? 0}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-secondary btn-small"
                          type="button"
                          onClick={() => openEditModal(department)}
                        >
                          {isKoLocale ? "수정" : "Edit"}
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          type="button"
                          onClick={() => void deleteDepartment(department)}
                        >
                          {isKoLocale ? "삭제" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pendingLabel ? <p className="small muted">{pendingLabel}...</p> : null}
        {statusMessage ? <p className="small muted">{statusMessage}</p> : null}
      </div>

      {isFormOpen ? (
        <div className="approval-reject-modal-backdrop" role="dialog" aria-modal="true">
          <div className="approval-reject-modal">
            <h3>{editingDepartmentId ? (isKoLocale ? "부서 수정" : "Edit Department") : (isKoLocale ? "부서 추가" : "Add Department")}</h3>
            <label>
              {isKoLocale ? "이름" : "Name"}
              <input
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder={isKoLocale ? "예: 플랫폼팀" : "e.g. Platform Team"}
              />
            </label>
            <label>
              {isKoLocale ? "상위 부서" : "Parent Department"}
              <select value={formParentId} onChange={(event) => setFormParentId(event.target.value)}>
                <option value="">{isKoLocale ? "없음" : "None"}</option>
                {parentDepartmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {isKoLocale ? "매니저" : "Manager"}
              <select value={formManagerId} onChange={(event) => setFormManagerId(event.target.value)}>
                <option value="">{isKoLocale ? "미지정" : "Unassigned"}</option>
                {managerOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employeeLabel(employee.id)}
                  </option>
                ))}
              </select>
            </label>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button" onClick={closeModal}>
                {isKoLocale ? "취소" : "Cancel"}
              </button>
              <button className="btn btn-primary" type="button" onClick={() => void submitDepartment()}>
                {editingDepartmentId ? (isKoLocale ? "저장" : "Save") : (isKoLocale ? "생성" : "Create")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
