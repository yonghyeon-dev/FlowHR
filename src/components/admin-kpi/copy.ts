import { type FlowLocale } from "@/lib/i18n/locales";

export type KpiCopy = {
  title: string;
  description: string;
  analyticsTitle: string;
  analyticsDescription: string;
  productionWarning: string;
  loginCta: string;
  contextTitle: string;
  organizationIdLabel: string;
  adminActorIdLabel: string;
  accessTokenLabel: string;
  periodStartLabel: string;
  periodEndLabel: string;
  thisMonthButton: string;
  recent30DaysButton: string;
  refreshButton: string;
  exportCsvButton: string;
  exportCsvDone: string;
  focusMetricLabel: string;
  focusMetricAllOption: string;
  loadingLabel: string;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  cards: {
    pendingApprovals: string;
    stalledApprovals: string;
    attendanceApprovalRate: string;
    leaveApprovedDays: string;
    payrollConfirmedRate: string;
    contractSlaOverdueCount: string;
  };
  details: {
    attendanceTotal: string;
    leaveApprovedRequests: string;
    payrollConfirmedRuns: string;
    stalledThreshold: string;
  };
  trendTitle: string;
  trendCurrent: string;
  trendPrevious: string;
  trendDelta: string;
  metricLabel: string;
  logsTitle: string;
  logSuccessLabel: string;
  logFailLabel: string;
  noLogs: string;
  noData: string;
  metrics: {
    pendingApprovals: string;
    stalledApprovals: string;
    attendanceApprovalRate: string;
    leaveApprovedDays: string;
    payrollConfirmedRate: string;
    contractSlaOverdueCount: string;
  };
};

const defaultCopy: KpiCopy = {
  title: "Admin KPI Dashboard",
  description:
    "Track core journey metrics for approvals, attendance, leave, and payroll with current-vs-previous period comparison.",
  analyticsTitle: "Admin Analytics & Report",
  analyticsDescription:
    "Generate KPI snapshots and trend rows for reporting, then export the current view as CSV.",
  productionWarning: "Production runtime requires bearer token session to call APIs.",
  loginCta: "Open /login",
  contextTitle: "Context & Period",
  organizationIdLabel: "Organization ID",
  adminActorIdLabel: "Admin Actor ID (Dev fallback)",
  accessTokenLabel: "Access Token (optional)",
  periodStartLabel: "Period Start",
  periodEndLabel: "Period End",
  thisMonthButton: "This month",
  recent30DaysButton: "Last 30 days",
  refreshButton: "Refresh KPIs",
  exportCsvButton: "Export CSV",
  exportCsvDone: "CSV export is ready",
  focusMetricLabel: "Focus metric",
  focusMetricAllOption: "All metrics",
  loadingLabel: "Loading KPI metrics...",
  currentPeriodLabel: "Current period",
  previousPeriodLabel: "Previous period",
  cards: {
    pendingApprovals: "Pending approvals",
    stalledApprovals: "Stalled approvals (24h+)",
    attendanceApprovalRate: "Attendance approval rate",
    leaveApprovedDays: "Approved leave days",
    payrollConfirmedRate: "Payroll confirmed rate",
    contractSlaOverdueCount: "Contract SLA overdue"
  },
  details: {
    attendanceTotal: "total records",
    leaveApprovedRequests: "approved requests",
    payrollConfirmedRuns: "confirmed runs",
    stalledThreshold: "older than 24h"
  },
  trendTitle: "Period comparison",
  trendCurrent: "Current",
  trendPrevious: "Previous",
  trendDelta: "Delta",
  metricLabel: "Metric",
  logsTitle: "API call logs",
  logSuccessLabel: "OK",
  logFailLabel: "FAIL",
  noLogs: "No API logs yet.",
  noData: "No KPI snapshot yet. Choose period and load.",
  metrics: {
    pendingApprovals: "Pending approvals",
    stalledApprovals: "Stalled approvals (24h+)",
    attendanceApprovalRate: "Attendance approval rate",
    leaveApprovedDays: "Approved leave days",
    payrollConfirmedRate: "Payroll confirmed rate",
    contractSlaOverdueCount: "Contract SLA overdue"
  }
};

export const kpiCopyByLocale: Record<FlowLocale, KpiCopy> = {
  ko: {
    ...defaultCopy,
    title: "관리자 KPI 대시보드",
    description: "결재, 근태, 휴가, 급여 핵심 지표를 현재 기간과 이전 동일 기간으로 비교합니다.",
    analyticsTitle: "관리자 분석/리포트",
    analyticsDescription: "현재 KPI 스냅샷과 기간 비교 데이터를 CSV로 내려받아 리포팅에 활용하세요.",
    productionWarning: "프로덕션 환경에서는 API 호출을 위해 베어러 토큰 세션이 필요합니다.",
    loginCta: "로그인 열기",
    contextTitle: "컨텍스트 및 기간",
    organizationIdLabel: "조직 식별자",
    adminActorIdLabel: "관리자 액터 식별자 (개발용 대체값)",
    accessTokenLabel: "액세스 토큰 (선택)",
    periodStartLabel: "기간 시작",
    periodEndLabel: "기간 종료",
    thisMonthButton: "이번 달",
    recent30DaysButton: "최근 30일",
    refreshButton: "KPI 새로고침",
    exportCsvButton: "CSV 내보내기",
    exportCsvDone: "CSV 파일을 내려받았습니다",
    focusMetricLabel: "집중 지표",
    focusMetricAllOption: "전체 지표",
    loadingLabel: "KPI 지표를 불러오는 중입니다...",
    currentPeriodLabel: "현재 기간",
    previousPeriodLabel: "이전 동일 기간",
    cards: {
      pendingApprovals: "결재 대기 건수",
      stalledApprovals: "정체 결재 (24시간+)",
      attendanceApprovalRate: "근태 승인률",
      leaveApprovedDays: "휴가 승인 일수",
      payrollConfirmedRate: "급여 확정률",
      contractSlaOverdueCount: "계약 SLA 기한 초과"
    },
    details: {
      attendanceTotal: "총 근태 건",
      leaveApprovedRequests: "승인된 휴가 요청",
      payrollConfirmedRuns: "확정된 급여 실행 건",
      stalledThreshold: "24시간 이상 정체"
    },
    trendTitle: "기간 비교",
    trendCurrent: "현재",
    trendPrevious: "이전",
    trendDelta: "증감",
    metricLabel: "지표",
    logsTitle: "API 호출 로그",
    logSuccessLabel: "정상",
    logFailLabel: "실패",
    noLogs: "아직 API 호출 로그가 없습니다.",
    noData: "아직 KPI 스냅샷이 없습니다. 기간을 선택해 조회하세요.",
    metrics: {
      pendingApprovals: "결재 대기 건수",
      stalledApprovals: "정체 결재 (24시간+)",
      attendanceApprovalRate: "근태 승인률",
      leaveApprovedDays: "휴가 승인 일수",
      payrollConfirmedRate: "급여 확정률",
      contractSlaOverdueCount: "계약 SLA 기한 초과"
    }
  },
  en: defaultCopy
};
