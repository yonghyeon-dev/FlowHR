import type { FlowLocale } from "@/lib/i18n/locales";

export type EmployeeYearEndInputCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  inputTitle: string;
  yearLabel: string;
  employeeIdLabel: string;
  nonTaxableAnnualIncomeLabel: string;
  earnedIncomeTaxCreditLabel: string;
  childTaxCreditLabel: string;
  additionalTaxCreditLabel: string;
  personalPensionLabel: string;
  insurancePremiumLabel: string;
  medicalExpenseLabel: string;
  educationExpenseLabel: string;
  donationLabel: string;
  housingSavingsLabel: string;
  annualIncomeTaxRateLabel: string;
  localIncomeTaxRateLabel: string;
  accessTokenLabel: string;
  bearerTokenPlaceholder: string;
  organizationIdFallbackLabel: string;
  loadFinalizedSettlementAction: string;
  pendingFinalizedSettlement: string;
  loadFinalizedSettlementLogLabel: string;
  validationTitle: string;
  validationChecklistAriaLabel: string;
  validationYearLabel: string;
  validationEmployeeIdLabel: string;
  validationTaxRatesLabel: string;
  validationAmountsLabel: string;
  validationNonTaxableLabel: string;
  validationPassLabel: string;
  validationFailLabel: string;
  coreLoadInvalidGuide: string;
  requestFailedStatus: string;
  requestFailedCheckLogsStatus: string;
  loadedStatusPrefix: string;
  simulationTitle: string;
  loadFirstGuide: string;
  summaryFinalization: string;
  summaryGrossPay: string;
  summaryAppliedDeduction: string;
  summaryTaxableAnnualIncome: string;
  summaryAppliedTaxCredit: string;
  summaryEstimatedLiability: string;
  summaryBaselineLiability: string;
  summaryLiabilityChange: string;
  summaryWithholdingDelta: string;
  summaryAdditionalDueRefund: string;
  capsGuide: string;
  accuracyGuideTitle: string;
  accuracyGuideNoSimulation: string;
  accuracyGuideNoWarnings: string;
  accuracyGuideCapAppliedPrefix: string;
  accuracyGuideNonTaxableAdjusted: string;
  accuracyGuideLiabilityIncreasePrefix: string;
  accuracyGuideLiabilityDecreasePrefix: string;
  accuracyGuideLiabilityNoChange: string;
  accuracyGuideAdditionalDuePrefix: string;
  accuracyGuideRefundPrefix: string;
  apiLogsTitle: string;
  apiLogsTotalPrefix: string;
  apiLogsRunningPrefix: string;
  apiLogsEmpty: string;
  okLabel: string;
  failLabel: string;
  openWithholdingReceiptAction: string;
  backToEmployeeAction: string;
  sessionErrorPrefix: string;
};

