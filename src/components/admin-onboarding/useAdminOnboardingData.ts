import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  AdminOnboardingActionLog,
  AdminOnboardingDepartmentOption,
  AdminOnboardingOrganizationOption
} from "@/components/admin-onboarding/AdminOnboardingSections";
import {
  buildQuery,
  isTruthyFlag,
  normalizeInt,
  parseArray,
  parseDepartmentSeedInput,
  parseEmployeeSeedInput,
  safeParseBody
} from "@/components/admin-onboarding/helpers";
import {
  buildOnboardingChecklist,
  onboardingProgressPercent
} from "@/features/admin-onboarding/checklist";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type OrganizationLite = { id: string; name: string };
type DepartmentLite = { id: string; code: string; name: string };
type EmployeeLite = { id: string };
type LeavePolicyLite = {
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay: boolean;
  allowHourly: boolean;
  hourlyIncrementMinutes: number;
  maxHoursPerRequest: number;
  source: "configured" | "default";
};

type UseAdminOnboardingDataInput = {
  loadingLabel: string;
  runtimeLocale: string;
  requestLabels: {
    organizations: string;
    departments: string;
    employees: string;
    leavePolicy: string;
    createDepartmentPrefix: string;
    createEmployeePrefix: string;
    upsertLeavePolicy: string;
  };
};

