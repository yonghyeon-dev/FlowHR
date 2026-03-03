import { type FlowLocale } from "@/lib/i18n/locales";

export type PayrollPayslipDeliveryCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  dashboardSourceBanner: string;
  dashboardSourceFocusLabel: string;
  focusUndistributedLabel: string;
  focusAllLabel: string;
  inputTitle: string;
  sessionOrganizationLabel: string;
  sessionActorLabel: string;
  periodStartLabel: string;
  periodEndLabel: string;
  employeeIdOptionalLabel: string;
  employeeIdPlaceholder: string;
  deliveryChannelLabel: string;
  deliveryChannelInAppLabel: string;
  deliveryChannelEmailLabel: string;
  accessTokenLabel: string;
  bearerTokenPlaceholder: string;
  actorIdFallbackLabel: string;
  organizationIdFallbackLabel: string;
  dryRunAction: string;
  applyDeliveryAction: string;
  sessionErrorPrefix: string;
  runStatesTitle: string;
  noDistributionSummaryYet: string;
  totalConfirmedPreviewedLabel: string;
  targetCountLabel: string;
  alreadyDistributedLabel: string;
  newlyDistributedLabel: string;
  runIdsTitle: string;
  noRunIdsYet: string;
  targetRunsLabel: string;
  alreadyDistributedRunsLabel: string;
  newlyDistributedRunsLabel: string;
  apiLogsTitle: string;
  apiLogsTotalLabel: string;
  apiLogsSuccessLabel: string;
  apiLogsFailLabel: string;
  apiLogsRunningLabel: string;
  noApiCallYet: string;
  backToAdminAction: string;
  statusRequestFailed: string;
  statusDryRunTargetPrefix: string;
  statusRunsSuffix: string;
  statusDistributedPrefix: string;
  statusInvalidInput: string;
  pendingDryRun: string;
  pendingApply: string;
  logDryRun: string;
  logApply: string;
  okLabel: string;
  failLabel: string;
};

const copyEn: PayrollPayslipDeliveryCopy = {
  heroEyebrow: "FlowHR Admin",
  title: "Payroll Payslip Delivery",
  description:
    "Distribute confirmed payroll payslips and track delivery baseline before employee receipt confirmation.",
  dashboardSourceBanner: "Opened from admin dashboard",
  dashboardSourceFocusLabel: "Focused queue",
  focusUndistributedLabel: "Undistributed runs",
  focusAllLabel: "Payslip delivery queue",
  inputTitle: "Distribution Input",
  sessionOrganizationLabel: "Session organization",
  sessionActorLabel: "Session actor",
  periodStartLabel: "Period Start",
  periodEndLabel: "Period End",
  employeeIdOptionalLabel: "Employee ID (optional)",
  employeeIdPlaceholder: "EMP-1001",
  deliveryChannelLabel: "Delivery Channel",
  deliveryChannelInAppLabel: "in_app",
  deliveryChannelEmailLabel: "email",
  accessTokenLabel: "Access Token (optional)",
  bearerTokenPlaceholder: "Bearer token",
  actorIdFallbackLabel: "Actor ID (dev fallback)",
  organizationIdFallbackLabel: "Organization ID (dev fallback)",
  dryRunAction: "Dry-run",
  applyDeliveryAction: "Apply Delivery",
  sessionErrorPrefix: "Session error",
  runStatesTitle: "Run States",
  noDistributionSummaryYet: "No distribution summary yet.",
  totalConfirmedPreviewedLabel: "Total / Confirmed / Previewed",
  targetCountLabel: "Target Count",
  alreadyDistributedLabel: "Already Distributed",
  newlyDistributedLabel: "Newly Distributed",
  runIdsTitle: "Run IDs",
  noRunIdsYet: "No run IDs yet.",
  targetRunsLabel: "Target Runs",
  alreadyDistributedRunsLabel: "Already Distributed Runs",
  newlyDistributedRunsLabel: "Newly Distributed Runs",
  apiLogsTitle: "API Logs",
  apiLogsTotalLabel: "total",
  apiLogsSuccessLabel: "success",
  apiLogsFailLabel: "fail",
  apiLogsRunningLabel: "running",
  noApiCallYet: "No API call yet.",
  backToAdminAction: "Back to Admin",
  statusRequestFailed: "request failed; check logs",
  statusDryRunTargetPrefix: "dry-run target",
  statusRunsSuffix: "runs",
  statusDistributedPrefix: "distributed",
  statusInvalidInput: "invalid input",
  pendingDryRun: "payslip distribution dry-run",
  pendingApply: "payslip distribution apply",
  logDryRun: "dry-run distribute payslips",
  logApply: "apply distribute payslips",
  okLabel: "OK",
  failLabel: "FAIL"
};

