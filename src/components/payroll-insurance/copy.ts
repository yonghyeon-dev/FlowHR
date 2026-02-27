import { type FlowLocale } from "@/lib/i18n/locales";

export type PayrollInsuranceCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  inputTitle: string;
  employeeIdLabel: string;
  periodStartLabel: string;
  periodEndLabel: string;
  hourlyRateLabel: string;
  nonTaxableIncomeLabel: string;
  priorWithheldLabel: string;
  priorEmployerPaidLabel: string;
  nationalPensionCapLabel: string;
  healthInsuranceCapLabel: string;
  employmentInsuranceCapLabel: string;
  policyModeLabel: string;
  policyModeManualOption: string;
  policyModePresetOption: string;
  policyModeAutoOption: string;
  policyPresetIdLabel: string;
  policyAsOfLabel: string;
  roundingModeLabel: string;
  roundOption: string;
  floorOption: string;
  ceilOption: string;
  nationalPensionUnitLabel: string;
  healthInsuranceUnitLabel: string;
  longTermCareUnitLabel: string;
  employmentInsuranceUnitLabel: string;
  industrialAccidentUnitLabel: string;
  accessTokenLabel: string;
  bearerTokenPlaceholder: string;
  actorIdFallbackLabel: string;
  organizationIdFallbackLabel: string;
  previewAction: string;
  summaryTitle: string;
  noResultYet: string;
  grossTaxableLabel: string;
  employeeTotalLabel: string;
  employerTotalLabel: string;
  totalDeltaLabel: string;
  policyPresetSummaryLabel: string;
  policyRatesSummaryLabel: string;
  policyCapsSummaryLabel: string;
  policyManualFallbackLabel: string;
  policyAutoTagLabel: string;
  policyNoCapLabel: string;
  roundingLabel: string;
  componentsTitle: string;
  noContributionBreakdownYet: string;
  employeeContributionLabel: string;
  employerContributionLabel: string;
  employeeRawContributionLabel: string;
  employerRawContributionLabel: string;
  contributionBasesLabel: string;
  priorWithheldPaidLabel: string;
  apiLogsTitle: string;
  apiLogsTotalLabel: string;
  apiLogsSuccessLabel: string;
  apiLogsFailLabel: string;
  apiLogsRunningLabel: string;
  noApiCallYet: string;
  backToAdmin: string;
  sessionErrorPrefix: string;
  statusEmployeeRequired: string;
  statusRequestFailed: string;
  statusLoadedPrefix: string;
  statusTotalDeltaLabel: string;
  statusInvalidInput: string;
  statusNonNegativeInteger: string;
  statusPositiveInteger: string;
  statusOptionalCapInteger: string;
  pendingPreview: string;
  logPreview: string;
  okLabel: string;
  failLabel: string;
};

const defaultCopy: PayrollInsuranceCopy = {
  heroEyebrow: "FlowHR Admin",
  title: "Payroll Insurance Settlement",
  description:
    "Preview employee/employer 4-insurance contributions and settlement deltas for a payroll period.",
  inputTitle: "Input",
  employeeIdLabel: "Employee ID",
  periodStartLabel: "Period Start",
  periodEndLabel: "Period End",
  hourlyRateLabel: "Hourly Rate (KRW)",
  nonTaxableIncomeLabel: "Non-taxable Income (KRW)",
  priorWithheldLabel: "Prior Withheld (KRW)",
  priorEmployerPaidLabel: "Prior Employer Paid (KRW)",
  nationalPensionCapLabel: "National Pension Cap (optional)",
  healthInsuranceCapLabel: "Health Insurance Cap (optional)",
  employmentInsuranceCapLabel: "Employment Insurance Cap (optional)",
  policyModeLabel: "Insurance Policy Mode",
  policyModeManualOption: "manual",
  policyModePresetOption: "preset id",
  policyModeAutoOption: "preset auto",
  policyPresetIdLabel: "Insurance Policy Preset ID (optional)",
  policyAsOfLabel: "Insurance Policy As-Of (optional)",
  roundingModeLabel: "Rounding Mode",
  roundOption: "round",
  floorOption: "floor",
  ceilOption: "ceil",
  nationalPensionUnitLabel: "NP Unit (KRW)",
  healthInsuranceUnitLabel: "HI Unit (KRW)",
  longTermCareUnitLabel: "LTC Unit (KRW)",
  employmentInsuranceUnitLabel: "EI Unit (KRW)",
  industrialAccidentUnitLabel: "IA Unit (KRW)",
  accessTokenLabel: "Access Token (optional)",
  bearerTokenPlaceholder: "Bearer token",
  actorIdFallbackLabel: "Actor ID (dev fallback)",
  organizationIdFallbackLabel: "Organization ID (dev fallback)",
  previewAction: "Preview Settlement",
  summaryTitle: "Summary",
  noResultYet: "No result yet.",
  grossTaxableLabel: "Gross / Taxable",
  employeeTotalLabel: "Employee Total",
  employerTotalLabel: "Employer Total",
  totalDeltaLabel: "Total Delta",
  policyPresetSummaryLabel: "Policy Preset",
  policyRatesSummaryLabel: "Policy Rates",
  policyCapsSummaryLabel: "Policy Caps NP/HI/EI",
  policyManualFallbackLabel: "manual",
  policyAutoTagLabel: "auto",
  policyNoCapLabel: "none",
  roundingLabel: "Rounding",
  componentsTitle: "Components",
  noContributionBreakdownYet: "No contribution breakdown yet.",
  employeeContributionLabel: "Employee NP/HI/LTC/EI",
  employerContributionLabel: "Employer NP/HI/LTC/EI/IA",
  employeeRawContributionLabel: "Employee Raw NP/HI/LTC/EI",
  employerRawContributionLabel: "Employer Raw NP/HI/LTC/EI/IA",
  contributionBasesLabel: "Bases NP/HI/EI/IA",
  priorWithheldPaidLabel: "Prior Withheld / Paid",
  apiLogsTitle: "API Logs",
  apiLogsTotalLabel: "total",
  apiLogsSuccessLabel: "success",
  apiLogsFailLabel: "fail",
  apiLogsRunningLabel: "running",
  noApiCallYet: "No API call yet.",
  backToAdmin: "Back to Admin",
  sessionErrorPrefix: "Session error",
  statusEmployeeRequired: "employeeId is required",
  statusRequestFailed: "request failed; check logs",
  statusLoadedPrefix: "loaded gross",
  statusTotalDeltaLabel: "total delta",
  statusInvalidInput: "invalid input",
  statusNonNegativeInteger: "must be a non-negative integer",
  statusPositiveInteger: "must be a positive integer",
  statusOptionalCapInteger: "optional cap values must be non-negative integers",
  pendingPreview: "payroll insurance settlement preview",
  logPreview: "preview insurance settlement",
  okLabel: "OK",
  failLabel: "FAIL"
};

