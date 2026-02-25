import { type FlowLocale } from "@/lib/i18n/locales";

import type { AttendanceLiveStatus } from "@/features/admin-attendance-live/summary";

export type AttendanceLiveCopy = {
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
  departmentLabel: string;
  statusLabel: string;
  searchLabel: string;
  lateThresholdLabel: string;
  criticalThresholdLabel: string;
  todayButton: string;
  refreshButton: string;
  loadingLabel: string;
  cards: {
    totalScheduled: string;
    present: string;
    late: string;
    absent: string;
    checkedOut: string;
    watchAlerts: string;
    criticalAlerts: string;
  };
  tableTitle: string;
  tableHeaders: {
    employee: string;
    department: string;
    schedule: string;
    checkIn: string;
    checkOut: string;
    late: string;
    status: string;
    alert: string;
  };
  tableNoRows: string;
  logsTitle: string;
  logSuccessLabel: string;
  logFailLabel: string;
  logsEmpty: string;
  statuses: Record<AttendanceLiveStatus, string>;
  statusAll: string;
  departmentAll: string;
  alertNormal: string;
  alertWatch: string;
  alertCritical: string;
};

const defaultCopy: AttendanceLiveCopy = {
  title: "Realtime Attendance Status",
  description:
    "Track scheduled staff by live status (scheduled, present, late, absent) with alert badges and drill-down rows.",
  productionWarning: "Production runtime requires bearer token session to call APIs.",
  loginCta: "Open /login",
  contextTitle: "Context & Filters",
  organizationIdLabel: "Organization ID",
  adminActorIdLabel: "Admin Actor ID (Dev fallback)",
  accessTokenLabel: "Access Token (optional)",
  periodStartLabel: "Period Start",
  periodEndLabel: "Period End",
  departmentLabel: "Department",
  statusLabel: "Status",
  searchLabel: "Search",
  lateThresholdLabel: "Late threshold (minutes)",
  criticalThresholdLabel: "Critical threshold (minutes)",
  todayButton: "Today",
  refreshButton: "Refresh",
  loadingLabel: "Loading realtime attendance snapshot...",
  cards: {
    totalScheduled: "Scheduled",
    present: "Present",
    late: "Late",
    absent: "Absent",
    checkedOut: "Checked out",
    watchAlerts: "Watch alerts",
    criticalAlerts: "Critical alerts"
  },
  tableTitle: "Realtime attendance rows",
  tableHeaders: {
    employee: "Employee",
    department: "Department",
    schedule: "Schedule",
    checkIn: "Check-in",
    checkOut: "Check-out",
    late: "Late",
    status: "Status",
    alert: "Alert"
  },
  tableNoRows: "No rows for current filter.",
  logsTitle: "API call logs",
  logSuccessLabel: "OK",
  logFailLabel: "FAIL",
  logsEmpty: "No API logs yet.",
  statuses: {
    scheduled: "Scheduled",
    present: "Present",
    late: "Late",
    absent: "Absent",
    checked_out: "Checked out"
  },
  statusAll: "All",
  departmentAll: "All departments",
  alertNormal: "Normal",
  alertWatch: "Watch",
  alertCritical: "Critical"
};

export const attendanceLiveCopyByLocale: Record<FlowLocale, AttendanceLiveCopy> = {
  ko: {
    ...defaultCopy,
    title: "실시간 근태 현황",
    description: "스케줄 기준으로 출근/지각/미출근 상태를 실시간으로 확인하고 경고 배지를 추적합니다.",
    productionWarning: "프로덕션 환경에서는 API 호출을 위해 베어러 토큰 세션이 필요합니다.",
    loginCta: "로그인 열기",
    contextTitle: "컨텍스트 및 필터",
    organizationIdLabel: "조직 식별자",
    adminActorIdLabel: "관리자 액터 식별자 (개발용 대체값)",
    accessTokenLabel: "액세스 토큰 (선택)",
    periodStartLabel: "조회 시작",
    periodEndLabel: "조회 종료",
    departmentLabel: "부서",
    statusLabel: "상태",
    searchLabel: "검색",
    lateThresholdLabel: "지각 기준(분)",
    criticalThresholdLabel: "치명 기준(분)",
    todayButton: "오늘",
    refreshButton: "새로고침",
    loadingLabel: "실시간 근태 스냅샷을 불러오는 중입니다...",
    cards: {
      totalScheduled: "스케줄 인원",
      present: "출근",
      late: "지각",
      absent: "미출근",
      checkedOut: "퇴근",
      watchAlerts: "주의 알림",
      criticalAlerts: "치명 알림"
    },
    tableTitle: "실시간 근태 목록",
    tableHeaders: {
      employee: "직원",
      department: "부서",
      schedule: "근무 시간",
      checkIn: "출근",
      checkOut: "퇴근",
      late: "지각",
      status: "상태",
      alert: "알림"
    },
    tableNoRows: "현재 필터에 해당하는 항목이 없습니다.",
    logsTitle: "API 호출 로그",
    logSuccessLabel: "정상",
    logFailLabel: "실패",
    logsEmpty: "아직 API 호출 로그가 없습니다.",
    statuses: {
      scheduled: "예정",
      present: "출근",
      late: "지각",
      absent: "미출근",
      checked_out: "퇴근"
    },
    statusAll: "전체",
    departmentAll: "전체 부서",
    alertNormal: "정상",
    alertWatch: "주의",
    alertCritical: "치명"
  },
  en: defaultCopy
};
