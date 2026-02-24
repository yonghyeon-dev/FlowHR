import { type FlowLocale } from "@/lib/i18n/locales";

export type EmployeeGuideActionLink = {
  label: string;
  href: string;
  description: string;
};

export type EmployeeGuideCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  productionWarning: string;
  loginCta: string;
  contextTitle: string;
  organizationIdLabel: string;
  employeeIdLabel: string;
  accessTokenLabel: string;
  loadButton: string;
  loadingLabel: string;
  progressLabel: string;
  journeyTitle: string;
  journeySteps: string[];
  quickActionsTitle: string;
  quickActions: EmployeeGuideActionLink[];
  checklistTitle: string;
  checklist: {
    profile: string;
    attendance: string;
    leave: string;
    payslip: string;
  };
  summaryTitle: string;
  summary: {
    attendance: string;
    leave: string;
    payslip: string;
  };
  logsTitle: string;
  logsEmpty: string;
  doneLabel: string;
  todoLabel: string;
  okLabel: string;
  failLabel: string;
  requestLabels: {
    attendanceRecords: string;
    leaveRequests: string;
    confirmedPayslips: string;
  };
};

const defaultCopy: EmployeeGuideCopy = {
  heroEyebrow: "FlowHR Employee",
  title: "Employee In-App Guide",
  description: "Follow the first-login path for attendance correction, leave requests, and payslip checks.",
  productionWarning: "Production runtime requires a bearer token session for API calls.",
  loginCta: "Open /login",
  contextTitle: "Context",
  organizationIdLabel: "Organization ID",
  employeeIdLabel: "Employee ID",
  accessTokenLabel: "Access Token (optional)",
  loadButton: "Refresh guide status",
  loadingLabel: "Loading guide status...",
  progressLabel: "Guide progress",
  journeyTitle: "Recommended first path",
  journeySteps: [
    "1) Verify account context (organization and employee IDs).",
    "2) Submit one attendance correction to learn approval flow.",
    "3) Submit one leave request and verify request status.",
    "4) Open payslips and confirm the latest confirmed payroll."
  ],
  quickActionsTitle: "Quick actions",
  quickActions: [
    { label: "Attendance", href: "/employee#attendance", description: "Check-in/check-out and correction request." },
    { label: "Leave", href: "/employee#leave", description: "Submit leave request and track status." },
    { label: "Payslips", href: "/employee/payslips", description: "Review confirmed payroll details." },
    { label: "Receipts", href: "/employee/payslip-receipts", description: "Track payslip receipt status." }
  ],
  checklistTitle: "Onboarding checklist",
  checklist: {
    profile: "Profile context is ready",
    attendance: "At least one attendance record exists (last 14 days)",
    leave: "At least one leave request exists (last 14 days)",
    payslip: "At least one confirmed payslip exists (last 14 days)"
  },
  summaryTitle: "Recent activity summary",
  summary: {
    attendance: "Attendance records",
    leave: "Leave requests",
    payslip: "Confirmed payslips"
  },
  logsTitle: "API logs",
  logsEmpty: "No logs yet.",
  doneLabel: "DONE",
  todoLabel: "TODO",
  okLabel: "OK",
  failLabel: "FAIL",
  requestLabels: {
    attendanceRecords: "attendance records",
    leaveRequests: "leave requests",
    confirmedPayslips: "confirmed payslips"
  }
};

export const employeeGuideCopyByLocale: Record<FlowLocale, EmployeeGuideCopy> = {
  ko: {
    ...defaultCopy,
    heroEyebrow: "FlowHR 직원",
    title: "직원 인앱 가이드",
    description: "첫 로그인 이후 근태 정정, 휴가 신청, 명세 확인까지 핵심 흐름을 빠르게 안내합니다.",
    productionWarning: "프로덕션 환경에서는 API 호출을 위해 Bearer 토큰 세션이 필요합니다.",
    loginCta: "/login 열기",
    contextTitle: "컨텍스트",
    organizationIdLabel: "조직 ID",
    employeeIdLabel: "직원 ID",
    accessTokenLabel: "액세스 토큰(선택)",
    loadButton: "가이드 상태 새로고침",
    loadingLabel: "가이드 상태를 불러오는 중입니다...",
    progressLabel: "가이드 진척도",
    journeyTitle: "권장 시작 경로",
    journeySteps: [
      "1) 계정 컨텍스트(조직/직원 ID)를 먼저 확인합니다.",
      "2) 근태 정정 요청 1건을 제출해 승인 흐름을 확인합니다.",
      "3) 휴가 요청 1건을 제출하고 상태를 확인합니다.",
      "4) 급여 명세서를 열어 최신 확정 급여를 확인합니다."
    ],
    quickActionsTitle: "빠른 이동",
    quickActions: [
      { label: "근태", href: "/employee#attendance", description: "출퇴근 기록/정정 요청을 처리합니다." },
      { label: "휴가", href: "/employee#leave", description: "휴가 요청을 등록하고 상태를 확인합니다." },
      { label: "명세서", href: "/employee/payslips", description: "확정 급여 명세를 확인합니다." },
      { label: "수신 확인", href: "/employee/payslip-receipts", description: "명세서 수신 상태를 확인합니다." }
    ],
    checklistTitle: "온보딩 체크리스트",
    checklist: {
      profile: "프로필 컨텍스트 준비 완료",
      attendance: "최근 14일 근태 기록 1건 이상",
      leave: "최근 14일 휴가 요청 1건 이상",
      payslip: "최근 14일 확정 명세 1건 이상"
    },
    summaryTitle: "최근 활동 요약",
    summary: {
      attendance: "근태 기록",
      leave: "휴가 요청",
      payslip: "확정 명세"
    },
    logsTitle: "API 로그",
    logsEmpty: "아직 로그가 없습니다.",
    doneLabel: "완료",
    todoLabel: "진행 필요",
    okLabel: "성공",
    failLabel: "실패",
    requestLabels: {
      attendanceRecords: "근태 기록 조회",
      leaveRequests: "휴가 요청 조회",
      confirmedPayslips: "확정 명세 조회"
    }
  },
  en: defaultCopy
};
