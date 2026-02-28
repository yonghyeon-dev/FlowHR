import type { FlowLocale } from "@/lib/i18n/locales";

export type AdminSchedulingCopy = {
  eyebrow: string;
  title: string;
  description: string;
  filtersTitle: string;
  organizationIdLabel: string;
  actorIdLabel: string;
  accessTokenLabel: string;
  employeeIdLabel: string;
  fromDateLabel: string;
  toDateLabel: string;
  loadAction: string;
  createTitle: string;
  createEmployeeIdLabel: string;
  createStartLabel: string;
  createEndLabel: string;
  createBreakMinutesLabel: string;
  createHolidayLabel: string;
  createNotesLabel: string;
  createAction: string;
  holidayNo: string;
  holidayYes: string;
  listTitle: string;
  listEmpty: string;
  incidentQueueTitle: string;
  incidentStateFilterLabel: string;
  incidentStateAllLabel: string;
  incidentStateAcknowledgedLabel: string;
  incidentStateAssignedLabel: string;
  incidentStateResolvedLabel: string;
  incidentAssigneeIdLabel: string;
  incidentTopNLabel: string;
  incidentLoadAction: string;
  incidentQuickFilterLabel: string;
  incidentSummaryTotalLabel: string;
  incidentSummaryAcknowledgedLabel: string;
  incidentSummaryAssignedLabel: string;
  incidentSummaryResolvedLabel: string;
  incidentSummaryUnassignedLabel: string;
  incidentListEmpty: string;
  incidentUpdatedAtLabel: string;
  incidentHistoryCountLabel: string;
  incidentUnassignedAssigneeLabel: string;
  incidentSelectAction: string;
  incidentSelectedLabel: string;
  incidentActionTitle: string;
  incidentActionAssigneeLabel: string;
  incidentActionNoteLabel: string;
  incidentResolutionCodeLabel: string;
  incidentResolutionFalsePositiveLabel: string;
  incidentResolutionAttendanceCorrectedLabel: string;
  incidentResolutionManualConfirmedLabel: string;
  incidentResolutionOtherLabel: string;
  incidentAcknowledgeAction: string;
  incidentAssignAction: string;
  incidentResolveAction: string;
  selectAction: string;
  selectedTitle: string;
  selectedEmpty: string;
  updateAction: string;
  deleteAction: string;
  logsTitle: string;
  logsEmpty: string;
  logTotals: string;
  logSuccess: string;
  logFail: string;
  logRunning: string;
  okLabel: string;
  failLabel: string;
  statusNeedsOrganization: string;
  statusNeedsEmployee: string;
  statusNeedsRange: string;
  statusNeedsDateTime: string;
  statusInvalidDateTime: string;
  statusListLoaded: string;
  statusIncidentListLoaded: string;
  statusIncidentNeedsSelection: string;
  statusIncidentNeedsAssignee: string;
  statusIncidentAcknowledgeDone: string;
  statusIncidentAssignDone: string;
  statusIncidentResolveDone: string;
  statusCreateDone: string;
  statusUpdateDone: string;
  statusDeleteDone: string;
  pendingList: string;
  pendingIncidentList: string;
  pendingIncidentAcknowledge: string;
  pendingIncidentAssign: string;
  pendingIncidentResolve: string;
  pendingCreate: string;
  pendingUpdate: string;
  pendingDelete: string;
  loadErrorPrefix: string;
  scheduleIdLabel: string;
  periodLabel: string;
  breakLabel: string;
  holidayLabel: string;
  updatedAtLabel: string;
  notesFallback: string;
};

