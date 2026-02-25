import Link from "next/link";

import {
  actionLabel,
  changeHighlightClass,
  formatDateTime
} from "@/app/admin/people/page-helpers";
import {
  type ActiveFilter,
  type ApiLog,
  type CompareRow,
  type Department,
  type Employee,
  type EmployeeHistory,
  type HistoryChangeSummaryItem,
  type HistoryEntryChange,
  type OrgTreeNode,
  type Organization,
  type Position,
  type ProfileField,
  type UpdatedWindow
} from "@/app/admin/people/page-types";

type AdminPeoplePageViewProps = {
  isKoLocale: boolean;
  runtimeLocale: string;
  organizations: Organization[];
  departments: Department[];
  positions: Position[];
  employees: Employee[];
  filteredEmployees: Employee[];
  tree: OrgTreeNode[];
  stats: { total: number; success: number; fail: number };
  refreshDirectory: () => Promise<void>;
  organizationId: string;
  setOrganizationId: (value: string) => void;
  adminActorId: string;
  setAdminActorId: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  activeFilter: ActiveFilter;
  setActiveFilter: (value: ActiveFilter) => void;
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  positionFilter: string;
  setPositionFilter: (value: string) => void;
  recentlyUpdatedDays: UpdatedWindow;
  setRecentlyUpdatedDays: (value: UpdatedWindow) => void;
  historyLimit: string;
  setHistoryLimit: (value: string) => void;
  showDevTools: boolean;
  accessToken: string;
  setAccessToken: (value: string) => void;
  loadOrganizations: () => Promise<void>;
  loadDepartments: () => Promise<void>;
  loadPositions: () => Promise<void>;
  loadEmployees: () => Promise<void>;
  resetDirectoryFilters: () => void;
  supabaseSessionError: string | null;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (value: string) => void;
  loadSelectedEmployeeHistory: (employeeId: string) => Promise<void>;
  compareA: string;
  setCompareA: (value: string) => void;
  compareB: string;
  setCompareB: (value: string) => void;
  compareRows: CompareRow[];
  compareEmployeeA: Employee | null;
  compareEmployeeB: Employee | null;
  selectedEmployee: Employee | null;
  editDepartmentId: string;
  setEditDepartmentId: (value: string) => void;
  editPositionId: string;
  setEditPositionId: (value: string) => void;
  editActive: string;
  setEditActive: (value: string) => void;
  selectedDepartments: Department[];
  selectedPositions: Position[];
  applySelectedProfileUpdate: () => Promise<void>;
  history: EmployeeHistory[];
  historyChangeSummary: HistoryChangeSummaryItem[];
  historyChanges: (entry: EmployeeHistory) => HistoryEntryChange[];
  profileFieldLabel: Record<ProfileField, string>;
  logs: ApiLog[];
  pendingLabel: string | null;
};

export function AdminPeoplePageView({
  isKoLocale,
  runtimeLocale,
  organizations,
  departments,
  positions,
  employees,
  filteredEmployees,
  tree,
  stats,
  refreshDirectory,
  organizationId,
  setOrganizationId,
  adminActorId,
  setAdminActorId,
  search,
  setSearch,
  activeFilter,
  setActiveFilter,
  departmentFilter,
  setDepartmentFilter,
  positionFilter,
  setPositionFilter,
  recentlyUpdatedDays,
  setRecentlyUpdatedDays,
  historyLimit,
  setHistoryLimit,
  showDevTools,
  accessToken,
  setAccessToken,
  loadOrganizations,
  loadDepartments,
  loadPositions,
  loadEmployees,
  resetDirectoryFilters,
  supabaseSessionError,
  selectedEmployeeId,
  setSelectedEmployeeId,
  loadSelectedEmployeeHistory,
  compareA,
  setCompareA,
  compareB,
  setCompareB,
  compareRows,
  compareEmployeeA,
  compareEmployeeB,
  selectedEmployee,
  editDepartmentId,
  setEditDepartmentId,
  editPositionId,
  setEditPositionId,
  editActive,
  setEditActive,
  selectedDepartments,
  selectedPositions,
  applySelectedProfileUpdate,
  history,
  historyChangeSummary,
  historyChanges,
  profileFieldLabel,
  logs,
  pendingLabel
}: AdminPeoplePageViewProps) {
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
            {isKoLocale ? "필터 요약" : "Filter summary"}: {isKoLocale ? "부서" : "dept"}=
            {departmentFilter || (isKoLocale ? "전체" : "all")} / {isKoLocale ? "직급" : "position"}=
            {positionFilter || (isKoLocale ? "전체" : "all")} / {isKoLocale ? "최근 업데이트" : "updated"}=
            {recentlyUpdatedDays}
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
                {isKoLocale ? "선택 직원" : "Selected employee"}: <strong>{selectedEmployee.id}</strong> · {isKoLocale ? "최근 업데이트" : "Last updated"}{" "}
                {formatDateTime(selectedEmployee.updatedAt, runtimeLocale)}
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
