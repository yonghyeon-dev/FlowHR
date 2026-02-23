import { type FlowLocale } from "@/lib/i18n/locales";

export type KpiCopy = {
  title: string;
  description: string;
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
  loadingLabel: string;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  cards: {
    pendingApprovals: string;
    stalledApprovals: string;
    attendanceApprovalRate: string;
    leaveApprovedDays: string;
    payrollConfirmedRate: string;
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
  logsTitle: string;
  noLogs: string;
  noData: string;
  metrics: {
    pendingApprovals: string;
    stalledApprovals: string;
    attendanceApprovalRate: string;
    leaveApprovedDays: string;
    payrollConfirmedRate: string;
  };
};

const defaultCopy: KpiCopy = {
  title: "Admin KPI Dashboard",
  description:
    "Track core journey metrics for approvals, attendance, leave, and payroll with current-vs-previous period comparison.",
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
  loadingLabel: "Loading KPI metrics...",
  currentPeriodLabel: "Current period",
  previousPeriodLabel: "Previous period",
  cards: {
    pendingApprovals: "Pending approvals",
    stalledApprovals: "Stalled approvals (24h+)",
    attendanceApprovalRate: "Attendance approval rate",
    leaveApprovedDays: "Approved leave days",
    payrollConfirmedRate: "Payroll confirmed rate"
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
  logsTitle: "API call logs",
  noLogs: "No API logs yet.",
  noData: "No KPI snapshot yet. Choose period and load.",
  metrics: {
    pendingApprovals: "Pending approvals",
    stalledApprovals: "Stalled approvals (24h+)",
    attendanceApprovalRate: "Attendance approval rate",
    leaveApprovedDays: "Approved leave days",
    payrollConfirmedRate: "Payroll confirmed rate"
  }
};

export const kpiCopyByLocale: Record<FlowLocale, KpiCopy> = {
  ko: {
    ...defaultCopy,
    title: "관리자 KPI 대시보드",
    description: "결재, 근태, 휴가, 급여 핵심 지표를 현재 기간과 이전 동일 기간으로 비교합니다.",
    productionWarning: "프로덕션 환경에서는 API 호출을 위해 Bearer 토큰 세션이 필요합니다.",
    loginCta: "/login 열기",
    contextTitle: "컨텍스트 및 기간",
    organizationIdLabel: "Organization ID",
    adminActorIdLabel: "Admin Actor ID (개발 fallback)",
    accessTokenLabel: "Access Token (선택)",
    periodStartLabel: "기간 시작",
    periodEndLabel: "기간 종료",
    thisMonthButton: "이번 달",
    recent30DaysButton: "최근 30일",
    refreshButton: "KPI 새로고침",
    loadingLabel: "KPI 지표를 불러오는 중입니다...",
    currentPeriodLabel: "현재 기간",
    previousPeriodLabel: "이전 동일 기간",
    cards: {
      pendingApprovals: "결재 대기 건수",
      stalledApprovals: "정체 결재 (24시간+)",
      attendanceApprovalRate: "근태 승인률",
      leaveApprovedDays: "휴가 승인 일수",
      payrollConfirmedRate: "급여 확정률"
    },
    details: {
      attendanceTotal: "총 근태 건",
      leaveApprovedRequests: "승인된 휴가 요청",
      payrollConfirmedRuns: "확정된 급여 run",
      stalledThreshold: "24시간 이상 정체"
    },
    trendTitle: "기간 비교",
    trendCurrent: "현재",
    trendPrevious: "이전",
    trendDelta: "증감",
    logsTitle: "API 호출 로그",
    noLogs: "아직 API 호출 로그가 없습니다.",
    noData: "아직 KPI 스냅샷이 없습니다. 기간을 선택해 조회하세요.",
    metrics: {
      pendingApprovals: "결재 대기 건수",
      stalledApprovals: "정체 결재 (24시간+)",
      attendanceApprovalRate: "근태 승인률",
      leaveApprovedDays: "휴가 승인 일수",
      payrollConfirmedRate: "급여 확정률"
    }
  },
  en: defaultCopy
};
