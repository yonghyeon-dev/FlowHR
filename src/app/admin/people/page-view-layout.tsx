import Link from "next/link";

import { AdminPeopleComparePanel } from "@/app/admin/people/page-view-compare-panel";
import { AdminPeopleDirectoryFiltersPanel } from "@/app/admin/people/page-view-directory-filters-panel";
import { AdminPeopleHistoryPanel } from "@/app/admin/people/page-view-history-panel";
import { AdminPeopleLogsPanel } from "@/app/admin/people/page-view-logs-panel";
import { AdminPeopleOrgChartPanel } from "@/app/admin/people/page-view-org-chart-panel";
import { AdminPeopleRelatedWorkspacesPanel } from "@/app/admin/people/page-view-related-workspaces-panel";
import type { AdminPeoplePageViewProps } from "@/app/admin/people/page-view";
import { BulkImportPanel } from "@/components/people/BulkImportPanel";

type AdminPeoplePageViewLayoutProps = AdminPeoplePageViewProps & {
  focusPanelLabel: string | null;
  sourceContextLabel: string | null;
  sourceContextReturnHref: string | null;
  sourceContextReturnLabel: string | null;
  onJumpToFocusPanel: () => void;
};

export function AdminPeoplePageViewLayout(props: AdminPeoplePageViewLayoutProps) {
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
    supabaseSessionLoading,
    requiresLoginSession,
    usesBearerToken,
    bearerToken,
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
    focusPanel,
    focusPanelLabel,
    sourceContextLabel,
    sourceContextReturnHref,
    sourceContextReturnLabel,
    onJumpToFocusPanel
  } = props;

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
          <button
            className="btn btn-primary"
            onClick={() => void refreshDirectory()}
            disabled={supabaseSessionLoading || requiresLoginSession}
          >
            {isKoLocale ? "디렉터리 조회" : "Refresh directory"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => document.getElementById("bulk-import")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            {isKoLocale ? "CSV 일괄 가져오기" : "CSV bulk import"}
          </button>
          {focusPanel ? (
            <button className="btn btn-secondary" onClick={onJumpToFocusPanel}>
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
        <section id="bulk-import">
          <BulkImportPanel
            isKoLocale={isKoLocale}
            usesBearerToken={usesBearerToken}
            bearerToken={bearerToken}
            adminActorId={adminActorId}
            organizationId={organizationId}
            disabled={supabaseSessionLoading || requiresLoginSession}
            onImported={refreshDirectory}
          />
        </section>

        <section
          id="directory-filters"
          className={focusPanel === "directory-filters" ? "panel-focus-target" : undefined}
        >
          <AdminPeopleDirectoryFiltersPanel
            isKoLocale={isKoLocale}
            showDevTools={showDevTools}
            organizationId={organizationId}
            adminActorId={adminActorId}
            supabaseSessionLoading={supabaseSessionLoading}
            requiresLoginSession={requiresLoginSession}
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