export function useAdminOnboardingData(input: UseAdminOnboardingDataInput) {
  const [organizations, setOrganizations] = useState<AdminOnboardingOrganizationOption[]>([]);
  const [departments, setDepartments] = useState<AdminOnboardingDepartmentOption[]>([]);
  const [activeEmployeeCount, setActiveEmployeeCount] = useState(0);
  const [leavePolicyConfigured, setLeavePolicyConfigured] = useState(false);

  const [departmentSeedInput, setDepartmentSeedInput] = useState("HR,Human Resources\nDEV,Development");
  const [employeeSeedInput, setEmployeeSeedInput] = useState(
    "EMP-2001,Jane,jane@example.com,HR\nEMP-2002,Alex,alex@example.com,DEV"
  );

  const [annualGrantDays, setAnnualGrantDays] = useState("15");
  const [carryOverCapDays, setCarryOverCapDays] = useState("5");
  const [allowHalfDay, setAllowHalfDay] = useState(true);
  const [allowHourly, setAllowHourly] = useState(true);
  const [hourlyIncrementMinutes, setHourlyIncrementMinutes] = useState("30");
  const [maxHoursPerRequest, setMaxHoursPerRequest] = useState("8");

  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [logs, setLogs] = useState<AdminOnboardingActionLog[]>([]);

  const { snapshot: supabaseSession } = useSupabaseSession();
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";
  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const requestJson = useCallback(
    async (label: string, path: string, options?: { method?: string; body?: unknown }) => {
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

      const method = options?.method ?? "GET";
      if (options?.body !== undefined) {
        headers["content-type"] = "application/json";
      }

      const response = await fetch(path, {
        method,
        headers,
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined
      });
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
    [adminActorId, bearerToken, input.runtimeLocale, organizationId, usesBearerToken]
  );

  const loadSetup = useCallback(async () => {
    if (!usesBearerToken && !organizationId.trim()) {
      return;
    }

    setPendingLabel(input.loadingLabel);
    try {
      let organizationRows: OrganizationLite[] = [];
      try {
        const organizationsBody = await requestJson(
          input.requestLabels.organizations,
          "/api/people/organizations"
        );
        organizationRows = parseArray<OrganizationLite>(organizationsBody, "organizations");
      } catch {
        organizationRows = [];
      }

      setOrganizations(organizationRows.map((row) => ({ id: row.id, name: row.name })));

      const targetOrganizationId =
        organizationId.trim() || (organizationRows.length === 1 ? organizationRows[0].id : "");
      if (!targetOrganizationId) {
        setDepartments([]);
        setActiveEmployeeCount(0);
        setLeavePolicyConfigured(false);
        return;
      }

      const orgQuery = buildQuery({ organizationId: targetOrganizationId });
      const [departmentsBody, employeesBody, leavePolicyBody] = await Promise.all([
        requestJson(input.requestLabels.departments, `/api/people/departments${orgQuery}`),
        requestJson(
          input.requestLabels.employees,
          `/api/people/employees${buildQuery({
            ...{ organizationId: targetOrganizationId },
            active: "true"
          })}`
        ),
        requestJson(input.requestLabels.leavePolicy, `/api/leave/policy${orgQuery}`)
      ]);

      const departmentRows = parseArray<DepartmentLite>(departmentsBody, "departments");
      const employeeRows = parseArray<EmployeeLite>(employeesBody, "employees");
      const policy = ((leavePolicyBody as { policy?: LeavePolicyLite })?.policy ?? null) as
        | LeavePolicyLite
        | null;

      setDepartments(departmentRows.map((row) => ({ id: row.id, code: row.code, name: row.name })));
      setActiveEmployeeCount(employeeRows.length);

      if (policy) {
        setAnnualGrantDays(String(policy.annualGrantDays));
        setCarryOverCapDays(String(policy.carryOverCapDays));
        setAllowHalfDay(policy.allowHalfDay);
        setAllowHourly(policy.allowHourly);
        setHourlyIncrementMinutes(String(policy.hourlyIncrementMinutes));
        setMaxHoursPerRequest(String(policy.maxHoursPerRequest));
        setLeavePolicyConfigured(policy.source === "configured");
      }
    } finally {
      setPendingLabel(null);
    }
  }, [
    input.loadingLabel,
    input.requestLabels.departments,
    input.requestLabels.employees,
    input.requestLabels.leavePolicy,
    input.requestLabels.organizations,
    organizationId,
    requestJson,
    usesBearerToken
  ]);

  useEffect(() => {
    void loadSetup();
  }, [loadSetup]);

  const checklistItems = useMemo(
    () =>
      buildOnboardingChecklist({
        organizationId,
        departmentCount: departments.length,
        employeeCount: activeEmployeeCount,
        leavePolicyConfigured
      }),
    [activeEmployeeCount, departments.length, leavePolicyConfigured, organizationId]
  );
  const progressPercent = useMemo(() => onboardingProgressPercent(checklistItems), [checklistItems]);

  const applyDepartments = useCallback(async () => {
    const targetOrganizationId = organizationId.trim();
    if (!targetOrganizationId) {
      return;
    }
    for (const draft of parseDepartmentSeedInput(departmentSeedInput)) {
      await requestJson(`${input.requestLabels.createDepartmentPrefix} ${draft.code}`, "/api/people/departments", {
        method: "POST",
        body: {
          organizationId: targetOrganizationId,
          code: draft.code,
          name: draft.name,
          active: true
        }
      });
    }
    await loadSetup();
  }, [departmentSeedInput, input.requestLabels.createDepartmentPrefix, loadSetup, organizationId, requestJson]);

  const applyEmployees = useCallback(async () => {
    const targetOrganizationId = organizationId.trim();
    if (!targetOrganizationId) {
      return;
    }
    const departmentIdByCode = new Map(departments.map((row) => [row.code.toLowerCase(), row.id] as const));
    for (const draft of parseEmployeeSeedInput(employeeSeedInput)) {
      const departmentId = draft.departmentCode
        ? (departmentIdByCode.get(draft.departmentCode.toLowerCase()) ?? null)
        : null;
      await requestJson(`${input.requestLabels.createEmployeePrefix} ${draft.id}`, "/api/people/employees", {
        method: "POST",
        body: {
          id: draft.id,
          name: draft.name,
          email: draft.email,
          organizationId: targetOrganizationId,
          departmentId,
          active: true
        }
      });
    }
    await loadSetup();
  }, [
    departments,
    employeeSeedInput,
    input.requestLabels.createEmployeePrefix,
    loadSetup,
    organizationId,
    requestJson
  ]);

  const applyLeavePolicy = useCallback(async () => {
    const targetOrganizationId = organizationId.trim();
    if (!targetOrganizationId) {
      return;
    }
    await requestJson(input.requestLabels.upsertLeavePolicy, "/api/leave/policy", {
      method: "PUT",
      body: {
        organizationId: targetOrganizationId,
        annualGrantDays: normalizeInt(annualGrantDays, 15, 1),
        carryOverCapDays: normalizeInt(carryOverCapDays, 5, 0),
        allowHalfDay,
        allowHourly,
        hourlyIncrementMinutes: normalizeInt(hourlyIncrementMinutes, 30, 15),
        maxHoursPerRequest: normalizeInt(maxHoursPerRequest, 8, 1)
      }
    });
    await loadSetup();
  }, [
    allowHalfDay,
    allowHourly,
    annualGrantDays,
    carryOverCapDays,
    hourlyIncrementMinutes,
    loadSetup,
    maxHoursPerRequest,
    organizationId,
    requestJson,
    input.requestLabels.upsertLeavePolicy
  ]);

  const refreshDisabled =
    Boolean(pendingLabel) || (!usesBearerToken && !organizationId.trim() && !showDevTools);

  return {
    activeEmployeeCount,
    adminActorId,
    allowHalfDay,
    allowHourly,
    annualGrantDays,
    applyDepartments,
    applyEmployees,
    applyLeavePolicy,
    carryOverCapDays,
    checklistItems,
    departmentSeedInput,
    departments,
    employeeSeedInput,
    hourlyIncrementMinutes,
    isProductionRuntime,
    leavePolicyConfigured,
    loadSetup,
    logs,
    maxHoursPerRequest,
    organizationId,
    organizations,
    pendingLabel,
    progressPercent,
    refreshDisabled,
    setAllowHalfDay,
    setAllowHourly,
    setAnnualGrantDays,
    setCarryOverCapDays,
    setDepartmentSeedInput,
    setEmployeeSeedInput,
    setHourlyIncrementMinutes,
    setMaxHoursPerRequest,
    showDevTools,
    usesBearerToken
  };
}
