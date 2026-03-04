import { type FlowLocale } from "@/lib/i18n/locales";

export type PayslipReceiptCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  filtersTitle: string;
  sessionOrganizationLabel: string;
  sessionEmployeeLabel: string;
  periodStartLabel: string;
  periodEndLabel: string;
  loadPayslipsAction: string;
  sessionErrorPrefix: string;
  receiptStatusTitle: string;
  totalConfirmedRunsLabel: string;
  distributedLabel: string;
  receiptConfirmedLabel: string;
  pendingConfirmationLabel: string;
  runsTitle: string;
  runsSearchLabel: string;
  runsSearchPlaceholder: string;
  runsStatusFilterLabel: string;
  runsStatusFilterAllOption: string;
  runsStatusFilterPendingOption: string;
  runsStatusFilterConfirmedOption: string;
  runsStatusFilterUndistributedOption: string;
  clearSearchAction: string;
  visibleRunsLabel: string;
  visiblePendingRunsLabel: string;
  statusCountSummaryLabel: string;
  noConfirmedPayslipsLoaded: string;
  noFilteredRunsMessage: string;
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
  productionSessionRequiredNotice: string;
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
    description: "배포된 급여명세서를 확인하고 수신 상태를 처리합니다.",
    filtersTitle: "필터",
    sessionOrganizationLabel: "세션 조직",
    sessionEmployeeLabel: "세션 직원",
    periodStartLabel: "기간 시작",
    periodEndLabel: "기간 종료",
    loadPayslipsAction: "급여명세서 불러오기",
    sessionErrorPrefix: "세션 오류",
    receiptStatusTitle: "수신 상태",
    totalConfirmedRunsLabel: "확정 실행 수",
    distributedLabel: "배포 완료",
    receiptConfirmedLabel: "수신 확인 완료",
    pendingConfirmationLabel: "수신 확인 대기",
    runsTitle: "실행 목록",
    runsSearchLabel: "명세서 검색",
    runsSearchPlaceholder: "실행 번호/기간/배포/수신 검색",
    runsStatusFilterLabel: "실행 상태 필터",
    runsStatusFilterAllOption: "전체",
    runsStatusFilterPendingOption: "수신 확인 대기",
    runsStatusFilterConfirmedOption: "수신 확인 완료",
    runsStatusFilterUndistributedOption: "미배포",
    clearSearchAction: "검색 초기화",
    visibleRunsLabel: "표시 명세서",
    visiblePendingRunsLabel: "표시 대기 건",
    statusCountSummaryLabel: "상태 요약",
    noConfirmedPayslipsLoaded: "아직 확정 급여명세서를 불러오지 않았습니다.",
    noFilteredRunsMessage: "현재 검색 조건에 맞는 명세서가 없습니다.",
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
    productionSessionRequiredNotice: "운영 환경에서는 로그인 세션이 필요합니다.",
    employeeIdRequiredStatus: "직원 번호는 필수입니다.",
    loadedConfirmedPayslipsPrefix: "확정 급여명세서 로드 완료",
    pendingLoadPayslipList: "급여명세서 수신 대상 조회",
    pendingConfirmReceiptPrefix: "수신 확인",
    logListReceiptEligiblePayslips: "급여명세서 수신 대상 조회",
    logAcknowledgePayslipReceiptPrefix: "급여명세서 수신 확인",
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
    sessionOrganizationLabel: "Session organization",
    sessionEmployeeLabel: "Session employee",
    periodStartLabel: "Period Start",
    periodEndLabel: "Period End",
    loadPayslipsAction: "Load Payslips",
    sessionErrorPrefix: "Session error",
    receiptStatusTitle: "Receipt Status",
    totalConfirmedRunsLabel: "Total Confirmed Runs",
    distributedLabel: "Distributed",
    receiptConfirmedLabel: "Receipt Confirmed",
    pendingConfirmationLabel: "Pending Confirmation",
    runsTitle: "Runs",
    runsSearchLabel: "Runs search",
    runsSearchPlaceholder: "Search by run ID/period/delivery/receipt",
    runsStatusFilterLabel: "Run status filter",
    runsStatusFilterAllOption: "All",
    runsStatusFilterPendingOption: "Pending receipt confirmation",
    runsStatusFilterConfirmedOption: "Receipt confirmed",
    runsStatusFilterUndistributedOption: "Undistributed",
    clearSearchAction: "Clear search",
    visibleRunsLabel: "Visible runs",
    visiblePendingRunsLabel: "Visible pending runs",
    statusCountSummaryLabel: "Status summary",
    noConfirmedPayslipsLoaded: "No confirmed payslips loaded yet.",
    noFilteredRunsMessage: "No runs match the current search.",
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
    productionSessionRequiredNotice: "A login session is required in production.",
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