export type EmployeeScheduleCopy = {
  eyebrow: string;
  title: string;
  description: string;
  filtersTitle: string;
  organizationIdLabel: string;
  employeeIdLabel: string;
  fromDateLabel: string;
  toDateLabel: string;
  accessTokenLabel: string;
  loadAction: string;
  currentMonthAction: string;
  currentWeekAction: string;
  nextWeekAction: string;
  searchLabel: string;
  searchPlaceholder: string;
  clearSearchAction: string;
  exportCsvAction: string;
  exportIcsAction: string;
  visibleCountLabel: string;
  statusFilterLabel: string;
  statusFilterAll: string;
  statusFilterUpcoming: string;
  statusFilterInProgress: string;
  statusFilterCompleted: string;
  holidayFilterLabel: string;
  holidayFilterAll: string;
  holidayFilterHoliday: string;
  holidayFilterWorkday: string;
  summaryTitle: string;
  summaryTotalShifts: string;
  summaryHolidayShifts: string;
  summaryWorkHours: string;
  summaryAverageShiftHours: string;
  summaryUpcomingShifts: string;
  summaryInProgressShifts: string;
  summaryCompletedShifts: string;
  nextShiftTitle: string;
  nextShiftEmpty: string;
  listTitle: string;
  listEmpty: string;
  listFilteredEmpty: string;
  logsTitle: string;
  logsEmpty: string;
  logTotals: string;
  logSuccess: string;
  logFail: string;
  logRunning: string;
  okLabel: string;
  failLabel: string;
  statusNeedsRange: string;
  statusNeedsOrgDev: string;
  statusListLoaded: string;
  statusConflictCandidatesLabel: string;
  statusRequestTrackingHint: string;
  statusQuickCorrectionAction: string;
  statusExported: string;
  statusIcsExported: string;
  statusNoSchedulesToExport: string;
  pendingList: string;
  loadErrorPrefix: string;
  scheduleIdLabel: string;
  periodLabel: string;
  breakLabel: string;
  holidayLabel: string;
  updatedAtLabel: string;
  notesFallback: string;
  holidayNo: string;
  holidayYes: string;
  statusUpcoming: string;
  statusInProgress: string;
  statusCompleted: string;
};