export const payrollInsuranceCopyByLocale: Record<FlowLocale, PayrollInsuranceCopy> = {
  ko: {
    ...defaultCopy,
    heroEyebrow: "FlowHR 관리자",
    title: "급여 4대보험 정산",
    description: "급여 기간 기준으로 근로자/사업주 4대보험 기여금과 정산 차이를 미리 확인합니다.",
    inputTitle: "입력",
    employeeIdLabel: "직원 번호",
    periodStartLabel: "기간 시작",
    periodEndLabel: "기간 종료",
    hourlyRateLabel: "시급 (KRW)",
    nonTaxableIncomeLabel: "비과세 소득 (KRW)",
    priorWithheldLabel: "기납부 공제 (KRW)",
    priorEmployerPaidLabel: "기납부 사업주 부담금 (KRW)",
    nationalPensionCapLabel: "국민연금 상한 (선택)",
    healthInsuranceCapLabel: "건강보험 상한 (선택)",
    employmentInsuranceCapLabel: "고용보험 상한 (선택)",
    roundingModeLabel: "반올림 모드",
    roundOption: "반올림",
    floorOption: "내림",
    ceilOption: "올림",
    nationalPensionUnitLabel: "NP 단위 (KRW)",
    healthInsuranceUnitLabel: "HI 단위 (KRW)",
    longTermCareUnitLabel: "LTC 단위 (KRW)",
    employmentInsuranceUnitLabel: "EI 단위 (KRW)",
    industrialAccidentUnitLabel: "IA 단위 (KRW)",
    accessTokenLabel: "액세스 토큰 (선택)",
    bearerTokenPlaceholder: "베어러 토큰",
    actorIdFallbackLabel: "액터 식별자 (개발용 대체값)",
    organizationIdFallbackLabel: "조직 식별자 (개발용 대체값)",
    previewAction: "정산 프리뷰",
    summaryTitle: "요약",
    noResultYet: "아직 결과가 없습니다.",
    grossTaxableLabel: "총지급 / 과세기준",
    employeeTotalLabel: "근로자 부담 합계",
    employerTotalLabel: "사업주 부담 합계",
    totalDeltaLabel: "총 정산 차이",
    roundingLabel: "반올림",
    componentsTitle: "상세 구성",
    noContributionBreakdownYet: "아직 기여금 상세가 없습니다.",
    employeeContributionLabel: "근로자 NP/HI/LTC/EI",
    employerContributionLabel: "사업주 NP/HI/LTC/EI/IA",
    employeeRawContributionLabel: "근로자 원시 NP/HI/LTC/EI",
    employerRawContributionLabel: "사업주 원시 NP/HI/LTC/EI/IA",
    contributionBasesLabel: "기준금액 NP/HI/EI/IA",
    priorWithheldPaidLabel: "기납부 공제 / 부담금",
    apiLogsTitle: "요청 로그",
    apiLogsTotalLabel: "총",
    apiLogsSuccessLabel: "성공",
    apiLogsFailLabel: "실패",
    apiLogsRunningLabel: "실행 중",
    noApiCallYet: "아직 API 호출이 없습니다.",
    backToAdmin: "관리자 화면으로",
    sessionErrorPrefix: "세션 오류",
    statusEmployeeRequired: "직원 번호는 필수입니다.",
    statusRequestFailed: "요청이 실패했습니다. 로그를 확인하세요.",
    statusLoadedPrefix: "총지급 불러오기",
    statusTotalDeltaLabel: "총 정산 차이",
    statusInvalidInput: "입력값이 올바르지 않습니다.",
    statusNonNegativeInteger: "0 이상의 정수여야 합니다.",
    statusPositiveInteger: "1 이상의 정수여야 합니다.",
    statusOptionalCapInteger: "상한값은 0 이상의 정수여야 합니다.",
    pendingPreview: "급여 4대보험 정산 프리뷰",
    logPreview: "급여 4대보험 정산 프리뷰",
    okLabel: "성공",
    failLabel: "실패"
  },
  en: defaultCopy
};
