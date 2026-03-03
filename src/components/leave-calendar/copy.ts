import { type FlowLocale } from "@/lib/i18n/locales";

export type LeaveCalendarCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  queryTitle: string;
  organizationIdLabel: string;
  departmentIdOptionalLabel: string;
  fromLabel: string;
  toLabel: string;
  includePendingLabel: string;
  overlapWarningThresholdLabel: string;
  includePendingNoOption: string;
  includePendingYesOption: string;
  adminActorIdFallbackLabel: string;
  accessTokenLabel: string;
  bearerTokenPlaceholder: string;
  loadCalendarAction: string;
  sessionErrorPrefix: string;
  summaryTitle: string;
  noQueryResultYet: string;
  organizationLabel: string;
  rangeLabel: string;
  employeesEntriesLabel: string;
  warningsLabel: string;
  warningDaysTitle: string;
  noOverlapWarningDay: string;
  approvedPendingLabel: string;
  entriesTitle: string;
  noLeaveEntryInRange: string;
  showingFirstEntriesSuffix: string;
  apiLogsTitle: string;
  apiLogsTotalLabel: string;
  apiLogsSuccessLabel: string;
  apiLogsFailLabel: string;
  apiLogsRunningLabel: string;
  noApiCallYet: string;
  backToAdminAction: string;
  leaveAccrualAction: string;
  requestFailedCheckLogsStatus: string;
  fromToRequiredStatus: string;
  overlapThresholdInvalidStatus: string;
  pendingLeaveCalendarQuery: string;
  logLeaveCalendarQuery: string;
  loadedSummaryPrefix: string;
  daysLabel: string;
  entriesLabel: string;
  approvedStateLabel: string;
  pendingStateLabel: string;
  annualLeaveTypeLabel: string;
  sickLeaveTypeLabel: string;
  unpaidLeaveTypeLabel: string;
  fullDayUnitLabel: string;
  halfDayUnitLabel: string;
  hourUnitLabel: string;
  okLabel: string;
  failLabel: string;
};

export const leaveCalendarCopyByLocale: Record<FlowLocale, LeaveCalendarCopy> = {
  ko: {
    heroEyebrow: "FlowHR 관리자",
    title: "휴가 캘린더",
    description: "부서별 휴가 점유와 중첩 경고를 조회합니다.",
    queryTitle: "조회 조건",
    organizationIdLabel: "조직 식별자",
    departmentIdOptionalLabel: "부서 ID(선택)",
    fromLabel: "시작일",
    toLabel: "종료일",
    includePendingLabel: "대기 포함",
    overlapWarningThresholdLabel: "중첩 경고 임계값",
    includePendingNoOption: "아니오",
    includePendingYesOption: "예",
    adminActorIdFallbackLabel: "관리자 액터 식별자(개발용 대체값)",
    accessTokenLabel: "액세스 토큰(선택)",
    bearerTokenPlaceholder: "베어러 토큰",
    loadCalendarAction: "캘린더 불러오기",
    sessionErrorPrefix: "세션 오류",
    summaryTitle: "요약",
    noQueryResultYet: "아직 조회 결과가 없습니다.",
    organizationLabel: "조직",
    rangeLabel: "기간",
    employeesEntriesLabel: "직원 수 / 엔트리 수",
    warningsLabel: "경고",
    warningDaysTitle: "경고 일자",
    noOverlapWarningDay: "중첩 경고 일자가 없습니다.",
    approvedPendingLabel: "승인 / 대기",
    entriesTitle: "엔트리",
    noLeaveEntryInRange: "범위 내 휴가 엔트리가 없습니다.",
    showingFirstEntriesSuffix: "처음 80개 엔트리만 표시합니다.",
    apiLogsTitle: "요청 로그",
    apiLogsTotalLabel: "총",
    apiLogsSuccessLabel: "성공",
    apiLogsFailLabel: "실패",
    apiLogsRunningLabel: "실행 중",
    noApiCallYet: "아직 API 호출이 없습니다.",
    backToAdminAction: "관리자 화면으로",
    leaveAccrualAction: "휴가 정산",
    requestFailedCheckLogsStatus: "요청이 실패했습니다. 로그를 확인하세요.",
    fromToRequiredStatus: "시작일/종료일은 필수입니다.",
    overlapThresholdInvalidStatus: "중첩 임계값은 1~100 사이 정수여야 합니다.",
    pendingLeaveCalendarQuery: "휴가 캘린더 조회",
    logLeaveCalendarQuery: "휴가 캘린더 조회",
    loadedSummaryPrefix: "조회 완료",
    daysLabel: "일",
    entriesLabel: "엔트리",
    approvedStateLabel: "승인",
    pendingStateLabel: "대기",
    annualLeaveTypeLabel: "연차",
    sickLeaveTypeLabel: "병가",
    unpaidLeaveTypeLabel: "무급",
    fullDayUnitLabel: "종일",
    halfDayUnitLabel: "반차",
    hourUnitLabel: "시간",
    okLabel: "성공",
    failLabel: "실패"
  },
  en: {
    heroEyebrow: "FlowHR Admin",
    title: "Leave Calendar",
    description: "Review department leave occupancy and overlap warnings.",
    queryTitle: "Filters",
    organizationIdLabel: "Organization ID",
    departmentIdOptionalLabel: "Department ID (optional)",
    fromLabel: "From",
    toLabel: "To",
    includePendingLabel: "Include Pending",
    overlapWarningThresholdLabel: "Overlap Warning Threshold",
    includePendingNoOption: "no",
    includePendingYesOption: "yes",
    adminActorIdFallbackLabel: "Admin Actor ID (dev fallback)",
    accessTokenLabel: "Access Token (optional)",
    bearerTokenPlaceholder: "Bearer token",
    loadCalendarAction: "Load Calendar",
    sessionErrorPrefix: "Session error",
    summaryTitle: "Summary",
    noQueryResultYet: "No results yet.",
    organizationLabel: "Organization",
    rangeLabel: "Range",
    employeesEntriesLabel: "Employees / Entries",
    warningsLabel: "Warnings",
    warningDaysTitle: "Warning Days",
    noOverlapWarningDay: "No overlap warning day.",
    approvedPendingLabel: "approved / pending",
    entriesTitle: "Entries",
    noLeaveEntryInRange: "No leave entry in range.",
    showingFirstEntriesSuffix: "Showing first 80 entries.",
    apiLogsTitle: "API Logs",
    apiLogsTotalLabel: "total",
    apiLogsSuccessLabel: "success",
    apiLogsFailLabel: "fail",
    apiLogsRunningLabel: "running",
    noApiCallYet: "No API call yet.",
    backToAdminAction: "Back to Admin",
    leaveAccrualAction: "Leave Accrual",
    requestFailedCheckLogsStatus: "request failed; check logs",
    fromToRequiredStatus: "from/to date is required",
    overlapThresholdInvalidStatus: "overlap threshold must be an integer between 1 and 100",
    pendingLeaveCalendarQuery: "load leave calendar",
    logLeaveCalendarQuery: "load leave calendar",
    loadedSummaryPrefix: "loaded",
    daysLabel: "days",
    entriesLabel: "entries",
    approvedStateLabel: "approved",
    pendingStateLabel: "pending",
    annualLeaveTypeLabel: "annual",
    sickLeaveTypeLabel: "sick",
    unpaidLeaveTypeLabel: "unpaid",
    fullDayUnitLabel: "full-day",
    halfDayUnitLabel: "half-day",
    hourUnitLabel: "hour",
    okLabel: "OK",
    failLabel: "FAIL"
  }
};
