import type { SupabaseSessionSnapshot } from "@/lib/client/useSupabaseSession";
import type { PayslipPageCopy, PayslipSearchSortCopy } from "@/app/employee/payslips/page-locale-helpers";
import type {
  ApiLog,
  AttendanceAggregateDto,
  CompareInsightCard,
  CompareMetric,
  DeductionExplainSection,
  PayrollRunDto,
  PayslipSearchRow,
  PayslipSearchScope,
  PayslipSortOption
} from "@/app/employee/payslips/page-helpers";

export type PayslipStats = {
  count: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
};

export type ApiStats = {
  total: number;
  success: number;
  fail: number;
};

export type StatusFeedbackTone = "idle" | "ok" | "fail";

export type EmployeePayslipsPageViewProps = {
  pageCopy: PayslipPageCopy;
  searchSortCopy: PayslipSearchSortCopy;
  isKoLocale: boolean;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
  payslipStats: PayslipStats;
  stats: ApiStats;
  organizationId: string;
  setOrganizationId: (value: string) => void;
  employeeId: string;
  setEmployeeId: (value: string) => void;
  periodStart: string;
  setPeriodStart: (value: string) => void;
  periodEnd: string;
  setPeriodEnd: (value: string) => void;
  refreshPayslips: () => Promise<void>;
  applyCurrentMonthRange: () => void;
  applyPreviousMonthRange: () => void;
  applyLastThreeMonthsRange: () => void;
  downloadRunsCsv: () => void;
  runs: PayrollRunDto[];
  showDevTools: boolean;
  accessToken: string;
  setAccessToken: (value: string) => void;
  pendingLabel: string | null;
  supabaseSession: SupabaseSessionSnapshot | null;
  supabaseSessionError: string | null;
  clearLogs: () => void;
  logs: ApiLog[];
  aggregate: AttendanceAggregateDto | null;
  selectedRun: PayrollRunDto | null;
  setSelectedRunId: (runId: string) => void;
  payslipSearchScope: PayslipSearchScope;
  setPayslipSearchScope: (scope: PayslipSearchScope) => void;
  payslipSearchQuery: string;
  setPayslipSearchQuery: (query: string) => void;
  payslipSortOption: PayslipSortOption;
  setPayslipSortOption: (option: PayslipSortOption) => void;
  resetPayslipSearchControls: () => void;
  focusSelectedPayslipInSearch: () => void;
  prioritizeNetPaySearchSort: () => void;
  filteredPayslipSearchRows: PayslipSearchRow[];
  statusFeedbackMessage: string;
  statusFeedbackTone: StatusFeedbackTone;
  latestFailureMessage: string;
  copyLatestFailureCause: () => Promise<void>;
  latestFailedLog: ApiLog | null;
  statusRecoveryGuide: string;
  latestLog: ApiLog | null;
  compareCandidates: PayrollRunDto[];
  compareRunId: string;
  setCompareRunId: (runId: string) => void;
  compareWindowLabel: string;
  compareMetrics: CompareMetric[];
  compareInsightAriaLabel: string;
  compareInsightTitle: string;
  compareInsightCards: CompareInsightCard[];
  copyCompareSnapshot: () => Promise<void>;
  compareRun: PayrollRunDto | null;
  payslipFileName: string;
  copyPayslipFileName: () => Promise<void>;
  copySelectedRunId: () => Promise<void>;
  deductionExplainSections: DeductionExplainSection[];
};