const copyKo: PayrollPayslipDeliveryCopy = {
  heroEyebrow: "FlowHR 관리자",
  title: "급여명세 배포",
  description: "확정된 급여명세서를 배포하고 직원 수신확인 전 상태를 점검합니다.",
  dashboardSourceBanner: "관리자 대시보드에서 이동했습니다",
  dashboardSourceFocusLabel: "집중 대기함",
  focusUndistributedLabel: "미배포 실행",
  focusAllLabel: "명세 배포 대기함",
  inputTitle: "배포 입력",
  sessionOrganizationLabel: "세션 조직",
  sessionActorLabel: "세션 액터",
  periodStartLabel: "기간 시작",
  periodEndLabel: "기간 종료",
  employeeIdOptionalLabel: "직원 번호(선택)",
  employeeIdPlaceholder: "EMP-1001",
  deliveryChannelLabel: "배포 채널",
  deliveryChannelInAppLabel: "인앱",
  deliveryChannelEmailLabel: "이메일",
  accessTokenLabel: "액세스 토큰(선택)",
  bearerTokenPlaceholder: "베어러 토큰",
  actorIdFallbackLabel: "액터 식별자(개발 대체값)",
  organizationIdFallbackLabel: "조직 식별자(개발 대체값)",
  dryRunAction: "드라이런",
  applyDeliveryAction: "배포 적용",
  sessionErrorPrefix: "세션 오류",
  runStatesTitle: "실행 상태",
  noDistributionSummaryYet: "아직 배포 요약이 없습니다.",
  totalConfirmedPreviewedLabel: "전체 / 확정 / 미리보기",
  targetCountLabel: "대상 수",
  alreadyDistributedLabel: "기배포 수",
  newlyDistributedLabel: "신규 배포 수",
  runIdsTitle: "실행 ID",
  noRunIdsYet: "아직 실행 ID가 없습니다.",
  targetRunsLabel: "대상 실행",
  alreadyDistributedRunsLabel: "기배포 실행",
  newlyDistributedRunsLabel: "신규 배포 실행",
  apiLogsTitle: "요청 로그",
  apiLogsTotalLabel: "총",
  apiLogsSuccessLabel: "성공",
  apiLogsFailLabel: "실패",
  apiLogsRunningLabel: "실행 중",
  noApiCallYet: "아직 API 호출 이력이 없습니다.",
  backToAdminAction: "관리자 화면으로",
  statusRequestFailed: "요청이 실패했습니다. 로그를 확인하세요.",
  statusDryRunTargetPrefix: "드라이런 대상",
  statusRunsSuffix: "건",
  statusDistributedPrefix: "배포 완료",
  statusInvalidInput: "입력값이 올바르지 않습니다.",
  pendingDryRun: "급여명세 배포 드라이런",
  pendingApply: "급여명세 배포 적용",
  logDryRun: "급여명세 배포 드라이런",
  logApply: "급여명세 배포 적용",
  okLabel: "성공",
  failLabel: "실패"
};

export const payrollPayslipDeliveryCopyByLocale: Record<FlowLocale, PayrollPayslipDeliveryCopy> = {
  ko: copyKo,
  en: copyEn
};
