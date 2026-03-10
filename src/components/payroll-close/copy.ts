import { type FlowLocale } from "@/lib/i18n/locales";

export type PayrollCloseCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  dashboardSourceBanner: string;
  dashboardSourceFocusLabel: string;
  focusPreviewedLabel: string;
  focusUndistributedLabel: string;
  focusAllLabel: string;
  inputTitle: string;
  sessionOrganizationLabel: string;
  sessionActorLabel: string;
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
  incomeTaxLabel: string;
  residentTaxLabel: string;
  nationalPensionLabel: string;
  healthInsuranceLabel: string;
  employmentInsuranceLabel: string;
  industrialAccidentLabel: string;
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

const copyEn: PayrollCloseCopy = {
  heroEyebrow: "FlowHR Admin",
  title: "Payroll Close Period",
  description:
    "Preview or apply period close workflow with settlement deltas from confirmed payroll runs.",
  dashboardSourceBanner: "Opened from admin dashboard",
  dashboardSourceFocusLabel: "Focused queue",
  focusPreviewedLabel: "Previewed runs",
  focusUndistributedLabel: "Undistributed runs",
  focusAllLabel: "Payroll close queue",
  inputTitle: "Input",
  sessionOrganizationLabel: "Workspace status",
  sessionActorLabel: "Admin session status",
  periodStartLabel: "Period Start",
  periodEndLabel: "Period End",
  priorPaidWithholdingLabel: "Prior Paid Withholding (KRW)",
  priorPaidSocialInsuranceLabel: "Prior Paid Social Insurance (KRW)",
  priorPaidNetPayoutLabel: "Prior Paid Net Payout (KRW)",
  accessTokenLabel: "Connection token (optional)",
  bearerTokenPlaceholder: "Bearer token",
  actorIdFallbackLabel: "Admin account (dev fallback)",
  organizationIdFallbackLabel: "Organization (dev fallback)",
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
  incomeTaxLabel: "Income Tax",
  residentTaxLabel: "Resident Tax",
  nationalPensionLabel: "National Pension",
  healthInsuranceLabel: "Health Insurance",
  employmentInsuranceLabel: "Employment Insurance",
  industrialAccidentLabel: "Industrial Accident Insurance",
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
  statusRequestFailed: "We couldn't complete the request. Review the current state and try again.",
  statusLoadedCloseSummaryPrefix: "loaded close summary; remittance delta",
  statusLoadedCloseSummaryBlocked: "loaded close summary with blocking reasons",
  statusInvalidInput: "Review the entered values and try again.",
  statusNonNegativeInteger: "must be a non-negative integer",
  logPreview: "preview close period",
  logApply: "apply close period",
  pendingPreview: "payroll close preview",
  pendingApply: "payroll close apply",
  okLabel: "OK",
  failLabel: "FAIL"
};

const copyKo: PayrollCloseCopy = {
  heroEyebrow: "FlowHR 관리자",
  title: "급여 마감",
  description: "확정 급여 실행 기준으로 정산 차이를 미리 보고 마감 적용 여부를 확인합니다.",
  dashboardSourceBanner: "관리자 대시보드에서 이동했습니다",
  dashboardSourceFocusLabel: "집중 대기함",
  focusPreviewedLabel: "미확정 실행",
  focusUndistributedLabel: "미배포 실행",
  focusAllLabel: "급여 마감 대기함",
  inputTitle: "입력",
  sessionOrganizationLabel: "작업 공간 상태",
  sessionActorLabel: "관리자 세션 상태",
  periodStartLabel: "기간 시작",
  periodEndLabel: "기간 종료",
  priorPaidWithholdingLabel: "기납부 원천세 (KRW)",
  priorPaidSocialInsuranceLabel: "기납부 사회보험 (KRW)",
  priorPaidNetPayoutLabel: "기지급 실지급액 (KRW)",
  accessTokenLabel: "연결 토큰(선택)",
  bearerTokenPlaceholder: "베어러 토큰",
  actorIdFallbackLabel: "관리자 계정(개발 대체값)",
  organizationIdFallbackLabel: "운영 조직(개발 대체값)",
  previewAction: "마감 미리보기",
  applyAction: "마감 적용",
  sessionErrorPrefix: "세션 오류",
  runStatesTitle: "실행 상태",
  noCloseSummaryYet: "아직 마감 요약이 없습니다.",
  canCloseLabel: "마감 가능",
  yes: "예",
  no: "아니오",
  totalConfirmedPreviewedLabel: "전체 / 확정 / 미리보기",
  blockingRunIdsLabel: "차단 실행 ID",
  blockingReasonsLabel: "차단 사유",
  totalsDeltaTitle: "합계 / 차이",
  noTotalsYet: "아직 합계가 없습니다.",
  grossNetLabel: "총지급 / 실지급",
  withholdingSocialInsuranceLabel: "원천세 / 사회보험",
  incomeTaxLabel: "소득세",
  residentTaxLabel: "주민세",
  nationalPensionLabel: "국민연금",
  healthInsuranceLabel: "건강보험",
  employmentInsuranceLabel: "고용보험",
  industrialAccidentLabel: "산재보험",
  deductionsOtherLabel: "공제합계 / 기타공제",
  withholdingDeltaLabel: "원천세 차이",
  socialInsuranceDeltaLabel: "사회보험 차이",
  netPayDeltaLabel: "실지급 차이",
  remittanceDeltaLabel: "납부 차이",
  apiLogsTitle: "요청 로그",
  apiLogsTotalLabel: "총",
  apiLogsSuccessLabel: "성공",
  apiLogsFailLabel: "실패",
  apiLogsRunningLabel: "실행 중",
  noApiCallYet: "아직 API 호출 이력이 없습니다.",
  backToAdmin: "관리자 화면으로",
  statusRequestFailed: "요청을 완료하지 못했습니다. 현재 상태를 확인한 뒤 다시 시도해 주세요.",
  statusLoadedCloseSummaryPrefix: "마감 요약을 불러왔습니다. 납부 차이",
  statusLoadedCloseSummaryBlocked: "차단 사유가 있는 마감 요약을 불러왔습니다.",
  statusInvalidInput: "입력값을 다시 확인해 주세요.",
  statusNonNegativeInteger: "0 이상의 정수여야 합니다",
  logPreview: "급여 마감 미리보기",
  logApply: "급여 마감 적용",
  pendingPreview: "급여 마감 미리보기",
  pendingApply: "급여 마감 적용",
  okLabel: "성공",
  failLabel: "실패"
};

export const payrollCloseCopyByLocale: Record<FlowLocale, PayrollCloseCopy> = {
  ko: copyKo,
  en: copyEn
};
