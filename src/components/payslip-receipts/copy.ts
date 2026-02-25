import { type FlowLocale } from "@/lib/i18n/locales";

export type PayslipReceiptCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  filtersTitle: string;
  employeeIdLabel: string;
  periodStartLabel: string;
  periodEndLabel: string;
  accessTokenLabel: string;
  bearerTokenPlaceholder: string;
  organizationIdFallbackLabel: string;
  loadPayslipsAction: string;
  sessionErrorPrefix: string;
  receiptStatusTitle: string;
  totalConfirmedRunsLabel: string;
  distributedLabel: string;
  receiptConfirmedLabel: string;
  pendingConfirmationLabel: string;
  runsTitle: string;
  noConfirmedPayslipsLoaded: string;
  netLabel: string;
  deliveredLabel: string;
  receiptLabel: string;
  confirmReceiptAction: string;
  apiLogsTitle: string;
  apiLogsTotalLabel: string;
  apiLogsSuccessLabel: string;
  apiLogsFailLabel: string;
  apiLogsRunningLabel: string;
  noApiCallYet: string;
  backToEmployeeAction: string;
  requestFailedCheckLogsStatus: string;
  employeeIdRequiredStatus: string;
  loadedConfirmedPayslipsPrefix: string;
  pendingLoadPayslipList: string;
  pendingConfirmReceiptPrefix: string;
  logListReceiptEligiblePayslips: string;
  logAcknowledgePayslipReceiptPrefix: string;
  receiptAlreadyConfirmedPrefix: string;
  receiptConfirmedPrefix: string;
  okLabel: string;
  failLabel: string;
};

export const payslipReceiptCopyByLocale: Record<FlowLocale, PayslipReceiptCopy> = {
  ko: {
    heroEyebrow: "FlowHR 직원",
    title: "급여명세 수신 확인",
    description: "배포된 급여명세를 확인하고 수신 확인 상태를 처리합니다.",
    filtersTitle: "필터",
    employeeIdLabel: "직원 번호",
    periodStartLabel: "기간 시작",
    periodEndLabel: "기간 종료",
    accessTokenLabel: "액세스 토큰(선택)",
    bearerTokenPlaceholder: "인증 토큰",
    organizationIdFallbackLabel: "조직 식별자(개발 대체값)",
    loadPayslipsAction: "급여명세 불러오기",
    sessionErrorPrefix: "세션 오류",
    receiptStatusTitle: "수신 상태",
    totalConfirmedRunsLabel: "확정 실행 수",
    distributedLabel: "배포 완료",
    receiptConfirmedLabel: "수신 확인 완료",
    pendingConfirmationLabel: "수신 확인 대기",
    runsTitle: "실행 목록",
    noConfirmedPayslipsLoaded: "아직 확정 급여명세를 불러오지 않았습니다.",
    netLabel: "실수령",
    deliveredLabel: "배포",
    receiptLabel: "수신",
    confirmReceiptAction: "수신 확인",
    apiLogsTitle: "요청 로그",
    apiLogsTotalLabel: "총",
    apiLogsSuccessLabel: "성공",
    apiLogsFailLabel: "실패",
    apiLogsRunningLabel: "실행 중",
    noApiCallYet: "아직 요청 이력이 없습니다.",
    backToEmployeeAction: "직원 화면으로",
    requestFailedCheckLogsStatus: "요청이 실패했습니다. 로그를 확인하세요.",
    employeeIdRequiredStatus: "직원 번호는 필수입니다.",
    loadedConfirmedPayslipsPrefix: "확정 급여명세 로드 완료",
    pendingLoadPayslipList: "급여명세 수신 대상 조회",
    pendingConfirmReceiptPrefix: "수신 확인",
    logListReceiptEligiblePayslips: "급여명세 수신 대상 조회",
    logAcknowledgePayslipReceiptPrefix: "급여명세 수신 확인",
    receiptAlreadyConfirmedPrefix: "이미 수신 확인된 실행",
    receiptConfirmedPrefix: "수신 확인 완료 실행",
    okLabel: "성공",
    failLabel: "실패"
  },
  en: {
    heroEyebrow: "FlowHR Employee",
    title: "Payslip Receipt Confirmation",
    description: "Review distributed payslips and confirm receipt for payroll close compliance.",
    filtersTitle: "Filters",
    employeeIdLabel: "Employee ID",
    periodStartLabel: "Period Start",
    periodEndLabel: "Period End",
    accessTokenLabel: "Access Token (optional)",
    bearerTokenPlaceholder: "Bearer token",
    organizationIdFallbackLabel: "Organization ID (dev fallback)",
    loadPayslipsAction: "Load Payslips",
    sessionErrorPrefix: "Session error",
    receiptStatusTitle: "Receipt Status",
    totalConfirmedRunsLabel: "Total Confirmed Runs",
    distributedLabel: "Distributed",
    receiptConfirmedLabel: "Receipt Confirmed",
    pendingConfirmationLabel: "Pending Confirmation",
    runsTitle: "Runs",
    noConfirmedPayslipsLoaded: "No confirmed payslips loaded yet.",
    netLabel: "Net",
    deliveredLabel: "Delivered",
    receiptLabel: "Receipt",
    confirmReceiptAction: "Confirm Receipt",
    apiLogsTitle: "API Logs",
    apiLogsTotalLabel: "total",
    apiLogsSuccessLabel: "success",
    apiLogsFailLabel: "fail",
    apiLogsRunningLabel: "running",
    noApiCallYet: "No API call yet.",
    backToEmployeeAction: "Back to Employee",
    requestFailedCheckLogsStatus: "request failed; check logs",
    employeeIdRequiredStatus: "employeeId is required",
    loadedConfirmedPayslipsPrefix: "loaded confirmed payslips",
    pendingLoadPayslipList: "load payslip receipt list",
    pendingConfirmReceiptPrefix: "confirm receipt",
    logListReceiptEligiblePayslips: "list receipt-eligible payslips",
    logAcknowledgePayslipReceiptPrefix: "acknowledge payslip receipt",
    receiptAlreadyConfirmedPrefix: "receipt already confirmed for",
    receiptConfirmedPrefix: "receipt confirmed for",
    okLabel: "OK",
    failLabel: "FAIL"
  }
};
