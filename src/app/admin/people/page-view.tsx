import Link from "next/link";
import { AdminPeopleComparePanel } from "@/app/admin/people/page-view-compare-panel";
import { AdminPeopleDirectoryFiltersPanel } from "@/app/admin/people/page-view-directory-filters-panel";
import { AdminPeopleHistoryPanel } from "@/app/admin/people/page-view-history-panel";
import { AdminPeopleLogsPanel } from "@/app/admin/people/page-view-logs-panel";
import { AdminPeopleOrgChartPanel } from "@/app/admin/people/page-view-org-chart-panel";
import { AdminPeopleRelatedWorkspacesPanel } from "@/app/admin/people/page-view-related-workspaces-panel";
import {
  type ActiveFilter,
  type ApiLog,
  type CompareRow,
  type Department,
  type Employee,
  type EmployeeHistory,
  type HistoryActionFilter,
  type HistoryChangeSummaryItem,
  type HistoryEntryChange,
  type HistoryFieldFilter,
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
  adminActorId: string;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
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
  filteredHistory: EmployeeHistory[];
  historyActionFilter: HistoryActionFilter;
  setHistoryActionFilter: (value: HistoryActionFilter) => void;
  historyFieldFilter: HistoryFieldFilter;
  setHistoryFieldFilter: (value: HistoryFieldFilter) => void;
  historyChangeSummary: HistoryChangeSummaryItem[];
  historyChanges: (entry: EmployeeHistory) => HistoryEntryChange[];
  profileFieldLabel: Record<ProfileField, string>;
  logs: ApiLog[];
  pendingLabel: string | null;
  showDevTools: boolean;
};

export function AdminPeoplePageView(props: AdminPeoplePageViewProps) {
  const {
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
    adminActorId,
    isProductionRuntime,
    usesBearerToken,
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
    filteredHistory,
    historyActionFilter,
    setHistoryActionFilter,
    historyFieldFilter,
    setHistoryFieldFilter,
    historyChangeSummary,
    historyChanges,
    profileFieldLabel,
    logs,
    pendingLabel,
    showDevTools
  } = props;
  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{isKoLocale ? "조직???�사 ?�력" : "Organization chart and HR history"}</h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "조직?? 직원 비교, ?�사 ?�력 카드�????�면?�서 관리합?�다."
              : "Manage org tree, employee comparison, and HR history cards in one screen."}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => void refreshDirectory()}>
            {isKoLocale ? "?�렉?�리 조회" : "Refresh directory"}
          </button>
          <Link className="btn btn-secondary" href="/admin">
            {isKoLocale ? "Admin dashboard" : "Admin dashboard"}
          </Link>
        </div>
      </header>
      <section className="kpi-strip">
        <article className="kpi-card">
          <p>{isKoLocale ? "조직" : "Organizations"}</p>
          <strong>{organizations.length}</strong>
        </article>
        <article className="kpi-card">
          <p>{isKoLocale ? "Departments" : "Departments"}</p>
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
          <p>{isKoLocale ? "API ?�출" : "API calls"}</p>
          <strong>
            {stats.total} ({isKoLocale ? "?�공" : "OK"} {stats.success} / {isKoLocale ? "?�패" : "FAIL"} {stats.fail})
          </strong>
        </article>
      </section>
      <section className="panel-grid">
        <section id="directory-filters">
          <AdminPeopleDirectoryFiltersPanel
            isKoLocale={isKoLocale}
            organizationId={organizationId}
            adminActorId={adminActorId}
            isProductionRuntime={isProductionRuntime}
            usesBearerToken={usesBearerToken}
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
            loadOrganizations={loadOrganizations}
            loadDepartments={loadDepartments}
            loadPositions={loadPositions}
            loadEmployees={loadEmployees}
            resetDirectoryFilters={resetDirectoryFilters}
            departments={departments}
            positions={positions}
            supabaseSessionError={supabaseSessionError}
          />
        </section>

        <section id="org-chart">
          <AdminPeopleOrgChartPanel
            isKoLocale={isKoLocale}
            tree={tree}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
            loadSelectedEmployeeHistory={loadSelectedEmployeeHistory}
          />
        </section>

        <section id="employee-compare">
          <AdminPeopleComparePanel
            isKoLocale={isKoLocale}
            compareA={compareA}
            setCompareA={setCompareA}
            compareB={compareB}
            setCompareB={setCompareB}
            filteredEmployees={filteredEmployees}
            compareRows={compareRows}
            compareEmployeeA={compareEmployeeA}
            compareEmployeeB={compareEmployeeB}
          />
        </section>

        <section id="employee-history">
          <AdminPeopleHistoryPanel
            isKoLocale={isKoLocale}
            runtimeLocale={runtimeLocale}
            selectedEmployee={selectedEmployee}
            editDepartmentId={editDepartmentId}
            setEditDepartmentId={setEditDepartmentId}
            editPositionId={editPositionId}
            setEditPositionId={setEditPositionId}
            editActive={editActive}
            setEditActive={setEditActive}
            selectedDepartments={selectedDepartments}
            selectedPositions={selectedPositions}
            applySelectedProfileUpdate={applySelectedProfileUpdate}
            loadSelectedEmployeeHistory={loadSelectedEmployeeHistory}
            history={history}
            filteredHistory={filteredHistory}
            historyActionFilter={historyActionFilter}
            setHistoryActionFilter={setHistoryActionFilter}
            historyFieldFilter={historyFieldFilter}
            setHistoryFieldFilter={setHistoryFieldFilter}
            historyChangeSummary={historyChangeSummary}
            historyChanges={historyChanges}
            profileFieldLabel={profileFieldLabel}
          />
        </section>
        {showDevTools ? (
          <section aria-label={isKoLocale ? "?�청 로그" : "Request logs"}>
            <AdminPeopleLogsPanel isKoLocale={isKoLocale} stats={stats} pendingLabel={pendingLabel} logs={logs} />
          </section>
        ) : (
          <section aria-label={isKoLocale ? "Related workspaces" : "Related workspaces"}>
            <AdminPeopleRelatedWorkspacesPanel isKoLocale={isKoLocale} />
          </section>
        )}
      </section>
    </main>
  );
}

