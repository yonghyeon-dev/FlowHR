import { useMemo, useState } from "react";

import { type Employee, type OrgTreeNode } from "@/app/admin/people/page-types";

type AdminPeopleOrgChartPanelProps = {
  isKoLocale: boolean;
  tree: OrgTreeNode[];
  selectedEmployeeId: string;
  setSelectedEmployeeId: (value: string) => void;
  loadSelectedEmployeeHistory: (employeeId: string) => Promise<void>;
};

type OrgChartFocusMode = "all" | "inactive" | "unassigned";

type OrgChartSummary = {
  organizations: number;
  departments: number;
  employees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  unassignedEmployees: number;
  unassignedOrganizationEmployees: number;
  unassignedDepartmentEmployees: number;
};

function isUnassignedNode(organizationKey: string, departmentKey: string) {
  return organizationKey === "__none__" || departmentKey === "__none__";
}

function resolveEmployeeActiveLabel(isKoLocale: boolean, active: boolean) {
  if (active) {
    return isKoLocale ? "활성" : "Active";
  }
  return isKoLocale ? "비활성" : "Inactive";
}

function buildOrgChartSummary(tree: OrgTreeNode[]): OrgChartSummary {
  const organizations = tree.length;
  let departments = 0;
  let employees = 0;
  let activeEmployees = 0;
  let inactiveEmployees = 0;
  let unassignedOrganizationEmployees = 0;
  let unassignedDepartmentEmployees = 0;
  const unassignedEmployeeIds = new Set<string>();

  for (const organization of tree) {
    for (const department of organization.departments) {
      departments += 1;
      employees += department.employees.length;

      for (const employee of department.employees) {
        if (employee.active) {
          activeEmployees += 1;
        } else {
          inactiveEmployees += 1;
        }
        if (isUnassignedNode(organization.orgKey, department.deptKey)) {
          unassignedEmployeeIds.add(employee.id);
        }
      }

      if (organization.orgKey === "__none__") {
        unassignedOrganizationEmployees += department.employees.length;
      }
      if (department.deptKey === "__none__") {
        unassignedDepartmentEmployees += department.employees.length;
      }
    }
  }

  return {
    organizations,
    departments,
    employees,
    activeEmployees,
    inactiveEmployees,
    unassignedEmployees: unassignedEmployeeIds.size,
    unassignedOrganizationEmployees,
    unassignedDepartmentEmployees
  };
}

function filterByFocusMode(
  employees: Employee[],
  focusMode: OrgChartFocusMode,
  organizationKey: string,
  departmentKey: string
) {
  if (focusMode === "all") {
    return employees;
  }
  if (focusMode === "inactive") {
    return employees.filter((employee) => !employee.active);
  }
  return isUnassignedNode(organizationKey, departmentKey) ? employees : [];
}

function renderEmployeePill(input: {
  isKoLocale: boolean;
  employee: Employee;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (value: string) => void;
  loadSelectedEmployeeHistory: (employeeId: string) => Promise<void>;
}) {
  const { isKoLocale, employee, selectedEmployeeId, setSelectedEmployeeId, loadSelectedEmployeeHistory } = input;
  return (
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
          {employee.id} / {resolveEmployeeActiveLabel(isKoLocale, employee.active)}
        </span>
      </button>
    </li>
  );
}

export function AdminPeopleOrgChartPanel({
  isKoLocale,
  tree,
  selectedEmployeeId,
  setSelectedEmployeeId,
  loadSelectedEmployeeHistory
}: AdminPeopleOrgChartPanelProps) {
  const [focusMode, setFocusMode] = useState<OrgChartFocusMode>("all");
  const summary = buildOrgChartSummary(tree);
  const focusCountByMode: Record<OrgChartFocusMode, number> = {
    all: summary.employees,
    inactive: summary.inactiveEmployees,
    unassigned: summary.unassignedEmployees
  };
  const visibleTree = useMemo(() => {
    return tree
      .map((organization) => ({
        ...organization,
        departments: organization.departments
          .map((department) => ({
            ...department,
            employees: filterByFocusMode(department.employees, focusMode, organization.orgKey, department.deptKey)
          }))
          .filter((department) => department.employees.length > 0)
      }))
      .filter((organization) => organization.departments.length > 0);
  }, [focusMode, tree]);

  return (
    <article className="panel panel-org-chart">
      <h2>{isKoLocale ? "조직도 트리" : "Organization chart"}</h2>
      <div className="panel-actions">
        {(["all", "inactive", "unassigned"] as OrgChartFocusMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`btn ${focusMode === mode ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFocusMode(mode)}
          >
            {mode === "all"
              ? isKoLocale
                ? "전체"
                : "All"
              : mode === "inactive"
                ? isKoLocale
                  ? "비활성"
                  : "Inactive"
                : isKoLocale
                  ? "미지정"
                  : "Unassigned"} {focusCountByMode[mode]}
          </button>
        ))}
      </div>
      <ul className="simple-list">
        <li><span>{isKoLocale ? "조직 / 부서" : "Organizations / Departments"}</span><strong>{summary.organizations} / {summary.departments}</strong></li>
        <li><span>{isKoLocale ? "직원 (활성/비활성)" : "Employees (active/inactive)"}</span><strong>{summary.employees} ({summary.activeEmployees} / {summary.inactiveEmployees})</strong></li>
        <li><span>{isKoLocale ? "미지정 조직/부서" : "Unassigned org/department"}</span><strong>{summary.unassignedOrganizationEmployees} / {summary.unassignedDepartmentEmployees}</strong></li>
      </ul>
      {visibleTree.length === 0 ? (
        <p className="small muted">
          {isKoLocale ? "현재 필터 조건에 해당하는 직원이 없습니다." : "No employee matches the current focus filter."}
        </p>
      ) : (
        <ul className="org-chart-list" aria-label={isKoLocale ? "조직도 트리" : "Organization chart"}>
          {visibleTree.map((organization) => (
            <li key={organization.orgKey} className="org-chart-organization">
              <div className="org-chart-org-head">
                <strong>{organization.orgName}</strong>
                {organization.orgKey === "__none__" ? <span className="small muted">{isKoLocale ? "미지정 조직" : "Unassigned organization"}</span> : null}
              </div>
              <ul className="org-chart-department-list">
                {organization.departments.map((department) => {
                  const activeEmployees = department.employees.filter((employee) => employee.active).length;
                  const inactiveEmployees = department.employees.length - activeEmployees;
                  return (
                    <li key={`${organization.orgKey}-${department.deptKey}`}>
                      <div className="org-chart-dept-head">
                        <span>{department.deptName}</span>
                        <span className="muted">{department.employees.length}{isKoLocale ? "명" : " employees"} · {isKoLocale ? "활성" : "Active"} {activeEmployees} / {isKoLocale ? "비활성" : "Inactive"} {inactiveEmployees}</span>
                      </div>
                      {department.deptKey === "__none__" ? <p className="small muted">{isKoLocale ? "부서 미지정 직원" : "Department unassigned employees"}</p> : null}
                      <ul className="org-chart-employee-list">
                        {department.employees.map((employee) =>
                          renderEmployeePill({
                            isKoLocale,
                            employee,
                            selectedEmployeeId,
                            setSelectedEmployeeId,
                            loadSelectedEmployeeHistory
                          })
                        )}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
