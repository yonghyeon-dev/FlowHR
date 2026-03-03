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
  sourceContext: "admin-onboarding" | "admin-dashboard" | null;
  focusPanel: "directory-filters" | "org-chart" | "employee-compare" | "employee-history" | null;
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
    showDevTools,
    sourceContext,
    focusPanel
  } = props;

  const focusPanelLabel = focusPanel
    ? {
        "directory-filters": isKoLocale ? "디렉터리 필터" : "Directory filters",
        "org-chart": isKoLocale ? "조직도" : "Organization chart",
        "employee-compare": isKoLocale ? "직원 비교" : "Employee compare",
        "employee-history": isKoLocale ? "인사 이력" : "Employee history"
      }[focusPanel]
    : null;

  const sourceContextLabel =
    sourceContext === "admin-onboarding"
      ? isKoLocale
        ? "관리자 온보딩에서 이동했습니다."
        : "Opened from admin onboarding."
      : sourceContext === "admin-dashboard"
        ? isKoLocale
          ? "관리자 대시보드에서 이동했습니다."
          : "Opened from admin dashboard."
        : null;
  const sourceContextReturnHref =
    sourceContext === "admin-onboarding"
      ? "/admin/onboarding"
      : sourceContext === "admin-dashboard"
        ? "/admin"
        : null;
  const sourceContextReturnLabel =
    sourceContext === "admin-onboarding"
      ? isKoLocale
        ? "온보딩으로 돌아가기"
        : "Back to onboarding"
      : sourceContext === "admin-dashboard"
        ? isKoLocale
          ? "대시보드로 돌아가기"
          : "Back to dashboard"
        : null;

  function jumpToFocusPanel() {
    if (!focusPanel) {
      return;
    }
    document.getElementById(focusPanel)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{isKoLocale ? "조직도·인사 이력" : "Organization chart and HR history"}</h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "조직도, 직원 비교, 인사 이력 카드를 한 화면에서 관리합니다."
              : "Manage org tree, employee comparison, and HR history cards in one screen."}
          </p>
          {sourceContextLabel ? <p className="small muted">{sourceContextLabel}</p> : null}
          {focusPanelLabel ? (
            <p className="small muted">
              {isKoLocale ? "집중 섹션" : "Focused section"}: {focusPanelLabel}
            </p>
          ) : null}
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => void refreshDirectory()}>
            {isKoLocale ? "디렉터리 조회" : "Refresh directory"}
          </button>
          {focusPanel ? (
            <button className="btn btn-secondary" onClick={jumpToFocusPanel}>
              {isKoLocale ? "집중 섹션으로 이동" : "Jump to focused section"}
            </button>
          ) : null}
          {sourceContextReturnHref && sourceContextReturnLabel ? (
            <Link className="btn btn-secondary" href={sourceContextReturnHref}>
              {sourceContextReturnLabel}
            </Link>
          ) : null}
          {sourceContext !== "admin-dashboard" ? (
            <Link className="btn btn-secondary" href="/admin">
              {isKoLocale ? "관리자 대시보드" : "Admin dashboard"}
            </Link>
          ) : null}
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
        <section
          id="directory-filters"
          className={focusPanel === "directory-filters" ? "panel-focus-target" : undefined}
        >
          <AdminPeopleDirectoryFiltersPanel
            isKoLocale={isKoLocale}
            showDevTools={showDevTools}
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

        <section id="org-chart" className={focusPanel === "org-chart" ? "panel-focus-target" : undefined}>
          <AdminPeopleOrgChartPanel
            isKoLocale={isKoLocale}
            tree={tree}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
          />
        </section>

        <section
          id="employee-compare"
          className={focusPanel === "employee-compare" ? "panel-focus-target" : undefined}
        >
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

        <section
          id="employee-history"
          className={focusPanel === "employee-history" ? "panel-focus-target" : undefined}
        >
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
          <section aria-label={isKoLocale ? "요청 로그" : "Request logs"}>
            <AdminPeopleLogsPanel isKoLocale={isKoLocale} stats={stats} pendingLabel={pendingLabel} logs={logs} />
          </section>
        ) : (
          <section aria-label={isKoLocale ? "관련 화면 이동" : "Related workspaces"}>
            <AdminPeopleRelatedWorkspacesPanel isKoLocale={isKoLocale} />
          </section>
        )}
      </section>
    </main>
  );
}

