import { type FlowLocale } from "@/lib/i18n/locales";

export type PayrollCloseCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  inputTitle: string;
  periodStartLabel: string;
  periodEndLabel: string;
  priorPaidWithholdingLabel: string;
  priorPaidSocialInsuranceLabel: string;
  priorPaidNetPayoutLabel: string;
  accessTokenLabel: string;
  bearerTokenPlaceholder: string;
  actorIdFallbackLabel: string;
  organizationIdFallbackLabel: string;
  previewAction: string;
  applyAction: string;
  sessionErrorPrefix: string;
  runStatesTitle: string;
  noCloseSummaryYet: string;
  canCloseLabel: string;
  yes: string;
  no: string;
  totalConfirmedPreviewedLabel: string;
  blockingRunIdsLabel: string;
  blockingReasonsLabel: string;
  totalsDeltaTitle: string;
  noTotalsYet: string;
  grossNetLabel: string;
  withholdingSocialInsuranceLabel: string;
  deductionsOtherLabel: string;
  withholdingDeltaLabel: string;
  socialInsuranceDeltaLabel: string;
  netPayDeltaLabel: string;
  remittanceDeltaLabel: string;
  apiLogsTitle: string;
  apiLogsTotalLabel: string;
  apiLogsSuccessLabel: string;
  apiLogsFailLabel: string;
  apiLogsRunningLabel: string;
  noApiCallYet: string;
  backToAdmin: string;
  statusRequestFailed: string;
  statusLoadedCloseSummaryPrefix: string;
  statusLoadedCloseSummaryBlocked: string;
  statusInvalidInput: string;
  statusNonNegativeInteger: string;
  logPreview: string;
  logApply: string;
  pendingPreview: string;
  pendingApply: string;
  okLabel: string;
  failLabel: string;
};

const defaultCopy: PayrollCloseCopy = {
  heroEyebrow: "FlowHR Admin",
  title: "Payroll Close Period",
  description:
    "Preview/apply period-close workflow with withholding settlement deltas from confirmed payroll runs.",
  inputTitle: "Input",
  periodStartLabel: "Period Start",
  periodEndLabel: "Period End",
  priorPaidWithholdingLabel: "Prior Paid Withholding (KRW)",
  priorPaidSocialInsuranceLabel: "Prior Paid Social Insurance (KRW)",
  priorPaidNetPayoutLabel: "Prior Paid Net Payout (KRW)",
  accessTokenLabel: "Access Token (optional)",
  bearerTokenPlaceholder: "Bearer token",
  actorIdFallbackLabel: "Actor ID (dev fallback)",
  organizationIdFallbackLabel: "Organization ID (dev fallback)",
  previewAction: "Preview Close",
  applyAction: "Apply Close",
  sessionErrorPrefix: "Session error",
  runStatesTitle: "Run States",
  noCloseSummaryYet: "No close summary yet.",
  canCloseLabel: "Can Close",
  yes: "YES",
  no: "NO",
  totalConfirmedPreviewedLabel: "Total / Confirmed / Previewed",
  blockingRunIdsLabel: "Blocking Run IDs",
  blockingReasonsLabel: "Blocking Reasons",
  totalsDeltaTitle: "Totals / Delta",
  noTotalsYet: "No totals yet.",
  grossNetLabel: "Gross / Net",
  withholdingSocialInsuranceLabel: "Withholding / Social Insurance",
  deductionsOtherLabel: "Deductions / Other",
  withholdingDeltaLabel: "Withholding Delta",
  socialInsuranceDeltaLabel: "Social Insurance Delta",
  netPayDeltaLabel: "Net Pay Delta",
  remittanceDeltaLabel: "Remittance Delta",
  apiLogsTitle: "API Logs",
  apiLogsTotalLabel: "total",
  apiLogsSuccessLabel: "success",
  apiLogsFailLabel: "fail",
  apiLogsRunningLabel: "running",
  noApiCallYet: "No API call yet.",
  backToAdmin: "Back to Admin",
  statusRequestFailed: "request failed; check logs",
  statusLoadedCloseSummaryPrefix: "loaded close summary; remittance delta",
  statusLoadedCloseSummaryBlocked: "loaded close summary with blocking reasons",
  statusInvalidInput: "invalid input",
  statusNonNegativeInteger: "must be a non-negative integer",
  logPreview: "preview close period",
  logApply: "apply close period",
  pendingPreview: "payroll period close preview",
  pendingApply: "payroll period close apply",
  okLabel: "OK",
  failLabel: "FAIL"
};

export const payrollCloseCopyByLocale: Record<FlowLocale, PayrollCloseCopy> = {
  ko: {
    ...defaultCopy,
    heroEyebrow: "FlowHR 관리자",
    title: "급여 마감",
    description: "확정된 급여 실행 기준으로 원천세/사회보험 정산 차이를 프리뷰하고 마감 적용합니다.",
    inputTitle: "입력",
    periodStartLabel: "기간 시작",
    periodEndLabel: "기간 종료",
    priorPaidWithholdingLabel: "기납부 원천세 (KRW)",
    priorPaidSocialInsuranceLabel: "기납부 사회보험 (KRW)",
    priorPaidNetPayoutLabel: "기지급 실지급액 (KRW)",
    accessTokenLabel: "Access Token (선택)",
    bearerTokenPlaceholder: "Bearer 토큰",
    actorIdFallbackLabel: "Actor ID (개발 fallback)",
    organizationIdFallbackLabel: "조직 ID (개발 fallback)",
    previewAction: "마감 프리뷰",
    applyAction: "마감 적용",
    sessionErrorPrefix: "세션 오류",
    runStatesTitle: "실행 상태",
    noCloseSummaryYet: "아직 마감 요약이 없습니다.",
    canCloseLabel: "마감 가능",
    yes: "예",
    no: "아니오",
    totalConfirmedPreviewedLabel: "전체 / 확정 / 프리뷰",
    blockingRunIdsLabel: "차단 실행 ID",
    blockingReasonsLabel: "차단 사유",
    totalsDeltaTitle: "합계 / 차이",
    noTotalsYet: "아직 합계가 없습니다.",
    grossNetLabel: "총지급 / 실지급",
    withholdingSocialInsuranceLabel: "원천세 / 사회보험",
    deductionsOtherLabel: "공제합계 / 기타공제",
    withholdingDeltaLabel: "원천세 차이",
    socialInsuranceDeltaLabel: "사회보험 차이",
    netPayDeltaLabel: "실지급 차이",
    remittanceDeltaLabel: "납부 차이",
    apiLogsTitle: "API 로그",
    apiLogsTotalLabel: "총",
    apiLogsSuccessLabel: "성공",
    apiLogsFailLabel: "실패",
    apiLogsRunningLabel: "실행 중",
    noApiCallYet: "아직 API 호출이 없습니다.",
    backToAdmin: "관리자 화면으로",
    statusRequestFailed: "요청이 실패했습니다. 로그를 확인하세요.",
    statusLoadedCloseSummaryPrefix: "마감 요약을 불러왔습니다. 납부 차이",
    statusLoadedCloseSummaryBlocked: "차단 사유가 있는 마감 요약을 불러왔습니다.",
    statusInvalidInput: "입력값이 올바르지 않습니다.",
    statusNonNegativeInteger: "0 이상의 정수여야 합니다.",
    logPreview: "급여 마감 프리뷰",
    logApply: "급여 마감 적용",
    pendingPreview: "급여 마감 프리뷰 실행",
    pendingApply: "급여 마감 적용 실행",
    okLabel: "성공",
    failLabel: "실패"
  },
  en: defaultCopy
};
