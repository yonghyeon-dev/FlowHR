import { type Employee, type OrgTreeNode } from "@/app/admin/people/page-types";

type AdminPeopleOrgChartPanelProps = {
  isKoLocale: boolean;
  tree: OrgTreeNode[];
  selectedEmployeeId: string;
  setSelectedEmployeeId: (value: string) => void;
  loadSelectedEmployeeHistory: (employeeId: string) => Promise<void>;
};

function resolveEmployeeActiveLabel(isKoLocale: boolean, active: boolean) {
  if (active) {
    return isKoLocale ? "활성" : "Active";
  }
  return isKoLocale ? "비활성" : "Inactive";
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
  return (
    <article className="panel panel-org-chart">
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
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
