import { type ActiveFilter, type Department, type Position, type UpdatedWindow } from "@/app/admin/people/page-types";
import {
  formatAdminSessionConnectionState,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

type AdminPeopleDirectoryFiltersPanelProps = {
  isKoLocale: boolean;
  showDevTools: boolean;
  organizationId: string;
  adminActorId: string;
  supabaseSessionLoading: boolean;
  requiresLoginSession: boolean;
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
  departments: Department[];
  positions: Position[];
  supabaseSessionError: string | null;
};

export function AdminPeopleDirectoryFiltersPanel({
  isKoLocale,
  showDevTools,
  organizationId,
  adminActorId,
  supabaseSessionLoading,
  requiresLoginSession,
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
  departments,
  positions,
  supabaseSessionError
}: AdminPeopleDirectoryFiltersPanelProps) {
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";

  return (
    <article className="panel panel-directory-filters">
      <h2>{isKoLocale ? "필터" : "Filters"}</h2>
      {showDevTools ? (
        <p className="small muted">
          {isKoLocale ? "세션 조직" : "Session organization"}:{" "}
          <strong>{formatWorkspaceConnectionState(Boolean(organizationId.trim()), runtimeLocale)}</strong> /{" "}
          {isKoLocale ? "세션 액터" : "Session actor"}:{" "}
          <strong>{formatAdminSessionConnectionState(Boolean(adminActorId.trim()), runtimeLocale)}</strong>
        </p>
      ) : null}
      {requiresLoginSession ? (
        <p className="small fail">
          {isKoLocale
            ? "운영 환경에서는 로그인 세션이 필요합니다. /login에서 로그인해 주세요."
            : "Login session is required in production. Please sign in at /login."}
        </p>
      ) : null}

      <div className="input-grid">
        <label>
          {isKoLocale ? "직원 검색" : "Employee search"}
          <input value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label>
          {isKoLocale ? "재직 상태" : "Active status"}
          <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}>
            <option value="all">{isKoLocale ? "전체" : "All"}</option>
            <option value="active">{isKoLocale ? "재직" : "Active"}</option>
            <option value="inactive">{isKoLocale ? "비재직" : "Inactive"}</option>
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
          {isKoLocale ? "최근 업데이트" : "Updated window"}
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
          <input
            type="number"
            min={1}
            max={200}
            value={historyLimit}
            onChange={(event) => setHistoryLimit(event.target.value)}
          />
        </label>
      </div>
      <div className="actions">
        <button
          className="btn btn-secondary"
          onClick={() => void loadOrganizations()}
          disabled={supabaseSessionLoading || requiresLoginSession}
        >
          {isKoLocale ? "조직 조회" : "Load organizations"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => void loadDepartments()}
          disabled={supabaseSessionLoading || requiresLoginSession}
        >
          {isKoLocale ? "부서 조회" : "Load departments"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => void loadPositions()}
          disabled={supabaseSessionLoading || requiresLoginSession}
        >
          {isKoLocale ? "직급 조회" : "Load positions"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => void loadEmployees()}
          disabled={supabaseSessionLoading || requiresLoginSession}
        >
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
  );
}