export const employeeYearEndInputCopyByLocale: Record<FlowLocale, EmployeeYearEndInputCopy> = {
  ko: {
    heroEyebrow: "FlowHR 직원",
    title: "연말정산 입력 시뮬레이터",
    description: "확정된 정산 결과를 불러와 공제/세액공제 입력 영향도를 제출 전에 시뮬레이션합니다.",
    inputTitle: "입력",
    yearLabel: "연도",
    employeeIdLabel: "직원 번호",
    nonTaxableAnnualIncomeLabel: "비과세 연간 소득",
    earnedIncomeTaxCreditLabel: "근로소득 세액공제",
    childTaxCreditLabel: "자녀 세액공제",
    additionalTaxCreditLabel: "추가 세액공제",
    personalPensionLabel: "개인연금",
    insurancePremiumLabel: "보험료",
    medicalExpenseLabel: "의료비",
    educationExpenseLabel: "교육비",
    donationLabel: "기부금",
    housingSavingsLabel: "주택저축",
    annualIncomeTaxRateLabel: "연간 소득세율",
    localIncomeTaxRateLabel: "지방소득세율",
    accessTokenLabel: "연결 토큰(선택)",
    bearerTokenPlaceholder: "액세스 토큰",
    organizationIdFallbackLabel: "운영 조직(개발용 대체값)",
    loadFinalizedSettlementAction: "확정 정산 불러오기",
    pendingFinalizedSettlement: "확정 정산 조회",
    loadFinalizedSettlementLogLabel: "확정 정산 조회",
    validationTitle: "실시간 입력 검증",
    validationChecklistAriaLabel: "연말정산 입력 검증 체크리스트",
    validationYearLabel: "연도(2000~2100)",
    validationEmployeeIdLabel: "직원 번호 입력",
    validationTaxRatesLabel: "세율(0~1 범위)",
    validationAmountsLabel: "금액 입력(0 이상 정수)",
    validationNonTaxableLabel: "비과세 연소득 <= 연 총지급(정산 로드 후)",
    validationPassLabel: "통과",
    validationFailLabel: "실패",
    coreLoadInvalidGuide: "연도와 직원 번호를 먼저 확인해 주세요.",
    requestFailedStatus: "요청이 실패했습니다",
    requestFailedCheckLogsStatus: "요청이 실패했습니다. 로그를 확인하세요.",
    loadedStatusPrefix: "조회 완료",
    simulationTitle: "시뮬레이션 결과",
    loadFirstGuide: "먼저 확정 정산을 불러오세요.",
    summaryFinalization: "확정 ID",
    summaryGrossPay: "총급여",
    summaryAppliedDeduction: "적용 공제",
    summaryTaxableAnnualIncome: "과세 연간 소득",
    summaryAppliedTaxCredit: "적용 세액공제",
    summaryEstimatedLiability: "예상 세부담",
    summaryBaselineLiability: "기준 세부담",
    summaryLiabilityChange: "세부담 증감",
    summaryWithholdingDelta: "원천징수 차액",
    summaryAdditionalDueRefund: "추가 납부 / 환급",
    capsGuide:
      "한도: 소득공제(개인연금 7,000,000 / 보험료 1,000,000 / 의료비 15,000,000 / 교육비 9,000,000 / 기부금 10,000,000 / 주택저축 4,000,000), 세액공제(근로 740,000 / 자녀 900,000 / 추가 1,000,000).",
    accuracyGuideTitle: "정확도 가이드",
    accuracyGuideNoSimulation: "시뮬레이션 결과를 불러오면 자동 가이드가 표시됩니다.",
    accuracyGuideNoWarnings: "현재 입력 기준으로 보정/주의 항목이 없습니다.",
    accuracyGuideCapAppliedPrefix: "한도 적용",
    accuracyGuideNonTaxableAdjusted: "비과세 연소득이 총급여를 초과해 총급여 기준으로 보정됩니다.",
    accuracyGuideLiabilityIncreasePrefix: "예상 세부담 증가",
    accuracyGuideLiabilityDecreasePrefix: "예상 세부담 감소",
    accuracyGuideLiabilityNoChange: "예상 세부담 변동이 없습니다.",
    accuracyGuideAdditionalDuePrefix: "추가 납부 예상",
    accuracyGuideRefundPrefix: "환급 예상",
    apiLogsTitle: "요청 로그",
    apiLogsTotalPrefix: "총",
    apiLogsRunningPrefix: "실행 중",
    apiLogsEmpty: "아직 API 호출이 없습니다.",
    okLabel: "성공",
    failLabel: "실패",
    openWithholdingReceiptAction: "원천징수영수증 열기",
    backToEmployeeAction: "직원 화면으로",
    sessionErrorPrefix: "세션 오류"
  },
  en: {
    heroEyebrow: "FlowHR Employee",
    title: "Year-End Input Simulator",
    description:
      "Load your finalized settlement and simulate deduction/tax-credit input effects before HR submission.",
    inputTitle: "Input",
    yearLabel: "Year",
    employeeIdLabel: "Employee number",
    nonTaxableAnnualIncomeLabel: "Non-taxable Annual Income",
    earnedIncomeTaxCreditLabel: "Earned Income Tax Credit",
    childTaxCreditLabel: "Child Tax Credit",
    additionalTaxCreditLabel: "Additional Tax Credit",
    personalPensionLabel: "Personal Pension",
    insurancePremiumLabel: "Insurance Premium",
    medicalExpenseLabel: "Medical Expense",
    educationExpenseLabel: "Education Expense",
    donationLabel: "Donation",
    housingSavingsLabel: "Housing Savings",
    annualIncomeTaxRateLabel: "Annual Income Tax Rate",
    localIncomeTaxRateLabel: "Local Income Tax Rate",
    accessTokenLabel: "Connection token (optional)",
    bearerTokenPlaceholder: "Bearer token",
    organizationIdFallbackLabel: "Organization (dev fallback)",
    loadFinalizedSettlementAction: "Load Finalized Settlement",
    pendingFinalizedSettlement: "finalized settlement load",
    loadFinalizedSettlementLogLabel: "load finalized settlement",
    validationTitle: "Real-time Input Validation",
    validationChecklistAriaLabel: "Year-end input validation checklist",
    validationYearLabel: "Year (2000~2100)",
    validationEmployeeIdLabel: "Employee number provided",
    validationTaxRatesLabel: "Tax rates in 0~1 range",
    validationAmountsLabel: "Amount fields are non-negative integers",
    validationNonTaxableLabel: "Non-taxable annual income <= annual gross pay",
    validationPassLabel: "PASS",
    validationFailLabel: "FAIL",
    coreLoadInvalidGuide: "Check year and employee ID before loading finalized settlement.",
    requestFailedStatus: "request failed",
    requestFailedCheckLogsStatus: "request failed; check logs",
    loadedStatusPrefix: "loaded",
    simulationTitle: "Simulation Result",
    loadFirstGuide: "Load finalized settlement first.",
    summaryFinalization: "Finalization",
    summaryGrossPay: "Gross Pay",
    summaryAppliedDeduction: "Applied Deduction",
    summaryTaxableAnnualIncome: "Taxable Annual Income",
    summaryAppliedTaxCredit: "Applied Tax Credit",
    summaryEstimatedLiability: "Estimated Liability",
    summaryBaselineLiability: "Baseline Liability",
    summaryLiabilityChange: "Liability Change",
    summaryWithholdingDelta: "Withholding Delta",
    summaryAdditionalDueRefund: "Additional Due / Refund",
    capsGuide:
      "Caps: deduction(personal pension 7,000,000 / insurance 1,000,000 / medical 15,000,000 / education 9,000,000 / donation 10,000,000 / housing 4,000,000), tax credit(earned 740,000 / child 900,000 / additional 1,000,000).",
    accuracyGuideTitle: "Accuracy Guide",
    accuracyGuideNoSimulation: "Load simulation result to see auto guidance.",
    accuracyGuideNoWarnings: "No correction/warning items for current input.",
    accuracyGuideCapAppliedPrefix: "Cap applied",
    accuracyGuideNonTaxableAdjusted: "Non-taxable annual income exceeded annual gross pay and was adjusted.",
    accuracyGuideLiabilityIncreasePrefix: "Estimated liability increases",
    accuracyGuideLiabilityDecreasePrefix: "Estimated liability decreases",
    accuracyGuideLiabilityNoChange: "Estimated liability unchanged.",
    accuracyGuideAdditionalDuePrefix: "Additional withholding due",
    accuracyGuideRefundPrefix: "Expected refund",
    apiLogsTitle: "API Logs",
    apiLogsTotalPrefix: "total",
    apiLogsRunningPrefix: "running",
    apiLogsEmpty: "No API call yet.",
    okLabel: "OK",
    failLabel: "FAIL",
    openWithholdingReceiptAction: "Open Withholding Receipt",
    backToEmployeeAction: "Back to Employee",
    sessionErrorPrefix: "Session error"
  }
};