export const adminSchedulingCopyByLocale: Record<FlowLocale, AdminSchedulingCopy> = {
  ko: {
    eyebrow: "FlowHR 관리자",
    title: "근무 일정 워크스페이스",
    description: "직원 근무 일정을 생성하고 기간별로 조회/수정/삭제합니다.",
    filtersTitle: "조회 조건",
    organizationIdLabel: "조직 식별자",
    actorIdLabel: "관리자 액터 식별자",
    accessTokenLabel: "액세스 토큰(선택)",
    employeeIdLabel: "조회 대상 직원 식별자",
    fromDateLabel: "조회 시작일",
    toDateLabel: "조회 종료일",
    loadAction: "일정 조회",
    createTitle: "일정 생성",
    createEmployeeIdLabel: "직원 식별자",
    createStartLabel: "근무 시작",
    createEndLabel: "근무 종료",
    createBreakMinutesLabel: "휴게(분)",
    createHolidayLabel: "휴일 근무",
    createNotesLabel: "메모(선택)",
    createAction: "일정 생성",
    holidayNo: "아니오",
    holidayYes: "예",
    listTitle: "일정 목록",
    listEmpty: "현재 조건에 해당하는 일정이 없습니다.",
    incidentQueueTitle: "이상 인시던트 조회",
    incidentStateFilterLabel: "인시던트 상태",
    incidentStateAllLabel: "전체 상태",
    incidentStateAcknowledgedLabel: "확인됨",
    incidentStateAssignedLabel: "담당자 지정",
    incidentStateResolvedLabel: "해결됨",
    incidentAssigneeIdLabel: "담당자 식별자(선택)",
    incidentTopNLabel: "조회 상한(topN)",
    incidentLoadAction: "인시던트 조회",
    incidentQuickFilterLabel: "빠른 필터",
    incidentSummaryTotalLabel: "전체",
    incidentSummaryAcknowledgedLabel: "확인됨",
    incidentSummaryAssignedLabel: "담당자 지정",
    incidentSummaryResolvedLabel: "해결됨",
    incidentSummaryUnassignedLabel: "미할당",
    incidentListEmpty: "현재 조건에 해당하는 인시던트가 없습니다.",
    incidentUpdatedAtLabel: "업데이트",
    incidentHistoryCountLabel: "이력 건수",
    incidentUnassignedAssigneeLabel: "미할당",
    incidentSelectAction: "조치 선택",
    incidentSelectedLabel: "선택 인시던트",
    incidentActionTitle: "인시던트 조치",
    incidentActionAssigneeLabel: "조치 담당자 식별자",
    incidentActionNoteLabel: "조치 메모(선택)",
    incidentResolutionCodeLabel: "해결 코드",
    incidentResolutionFalsePositiveLabel: "오탐",
    incidentResolutionAttendanceCorrectedLabel: "근태 정정 완료",
    incidentResolutionManualConfirmedLabel: "수동 확인 완료",
    incidentResolutionOtherLabel: "기타",
    incidentAcknowledgeAction: "확인 처리",
    incidentAssignAction: "담당자 지정",
    incidentResolveAction: "해결 처리",
    selectAction: "선택",
    selectedTitle: "선택 일정 수정/삭제",
    selectedEmpty: "목록에서 일정을 선택하세요.",
    updateAction: "수정 저장",
    deleteAction: "삭제",
    logsTitle: "요청 로그",
    logsEmpty: "아직 API 요청이 없습니다.",
    logTotals: "전체",
    logSuccess: "성공",
    logFail: "실패",
    logRunning: "실행 중",
    okLabel: "성공",
    failLabel: "실패",
    statusNeedsOrganization: "조직 식별자가 필요합니다.",
    statusNeedsEmployee: "직원 식별자가 필요합니다.",
    statusNeedsRange: "조회 기간을 입력하세요.",
    statusNeedsDateTime: "시작/종료 시간을 입력하세요.",
    statusInvalidDateTime: "시작/종료 시간이 올바르지 않습니다.",
    statusListLoaded: "일정 목록을 불러왔습니다.",
    statusIncidentListLoaded: "인시던트 목록을 불러왔습니다.",
    statusIncidentNeedsSelection: "조치할 인시던트를 먼저 선택하세요.",
    statusIncidentNeedsAssignee: "담당자 지정에는 담당자 식별자가 필요합니다.",
    statusIncidentAcknowledgeDone: "인시던트 확인 처리를 완료했습니다.",
    statusIncidentAssignDone: "인시던트 담당자를 지정했습니다.",
    statusIncidentResolveDone: "인시던트 해결 처리를 완료했습니다.",
    statusCreateDone: "일정을 생성했습니다.",
    statusUpdateDone: "일정을 수정했습니다.",
    statusDeleteDone: "일정을 삭제했습니다.",
    pendingList: "일정 조회",
    pendingIncidentList: "인시던트 조회",
    pendingIncidentAcknowledge: "인시던트 확인 처리",
    pendingIncidentAssign: "인시던트 담당자 지정",
    pendingIncidentResolve: "인시던트 해결 처리",
    pendingCreate: "일정 생성",
    pendingUpdate: "일정 수정",
    pendingDelete: "일정 삭제",
    loadErrorPrefix: "요청 실패",
    scheduleIdLabel: "일정 ID",
    periodLabel: "근무 시간",
    breakLabel: "휴게",
    holidayLabel: "휴일",
    updatedAtLabel: "수정 시각",
    notesFallback: "메모 없음"
  },
  en: {
    eyebrow: "FlowHR Admin",
    title: "Work Schedule Workspace",
    description: "Create schedules and manage them by date range.",
    filtersTitle: "Filters",
    organizationIdLabel: "Organization ID",
    actorIdLabel: "Admin Actor ID",
    accessTokenLabel: "Access Token (optional)",
    employeeIdLabel: "Employee ID for list query",
    fromDateLabel: "From date",
    toDateLabel: "To date",
    loadAction: "Load schedules",
    createTitle: "Create schedule",
    createEmployeeIdLabel: "Employee ID",
    createStartLabel: "Start at",
    createEndLabel: "End at",
    createBreakMinutesLabel: "Break (minutes)",
    createHolidayLabel: "Holiday shift",
    createNotesLabel: "Notes (optional)",
    createAction: "Create schedule",
    holidayNo: "No",
    holidayYes: "Yes",
    listTitle: "Schedule list",
    listEmpty: "No schedule found in current query.",
    incidentQueueTitle: "Anomaly incident queue",
    incidentStateFilterLabel: "Incident state",
    incidentStateAllLabel: "All states",
    incidentStateAcknowledgedLabel: "Acknowledged",
    incidentStateAssignedLabel: "Assigned",
    incidentStateResolvedLabel: "Resolved",
    incidentAssigneeIdLabel: "Assignee ID (optional)",
    incidentTopNLabel: "TopN limit",
    incidentLoadAction: "Load incidents",
    incidentQuickFilterLabel: "Quick filters",
    incidentSummaryTotalLabel: "Total",
    incidentSummaryAcknowledgedLabel: "Acknowledged",
    incidentSummaryAssignedLabel: "Assigned",
    incidentSummaryResolvedLabel: "Resolved",
    incidentSummaryUnassignedLabel: "Unassigned",
    incidentListEmpty: "No incidents found in current query.",
    incidentUpdatedAtLabel: "Updated at",
    incidentHistoryCountLabel: "History count",
    incidentUnassignedAssigneeLabel: "Unassigned",
    incidentSelectAction: "Select for action",
    incidentSelectedLabel: "Selected incident",
    incidentActionTitle: "Incident actions",
    incidentActionAssigneeLabel: "Action assignee ID",
    incidentActionNoteLabel: "Action note (optional)",
    incidentResolutionCodeLabel: "Resolution code",
    incidentResolutionFalsePositiveLabel: "False positive",
    incidentResolutionAttendanceCorrectedLabel: "Attendance corrected",
    incidentResolutionManualConfirmedLabel: "Manual confirmed",
    incidentResolutionOtherLabel: "Other",
    incidentAcknowledgeAction: "Acknowledge",
    incidentAssignAction: "Assign",
    incidentResolveAction: "Resolve",
    selectAction: "Select",
    selectedTitle: "Update/Delete selected schedule",
    selectedEmpty: "Select a schedule from the list.",
    updateAction: "Save update",
    deleteAction: "Delete",
    logsTitle: "API logs",
    logsEmpty: "No API call yet.",
    logTotals: "total",
    logSuccess: "success",
    logFail: "fail",
    logRunning: "running",
    okLabel: "OK",
    failLabel: "FAIL",
    statusNeedsOrganization: "organization ID is required.",
    statusNeedsEmployee: "employee ID is required.",
    statusNeedsRange: "from/to date is required.",
    statusNeedsDateTime: "start/end datetime is required.",
    statusInvalidDateTime: "start/end datetime is invalid.",
    statusListLoaded: "schedule list loaded.",
    statusIncidentListLoaded: "incident list loaded.",
    statusIncidentNeedsSelection: "Select an incident before taking action.",
    statusIncidentNeedsAssignee: "Assignee ID is required for assign action.",
    statusIncidentAcknowledgeDone: "incident acknowledged.",
    statusIncidentAssignDone: "incident assignee updated.",
    statusIncidentResolveDone: "incident resolved.",
    statusCreateDone: "schedule created.",
    statusUpdateDone: "schedule updated.",
    statusDeleteDone: "schedule deleted.",
    pendingList: "load schedules",
    pendingIncidentList: "load incidents",
    pendingIncidentAcknowledge: "acknowledge incident",
    pendingIncidentAssign: "assign incident",
    pendingIncidentResolve: "resolve incident",
    pendingCreate: "create schedule",
    pendingUpdate: "update schedule",
    pendingDelete: "delete schedule",
    loadErrorPrefix: "request failed",
    scheduleIdLabel: "Schedule ID",
    periodLabel: "Work period",
    breakLabel: "Break",
    holidayLabel: "Holiday",
    updatedAtLabel: "Updated at",
    notesFallback: "No notes"
  }
};

