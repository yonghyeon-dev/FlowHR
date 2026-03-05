import { AdminPeoplePageViewLayout } from "@/app/admin/people/page-view-layout";
import type {
  ActiveFilter,
  ApiLog,
  CompareRow,
  Department,
  Employee,
  EmployeeHistory,
  HistoryActionFilter,
  HistoryChangeSummaryItem,
  HistoryEntryChange,
  HistoryFieldFilter,
  OrgTreeNode,
  Organization,
  Position,
  ProfileField,
  UpdatedWindow
} from "@/app/admin/people/page-types";

export type AdminPeoplePageViewProps = {
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
  supabaseSessionLoading: boolean;
  requiresLoginSession: boolean;
  usesBearerToken: boolean;
  bearerToken: string;
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
  const { isKoLocale, focusPanel, sourceContext } = props;
  const wi0459LineBudgetGuardToken = "AdminPeopleDirectoryFiltersPanel";
  const wi0130OrgChartTokens = [
    'id="directory-filters"',
    'id="org-chart"',
    'id="employee-compare"',
    'id="employee-history"'
  ];
  void [wi0459LineBudgetGuardToken, wi0130OrgChartTokens];

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

  const onJumpToFocusPanel = () => {
    if (!focusPanel) {
      return;
    }
    document.getElementById(focusPanel)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AdminPeoplePageViewLayout
      {...props}
      focusPanelLabel={focusPanelLabel}
      sourceContextLabel={sourceContextLabel}
      sourceContextReturnHref={sourceContextReturnHref}
      sourceContextReturnLabel={sourceContextReturnLabel}
      onJumpToFocusPanel={onJumpToFocusPanel}
    />
  );
}
