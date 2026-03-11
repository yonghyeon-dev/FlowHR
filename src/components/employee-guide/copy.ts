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
  sourceHint: string;
  productionWarning: string;
  loginCta: string;
  backToHomeLabel: string;
  requestsHubLabel: string;
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
  description:
    "Follow the first-login path for attendance correction, leave requests, and payslip checks.",
  sourceHint:
    "Use this guide as the shortest path into attendance, leave, and document workspaces.",
  productionWarning:
    "Production runtime requires a bearer token session for API calls.",
  loginCta: "Open /login",
  backToHomeLabel: "Employee home",
  requestsHubLabel: "Requests hub",
  contextTitle: "Workspace context",
  organizationIdLabel: "Organization",
  employeeIdLabel: "Employee number",
  accessTokenLabel: "Connection token (optional)",
  loadButton: "Refresh guide status",
  loadingLabel: "Loading guide status...",
  progressLabel: "Guide progress",
  journeyTitle: "Recommended first path",
  journeySteps: [
    "1) Verify account context (organization and employee number).",
    "2) Submit one attendance correction to learn approval flow.",
    "3) Submit one leave request and verify request status.",
    "4) Open payslips and confirm the latest confirmed payroll."
  ],
  quickActionsTitle: "Quick actions",
  quickActions: [
    {
      label: "Attendance",
      href: "/employee/attendance/correction?source=employee-guide",
      description: "Check-in/check-out and correction request."
    },
    {
      label: "Leave",
      href: "/employee/leave/request?source=employee-guide",
      description: "Submit leave request and track status."
    },
    {
      label: "Payslips",
      href: "/employee/payslips",
      description: "Review confirmed payroll details."
    },
    {
      label: "Receipts",
      href: "/employee/payslip-receipts",
      description: "Track payslip receipt status."
    }
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
    description:
      "첫 로그인 이후 가장 많이 쓰는 근태, 휴가, 명세서 경로를 한 번에 익힐 수 있게 정리했습니다.",
    sourceHint:
      "오늘 처리할 요청과 문서 작업을 빠르게 찾고, route-first 워크스페이스로 바로 이동할 수 있습니다.",
    productionWarning:
      "운영 환경에서 API를 호출하려면 로그인 세션이 필요합니다.",
    loginCta: "로그인하기",
    backToHomeLabel: "직원 홈",
    requestsHubLabel: "요청 허브",
    contextTitle: "가이드 상태",
    organizationIdLabel: "소속 조직",
    employeeIdLabel: "직원 번호",
    accessTokenLabel: "연결 토큰",
    loadButton: "가이드 상태 새로고침",
    loadingLabel: "가이드 상태를 불러오는 중입니다...",
    progressLabel: "가이드 진행률",
    journeyTitle: "권장 시작 순서",
    journeySteps: [
      "1) 계정과 직원 번호가 정상인지 먼저 확인합니다.",
      "2) 출퇴근 정정 요청을 한 번 열어 승인 흐름을 익힙니다.",
      "3) 휴가 요청과 요청 상태 확인 경로를 한 번씩 점검합니다.",
      "4) 급여 명세서와 수신 확인 문서를 열어 최근 지급 내역을 확인합니다."
    ],
    quickActionsTitle: "빠른 이동",
    quickActions: [
      {
        label: "근태 작업",
        href: "/employee/attendance/correction?source=employee-guide",
        description: "출퇴근 기록과 정정 요청 작업으로 이동합니다."
      },
      {
        label: "휴가 작업",
        href: "/employee/leave/request?source=employee-guide",
        description: "휴가 요청 작성과 상태 확인으로 이동합니다."
      },
      {
        label: "급여 명세서",
        href: "/employee/payslips",
        description: "확정된 급여 명세서를 확인합니다."
      },
      {
        label: "수신 확인",
        href: "/employee/payslip-receipts",
        description: "명세서 수신 확인 상태를 점검합니다."
      }
    ],
    checklistTitle: "온보딩 체크리스트",
    checklist: {
      profile: "프로필과 계정 맥락 확인",
      attendance: "최근 14일 내 근태 기록 1건 이상",
      leave: "최근 14일 내 휴가 요청 1건 이상",
      payslip: "최근 14일 내 확정 명세서 1건 이상"
    },
    summaryTitle: "최근 작업 요약",
    summary: {
      attendance: "근태 기록",
      leave: "휴가 요청",
      payslip: "확정 명세서"
    },
    logsTitle: "요청 로그",
    logsEmpty: "아직 기록된 요청 로그가 없습니다.",
    doneLabel: "완료",
    todoLabel: "진행 필요",
    okLabel: "성공",
    failLabel: "실패",
    requestLabels: {
      attendanceRecords: "근태 기록 조회",
      leaveRequests: "휴가 요청 조회",
      confirmedPayslips: "확정 명세서 조회"
    }
  },
  en: defaultCopy
};
