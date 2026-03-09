import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import { buildQuery } from "@/app/admin/people/page-helpers";
import { apiClientFetch, parseApiResponseBody } from "@/lib/api-client";
import type {
  ApiLog,
  Department,
  Employee,
  EmployeeHistory,
  Organization,
  Position
} from "@/app/admin/people/page-types";

type ApiMethod = "GET" | "PATCH";

type UseAdminPeopleDirectoryActionsInput = {
  isKoLocale: boolean;
  runtimeLocale: string;
  organizationId: string;
  historyLimit: string;
  selectedEmployeeId: string;
  editDepartmentId: string;
  editPositionId: string;
  editActive: string;
  supabaseSessionLoading: boolean;
  requiresLoginSession: boolean;
  logs: ApiLog[];
  setPendingLabel: Dispatch<SetStateAction<string | null>>;
  setLogs: Dispatch<SetStateAction<ApiLog[]>>;
  setOrganizations: Dispatch<SetStateAction<Organization[]>>;
  setDepartments: Dispatch<SetStateAction<Department[]>>;
  setPositions: Dispatch<SetStateAction<Position[]>>;
  setEmployees: Dispatch<SetStateAction<Employee[]>>;
  setHistory: Dispatch<SetStateAction<EmployeeHistory[]>>;
  setSelectedEmployeeId: Dispatch<SetStateAction<string>>;
};

export function useAdminPeopleDirectoryActions(input: UseAdminPeopleDirectoryActionsInput) {
  const {
    isKoLocale,
    runtimeLocale,
    organizationId,
    historyLimit,
    selectedEmployeeId,
    editDepartmentId,
    editPositionId,
    editActive,
    supabaseSessionLoading,
    requiresLoginSession,
    logs,
    setPendingLabel,
    setLogs,
    setOrganizations,
    setDepartments,
    setPositions,
    setEmployees,
    setHistory,
    setSelectedEmployeeId
  } = input;

  const sessionBlocked = supabaseSessionLoading || requiresLoginSession;

  const callApi = useCallback(
    async (label: string, method: ApiMethod, path: string, payload?: Record<string, unknown>) => {
      setPendingLabel(label);
      try {
        const response = await apiClientFetch({
          method,
          path,
          payload
        });
        const body = await parseApiResponseBody(response);
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
    },
    [runtimeLocale, setLogs, setPendingLabel]
  );

  const loadOrganizations = useCallback(async () => {
    if (sessionBlocked) return;
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
  }, [callApi, isKoLocale, sessionBlocked, setOrganizations]);

  const loadDepartments = useCallback(async () => {
    if (sessionBlocked) return;
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
  }, [callApi, isKoLocale, organizationId, sessionBlocked, setDepartments]);

  const loadPositions = useCallback(async () => {
    if (sessionBlocked) return;
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
  }, [callApi, isKoLocale, organizationId, sessionBlocked, setPositions]);

  const loadEmployees = useCallback(async () => {
    if (sessionBlocked) return;
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
  }, [callApi, isKoLocale, organizationId, selectedEmployeeId, sessionBlocked, setEmployees, setSelectedEmployeeId]);

  const refreshDirectory = useCallback(async () => {
    if (sessionBlocked) return;
    await loadOrganizations();
    await Promise.all([loadDepartments(), loadPositions(), loadEmployees()]);
  }, [loadDepartments, loadEmployees, loadOrganizations, loadPositions, sessionBlocked]);

  const loadSelectedEmployeeHistory = useCallback(
    async (employeeId: string) => {
      if (sessionBlocked) return;
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
    },
    [callApi, historyLimit, isKoLocale, sessionBlocked, setHistory]
  );

  const applySelectedProfileUpdate = useCallback(async () => {
    if (sessionBlocked) return;
    if (!selectedEmployeeId.trim()) {
      return;
    }
    const confirmationMessage = isKoLocale
      ? "직원 프로필 변경사항을 저장할까요? 변경 후에는 인사 이력에 바로 반영됩니다."
      : "Save these employee profile changes now? The update will be written to HR history immediately.";
    if (typeof window !== "undefined" && !window.confirm(confirmationMessage)) {
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
  }, [
    callApi,
    editActive,
    editDepartmentId,
    editPositionId,
    isKoLocale,
    loadEmployees,
    loadSelectedEmployeeHistory,
    sessionBlocked,
    selectedEmployeeId
  ]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  return {
    loadOrganizations,
    loadDepartments,
    loadPositions,
    loadEmployees,
    refreshDirectory,
    loadSelectedEmployeeHistory,
    applySelectedProfileUpdate,
    stats
  };
}