export const employeeScheduleCopyByLocale: Record<FlowLocale, EmployeeScheduleCopy> = {
  ko: {
    eyebrow: "FlowHR 직원",
    title: "내 근무 일정",
    description: "기간별 근무 일정을 확인하고 휴일 근무 여부를 점검합니다.",
    filtersTitle: "조회 조건",
    organizationIdLabel: "조직 식별자(개발 헤더 모드)",
    employeeIdLabel: "직원 식별자(개발 헤더 모드)",
    fromDateLabel: "조회 시작일",
    toDateLabel: "조회 종료일",
    accessTokenLabel: "액세스 토큰(선택)",
    loadAction: "내 일정 조회",
    currentMonthAction: "이번 달",
    currentWeekAction: "이번 주",
    nextWeekAction: "다음 주",
    searchLabel: "일정 검색",
    searchPlaceholder: "일정 ID/메모 검색",
    clearSearchAction: "검색 초기화",
    exportCsvAction: "CSV 내보내기",
    exportIcsAction: "ICS 내보내기",
    visibleCountLabel: "표시 일정",
    statusFilterLabel: "진행 상태 필터",
    statusFilterAll: "전체 상태",
    statusFilterUpcoming: "예정",
    statusFilterInProgress: "진행 중",
    statusFilterCompleted: "완료",
    holidayFilterLabel: "휴일 필터",
    holidayFilterAll: "전체",
    holidayFilterHoliday: "휴일 근무만",
    holidayFilterWorkday: "평일 근무만",
    summaryTitle: "요약",
    summaryTotalShifts: "근무 건수",
    summaryHolidayShifts: "휴일 근무",
    summaryWorkHours: "총 근무 시간",
    summaryAverageShiftHours: "교대당 평균 근무 시간",
    summaryUpcomingShifts: "예정 근무",
    summaryInProgressShifts: "진행 중 근무",
    summaryCompletedShifts: "완료 근무",
    nextShiftTitle: "다음 근무",
    nextShiftEmpty: "예정된 근무가 없습니다.",
    listTitle: "일정 목록",
    listEmpty: "해당 기간에 등록된 일정이 없습니다.",
    listFilteredEmpty: "현재 필터 조건에 맞는 일정이 없습니다.",
    logsTitle: "요청 로그",
    logsEmpty: "아직 API 요청이 없습니다.",
    logTotals: "전체",
    logSuccess: "성공",
    logFail: "실패",
    logRunning: "실행 중",
    okLabel: "성공",
    failLabel: "실패",
    statusNeedsRange: "조회 기간을 입력하세요.",
    statusNeedsOrgDev: "개발 헤더 모드에서는 조직 식별자가 필요합니다.",
    statusListLoaded: "내 일정을 불러왔습니다.",
    statusConflictCandidatesLabel: "충돌 후보",
    statusRequestTrackingHint: "일정 충돌이 있으면 관리자에게 근태 정정 요청으로 후속 추적을 남겨 주세요.",
    statusQuickCorrectionAction: "출퇴근 정정 요청으로 이동",
    statusExported: "CSV 파일을 내보냈습니다.",
    statusIcsExported: "ICS 파일을 내보냈습니다.",
    statusNoSchedulesToExport: "내보낼 일정이 없습니다.",
    pendingList: "내 일정 조회",
    loadErrorPrefix: "요청 실패",
    scheduleIdLabel: "일정 ID",
    periodLabel: "근무 시간",
    breakLabel: "휴게",
    holidayLabel: "휴일",
    updatedAtLabel: "수정 시각",
    notesFallback: "메모 없음",
    holidayNo: "아니오",
    holidayYes: "예",
    statusUpcoming: "예정",
    statusInProgress: "진행 중",
    statusCompleted: "완료"
  },
  en: {
    eyebrow: "FlowHR Employee",
    title: "My Work Schedule",
    description: "Check your shifts by date range and review holiday assignments.",
    filtersTitle: "Filters",
    organizationIdLabel: "Organization ID (dev header mode)",
    employeeIdLabel: "Employee ID (dev header mode)",
    fromDateLabel: "From date",
    toDateLabel: "To date",
    accessTokenLabel: "Access Token (optional)",
    loadAction: "Load my schedules",
    currentMonthAction: "Current month",
    currentWeekAction: "Current week",
    nextWeekAction: "Next week",
    searchLabel: "Schedule search",
    searchPlaceholder: "Search by schedule ID/notes",
    clearSearchAction: "Clear search",
    exportCsvAction: "Export CSV",
    exportIcsAction: "Export ICS",
    visibleCountLabel: "Visible schedules",
    statusFilterLabel: "Status filter",
    statusFilterAll: "All statuses",
    statusFilterUpcoming: "Upcoming",
    statusFilterInProgress: "In progress",
    statusFilterCompleted: "Completed",
    holidayFilterLabel: "Holiday filter",
    holidayFilterAll: "All",
    holidayFilterHoliday: "Holiday shifts only",
    holidayFilterWorkday: "Workday shifts only",
    summaryTitle: "Summary",
    summaryTotalShifts: "Total shifts",
    summaryHolidayShifts: "Holiday shifts",
    summaryWorkHours: "Total work hours",
    summaryAverageShiftHours: "Avg hours per shift",
    summaryUpcomingShifts: "Upcoming shifts",
    summaryInProgressShifts: "In progress shifts",
    summaryCompletedShifts: "Completed shifts",
    nextShiftTitle: "Next shift",
    nextShiftEmpty: "No upcoming shift.",
    listTitle: "Schedule list",
    listEmpty: "No schedule found in current range.",
    listFilteredEmpty: "No schedules match the current filters.",
    logsTitle: "API logs",
    logsEmpty: "No API call yet.",
    logTotals: "total",
    logSuccess: "success",
    logFail: "fail",
    logRunning: "running",
    okLabel: "OK",
    failLabel: "FAIL",
    statusNeedsRange: "from/to date is required.",
    statusNeedsOrgDev: "organization ID is required in dev header mode.",
    statusListLoaded: "my schedules loaded.",
    statusConflictCandidatesLabel: "Conflict candidates",
    statusRequestTrackingHint: "If shifts overlap, submit an attendance correction request for follow-up tracking.",
    statusQuickCorrectionAction: "Open attendance correction request",
    statusExported: "CSV export completed.",
    statusIcsExported: "ICS export completed.",
    statusNoSchedulesToExport: "No schedules to export.",
    pendingList: "load my schedules",
    loadErrorPrefix: "request failed",
    scheduleIdLabel: "Schedule ID",
    periodLabel: "Work period",
    breakLabel: "Break",
    holidayLabel: "Holiday",
    updatedAtLabel: "Updated at",
    notesFallback: "No notes",
    holidayNo: "No",
    holidayYes: "Yes",
    statusUpcoming: "Upcoming",
    statusInProgress: "In progress",
    statusCompleted: "Completed"
  }
};
