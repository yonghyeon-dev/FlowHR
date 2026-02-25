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
  statusCreateDone: string;
  statusUpdateDone: string;
  statusDeleteDone: string;
  pendingList: string;
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
  statusExported: string;
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
    title: "근무 스케줄 워크스페이스",
    description: "직원 스케줄을 생성하고 기간별로 조회/수정/삭제합니다.",
    filtersTitle: "조회 조건",
    organizationIdLabel: "조직 식별자",
    actorIdLabel: "관리자 Actor ID",
    accessTokenLabel: "접근 토큰(선택)",
    employeeIdLabel: "조회 대상 직원 번호",
    fromDateLabel: "조회 시작일",
    toDateLabel: "조회 종료일",
    loadAction: "스케줄 조회",
    createTitle: "스케줄 생성",
    createEmployeeIdLabel: "직원 번호",
    createStartLabel: "근무 시작",
    createEndLabel: "근무 종료",
    createBreakMinutesLabel: "휴게(분)",
    createHolidayLabel: "휴일 근무",
    createNotesLabel: "메모(선택)",
    createAction: "스케줄 생성",
    holidayNo: "아니오",
    holidayYes: "예",
    listTitle: "스케줄 목록",
    listEmpty: "조회된 스케줄이 없습니다.",
    selectAction: "선택",
    selectedTitle: "선택 스케줄 수정/삭제",
    selectedEmpty: "목록에서 스케줄을 선택하세요.",
    updateAction: "수정 저장",
    deleteAction: "삭제",
    logsTitle: "요청 로그",
    logsEmpty: "아직 API 호출이 없습니다.",
    logTotals: "전체",
    logSuccess: "성공",
    logFail: "실패",
    logRunning: "실행 중",
    okLabel: "성공",
    failLabel: "실패",
    statusNeedsOrganization: "조직 식별자가 필요합니다.",
    statusNeedsEmployee: "직원 번호가 필요합니다.",
    statusNeedsRange: "조회 기간을 입력하세요.",
    statusNeedsDateTime: "시작/종료 시간을 입력하세요.",
    statusInvalidDateTime: "시작/종료 시간이 올바르지 않습니다.",
    statusListLoaded: "스케줄 목록을 불러왔습니다.",
    statusCreateDone: "스케줄을 생성했습니다.",
    statusUpdateDone: "스케줄을 수정했습니다.",
    statusDeleteDone: "스케줄을 삭제했습니다.",
    pendingList: "스케줄 조회",
    pendingCreate: "스케줄 생성",
    pendingUpdate: "스케줄 수정",
    pendingDelete: "스케줄 삭제",
    loadErrorPrefix: "요청 실패",
    scheduleIdLabel: "스케줄 ID",
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
    statusCreateDone: "schedule created.",
    statusUpdateDone: "schedule updated.",
    statusDeleteDone: "schedule deleted.",
    pendingList: "load schedules",
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
    title: "내 근무 스케줄",
    description: "기간별 근무 일정을 확인하고 휴일 근무 여부를 점검합니다.",
    filtersTitle: "조회 조건",
    organizationIdLabel: "조직 식별자(개발 헤더 모드)",
    employeeIdLabel: "직원 번호(개발 헤더 모드)",
    fromDateLabel: "조회 시작일",
    toDateLabel: "조회 종료일",
    accessTokenLabel: "접근 토큰(선택)",
    loadAction: "내 스케줄 조회",
    currentMonthAction: "이번 달",
    currentWeekAction: "이번 주",
    nextWeekAction: "다음 주",
    searchLabel: "\uC2A4\uCF00\uC904 \uAC80\uC0C9",
    searchPlaceholder: "\uC2A4\uCF00\uC904 ID/\uBA54\uBAA8 \uAC80\uC0C9",
    clearSearchAction: "\uAC80\uC0C9 \uCD08\uAE30\uD654",
    exportCsvAction: "CSV \uB0B4\uBCF4\uB0B4\uAE30",
    visibleCountLabel: "\uD45C\uC2DC \uC2A4\uCF00\uC904",
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
    listTitle: "스케줄 목록",
    listEmpty: "해당 기간에 등록된 스케줄이 없습니다.",
    listFilteredEmpty: "현재 필터 조건에 맞는 스케줄이 없습니다.",
    logsTitle: "요청 로그",
    logsEmpty: "아직 API 호출이 없습니다.",
    logTotals: "전체",
    logSuccess: "성공",
    logFail: "실패",
    logRunning: "실행 중",
    okLabel: "성공",
    failLabel: "실패",
    statusNeedsRange: "조회 기간을 입력하세요.",
    statusNeedsOrgDev: "개발 헤더 모드에서는 조직 식별자가 필요합니다.",
    statusListLoaded: "내 스케줄을 불러왔습니다.",
    statusExported: "CSV 파일을 내보냈습니다.",
    statusNoSchedulesToExport: "내보낼 스케줄이 없습니다.",
    pendingList: "내 스케줄 조회",
    loadErrorPrefix: "요청 실패",
    scheduleIdLabel: "스케줄 ID",
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
    statusExported: "CSV export completed.",
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
