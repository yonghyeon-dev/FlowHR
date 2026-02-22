import { DEFAULT_LOCALE, type FlowLocale } from "@/lib/i18n/locales";

const messages = {
  ko: {
    "role.admin": "관리자",
    "role.employee": "직원",

    "home.title": "한국형 HR SaaS MVP",
    "home.copy": "근태, 휴가, 급여, 결재를 한 제품 안에서 끝까지 연결합니다. (Shiftee/Flex 상위호환 목표)",
    "home.cta.admin": "관리자 대시보드",
    "home.cta.employee": "직원 포털",
    "home.cta.payslip": "급여 명세서",
    "home.cta.login": "로그인",
    "home.admin.title": "관리자 대시보드",
    "home.admin.copy":
      "직원/조직, 승인 대기함(출퇴근·휴가), 근태 집계, 급여 프리뷰/확정까지 한 흐름으로 처리합니다.",
    "home.admin.open": "/admin 열기",
    "home.employee.title": "직원 포털",
    "home.employee.copy":
      "출퇴근 기록, 휴가 신청/취소, 내 스케줄과 잔여 휴가, 급여 명세서까지 직원이 직접 처리합니다.",
    "home.devtools.title": "개발 도구",
    "home.devtools.copy":
      "운영/검증용 콘솔입니다. SaaS 사용자 UI와 분리되어야 하므로 기본 화면에서는 숨깁니다.",

    "admin.badge": "Admin",
    "admin.nav.aria": "관리자 네비게이션",
    "admin.nav.dashboard": "대시보드",
    "admin.nav.approvals": "승인 대기",
    "admin.nav.aggregates": "근태 집계",
    "admin.nav.leavePolicy": "휴가 정책",
    "admin.nav.leaveAccrual": "연차 자동 부여",
    "admin.nav.leaveCalendar": "휴가 캘린더",
    "admin.nav.payroll": "급여",
    "admin.nav.insurance": "4대보험 정산",
    "admin.nav.payrollClose": "급여 마감",
    "admin.nav.payslipDelivery": "명세서 배포",
    "admin.nav.yearEnd": "연말정산/영수증",
    "admin.nav.yearEndFiling": "연말정산 확정/신고",
    "admin.nav.yearEndFilingOps": "연말정산 신고 운영",
    "admin.nav.yearEndFilingOpsChecklist": "신고 운영 체크리스트",
    "admin.nav.yearEndFilingOpsChecklistReview": "체크리스트 검토 루프",
    "admin.nav.yearEndFilingOpsChecklistReviewSnapshot": "검토 승인 스냅샷",
    "admin.nav.yearEndFilingOpsChecklistReviewHandoff": "검토 인수인계/익스포트 스냅샷",
    "admin.nav.yearEndFilingOpsChecklistReviewCloseOff": "검토 close-off 패키지",
    "admin.nav.yearEndFilingOpsChecklistRoutingSignatureBundle": "승인 라우팅/전달 서명 번들",
    "admin.nav.yearEndFilingOpsChecklistDeliveryLockHandover": "전달 패키지 lock/final handover",
    "admin.nav.yearEndFilingOpsChecklistCompletionReceiptArchiveDigest":
      "완료 확인서/archive digest",
    "admin.nav.yearEndFilingOpsChecklistCompletionCloseReport": "완료 close report",
    "admin.nav.yearEndFilingOpsChecklistCloseReportDistributionSignoff": "close report 배포 sign-off",
    "admin.nav.yearEndFilingOpsChecklistCloseReportDistributionSignoffClosurePacket":
      "distribution sign-off closure packet",
    "admin.nav.yearEndFilingOpsChecklistClosurePacketReleaseDigest":
      "closure packet release digest",
    "admin.nav.yearEndFilingOpsChecklistClosurePacketReleaseDigestAckLedger":
      "closure packet release digest acknowledgment ledger",
    "admin.nav.yearEndFilingOpsChecklistClosurePacketReleaseDigestAckLedgerExceptionLog":
      "acknowledgment ledger exception log",
    "admin.nav.people": "조직/인사",
    "admin.nav.contracts": "전자계약",
    "admin.nav.approvalPolicy": "결재 정책",
    "admin.nav.employeePortal": "직원 포털",
    "admin.nav.devOpsConsole": "(dev) ops 콘솔",
    "admin.nav.devLeavePromotion": "(dev) 연차촉진 공지",

    "employee.badge": "Employee",
    "employee.nav.aria": "직원 네비게이션",
    "employee.nav.overview": "개요",
    "employee.nav.account": "계정",
    "employee.nav.selfServiceOverview": "셀프서비스 개요",
    "employee.nav.submitChecklist": "제출 체크리스트",
    "employee.nav.requestFeedback": "요청 피드백",
    "employee.nav.requestSearchSort": "요청 검색/정렬",
    "employee.nav.requestTimeline": "요청 타임라인",
    "employee.nav.requestResubmit": "요청 재제출",
    "employee.nav.attendance": "근태",
    "employee.nav.leave": "휴가",
    "employee.nav.leaveCalendar": "휴가 캘린더",
    "employee.nav.schedule": "스케줄",
    "employee.nav.payslips": "급여 명세서",
    "employee.nav.payslipReceipts": "명세서 수신 확인",
    "employee.nav.withholdingReceipt": "원천징수영수증",
    "employee.nav.payslipSearchSort": "명세서 검색/정렬",
    "employee.nav.statusFeedback": "명세서 상태 피드백",
    "employee.nav.compareView": "명세서 비교",
    "employee.nav.admin": "관리자",

    "login.title": "로그인",
    "login.copy":
      "Supabase Auth 세션으로 API를 호출합니다. 로그인 이후에는 Dev Header 모드 대신 세션 기반 인증이 사용됩니다.",
    "login.backHome": "홈",
    "login.goToAdmin": "관리자 화면으로",
    "login.goToEmployee": "직원 화면으로",
    "login.sessionTitle": "세션 상태",
    "login.sessionAria": "세션 정보",
    "login.userId": "User ID",
    "login.email": "Email",
    "login.role": "Role",
    "login.organization": "Organization",
    "login.actorIdOptional": "Actor ID(선택)",
    "login.notSignedIn": "현재 로그인되어 있지 않습니다.",
    "login.signOut": "로그아웃",
    "login.signInTitle": "로그인",
    "login.signInCopy":
      "이메일/비밀번호 로그인을 사용합니다. (Supabase 설정에서 해당 Provider가 활성화되어 있어야 합니다.)",
    "login.password": "Password",
    "login.signIn": "로그인",

    "sessionMenu.aria": "세션 메뉴",
    "sessionMenu.signOut": "로그아웃",
    "sessionMenu.loginRequired": "로그인이 필요합니다",
    "sessionMenu.noSession": "세션이 없습니다.",
    "sessionMenu.signIn": "로그인",
    "sessionMenu.errorPrefix": "세션 오류"
  },
  en: {
    "role.admin": "Admin",
    "role.employee": "Employee",

    "home.title": "Korean HR SaaS MVP",
    "home.copy":
      "Connect attendance, leave, payroll, and approvals end-to-end in one product. (Target: outperform Shiftee/Flex)",
    "home.cta.admin": "Admin Dashboard",
    "home.cta.employee": "Employee Portal",
    "home.cta.payslip": "Payslips",
    "home.cta.login": "Log In",
    "home.admin.title": "Admin Dashboard",
    "home.admin.copy":
      "Handle people/org management, approval queues (attendance and leave), attendance aggregates, and payroll preview/finalization in one flow.",
    "home.admin.open": "Open /admin",
    "home.employee.title": "Employee Portal",
    "home.employee.copy":
      "Employees can manage attendance records, leave requests/cancel, schedules, leave balance, and payslips directly.",
    "home.devtools.title": "Developer Tools",
    "home.devtools.copy":
      "These are operational and validation consoles. They are hidden from the default SaaS UI.",

    "admin.badge": "Admin",
    "admin.nav.aria": "Administrator navigation",
    "admin.nav.dashboard": "Dashboard",
    "admin.nav.approvals": "Approval Queue",
    "admin.nav.aggregates": "Attendance Aggregates",
    "admin.nav.leavePolicy": "Leave Policy",
    "admin.nav.leaveAccrual": "Auto Leave Accrual",
    "admin.nav.leaveCalendar": "Leave Calendar",
    "admin.nav.payroll": "Payroll",
    "admin.nav.insurance": "4-Insurance Settlement",
    "admin.nav.payrollClose": "Payroll Close",
    "admin.nav.payslipDelivery": "Payslip Delivery",
    "admin.nav.yearEnd": "Year-End / Receipt",
    "admin.nav.yearEndFiling": "Year-End Filing",
    "admin.nav.yearEndFilingOps": "Year-End Filing Ops",
    "admin.nav.yearEndFilingOpsChecklist": "Filing Ops Checklist",
    "admin.nav.yearEndFilingOpsChecklistReview": "Checklist Review Loop",
    "admin.nav.yearEndFilingOpsChecklistReviewSnapshot": "Review Approval Snapshot",
    "admin.nav.yearEndFilingOpsChecklistReviewHandoff": "Review Handoff + Export Snapshot",
    "admin.nav.yearEndFilingOpsChecklistReviewCloseOff": "Review Close-off Package",
    "admin.nav.yearEndFilingOpsChecklistRoutingSignatureBundle": "Approval Routing + Delivery Signature Bundle",
    "admin.nav.yearEndFilingOpsChecklistDeliveryLockHandover": "Delivery Lock + Final Handover",
    "admin.nav.yearEndFilingOpsChecklistCompletionReceiptArchiveDigest":
      "Completion Receipt + Archive Digest",
    "admin.nav.yearEndFilingOpsChecklistCompletionCloseReport": "Completion Close Report",
    "admin.nav.yearEndFilingOpsChecklistCloseReportDistributionSignoff":
      "Close Report Distribution Sign-off",
    "admin.nav.yearEndFilingOpsChecklistCloseReportDistributionSignoffClosurePacket":
      "Distribution Sign-off Closure Packet",
    "admin.nav.yearEndFilingOpsChecklistClosurePacketReleaseDigest":
      "Closure Packet Release Digest",
    "admin.nav.yearEndFilingOpsChecklistClosurePacketReleaseDigestAckLedger":
      "Closure Packet Release Digest Acknowledgment Ledger",
    "admin.nav.yearEndFilingOpsChecklistClosurePacketReleaseDigestAckLedgerExceptionLog":
      "Acknowledgment Ledger Exception Log",
    "admin.nav.people": "People / Organization",
    "admin.nav.contracts": "E-Contracts",
    "admin.nav.approvalPolicy": "Approval Policy",
    "admin.nav.employeePortal": "Employee Portal",
    "admin.nav.devOpsConsole": "(dev) ops console",
    "admin.nav.devLeavePromotion": "(dev) leave promotion notice",

    "employee.badge": "Employee",
    "employee.nav.aria": "Employee navigation",
    "employee.nav.overview": "Overview",
    "employee.nav.account": "Account",
    "employee.nav.selfServiceOverview": "Self-Service Overview",
    "employee.nav.submitChecklist": "Submit Checklist",
    "employee.nav.requestFeedback": "Request Feedback",
    "employee.nav.requestSearchSort": "Request Search/Sort",
    "employee.nav.requestTimeline": "Request Timeline",
    "employee.nav.requestResubmit": "Request Resubmit",
    "employee.nav.attendance": "Attendance",
    "employee.nav.leave": "Leave",
    "employee.nav.leaveCalendar": "Leave Calendar",
    "employee.nav.schedule": "Schedule",
    "employee.nav.payslips": "Payslips",
    "employee.nav.payslipReceipts": "Payslip Receipts",
    "employee.nav.withholdingReceipt": "Withholding Receipt",
    "employee.nav.payslipSearchSort": "Payslip Search/Sort",
    "employee.nav.statusFeedback": "Payslip Status Feedback",
    "employee.nav.compareView": "Payslip Compare",
    "employee.nav.admin": "Admin",

    "login.title": "Log In",
    "login.copy":
      "API calls use Supabase Auth session credentials. After login, session-based auth is used instead of dev header mode.",
    "login.backHome": "Home",
    "login.goToAdmin": "Go to Admin",
    "login.goToEmployee": "Go to Employee",
    "login.sessionTitle": "Session Status",
    "login.sessionAria": "session info",
    "login.userId": "User ID",
    "login.email": "Email",
    "login.role": "Role",
    "login.organization": "Organization",
    "login.actorIdOptional": "Actor ID (optional)",
    "login.notSignedIn": "You are not signed in.",
    "login.signOut": "Log Out",
    "login.signInTitle": "Log In",
    "login.signInCopy":
      "Use email/password login. (The provider must be enabled in your Supabase project settings.)",
    "login.password": "Password",
    "login.signIn": "Log In",

    "sessionMenu.aria": "Session menu",
    "sessionMenu.signOut": "Log Out",
    "sessionMenu.loginRequired": "Login required",
    "sessionMenu.noSession": "No active session.",
    "sessionMenu.signIn": "Log In",
    "sessionMenu.errorPrefix": "Session error"
  }
} as const;

export type MessageKey = keyof (typeof messages)["ko"];

export function translate(locale: FlowLocale, key: MessageKey): string {
  const localeMessages = messages[locale] ?? messages[DEFAULT_LOCALE];
  return localeMessages[key] ?? messages[DEFAULT_LOCALE][key];
}

export function createTranslator(locale: FlowLocale) {
  return (key: MessageKey) => translate(locale, key);
}
