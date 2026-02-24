const REQUEST_STATUS_LABELS_BY_LOCALE = {
  ko: {
    PENDING: "대기",
    APPROVED: "승인",
    REJECTED: "반려",
    CANCELED: "취소"
  },
  en: {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELED: "Canceled"
  }
} as const;

const LEAVE_TYPE_LABELS_BY_LOCALE = {
  ko: {
    ANNUAL: "연차",
    SICK: "병가",
    UNPAID: "무급"
  },
  en: {
    ANNUAL: "Annual",
    SICK: "Sick",
    UNPAID: "Unpaid"
  }
} as const;

const PRE_SUBMIT_STATUS_LABELS_BY_LOCALE = {
  ko: {
    pass: "통과",
    fail: "실패"
  },
  en: {
    pass: "Pass",
    fail: "Fail"
  }
} as const;

const LIST_BADGE_LABELS_BY_LOCALE = {
  ko: {
    empty: "없음",
    applied: "적용됨",
    holiday: "휴일",
    work: "근무",
    success: "성공",
    fail: "실패"
  },
  en: {
    empty: "None",
    applied: "Applied",
    holiday: "Holiday",
    work: "Work",
    success: "Success",
    fail: "Fail"
  }
} as const;

const LEAVE_CALENDAR_WEEKDAYS_BY_LOCALE = {
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
} as const;

const ATTENDANCE_NOTE_PRESETS_BY_LOCALE = {
  ko: ["퇴근 누락 정정", "출근 시각 정정", "휴게시간 정정"],
  en: ["Missed checkout correction", "Check-in time correction", "Break time correction"]
} as const;

const DEFAULT_CANCEL_REASON_BY_LOCALE = {
  ko: "개인 사정으로 취소",
  en: "Canceled due to personal reason"
} as const;

const EMPLOYEE_SURFACE_COPY_BY_LOCALE = {
  ko: {
    attendance: {
      checkInTime: "출근 시각",
      checkOutTime: "퇴근 시각",
      breakMinutes: "휴게 분",
      holidayWork: "휴일 근무",
      noOption: "아니오",
      yesOption: "예",
      correctionNote: "정정/메모",
      recentTargetRecordId: "최근/대상 기록 ID",
      selectCorrectionTargetRecord: "정정 대상 기록 선택",
      selectFromRecentRecords: "최근 기록에서 선택",
      workTimeDelta: "근무시간 변화",
      preSubmitChecks: "제출 직전 검증",
      passed: "통과",
      preSubmitChecksAriaLabel: "출퇴근 제출 직전 검증",
      loadSelectedRecord: "선택 기록 불러오기",
      loadLatestRecord: "최근 기록 불러오기",
      noRecords: "출퇴근 기록이 없습니다.",
      selectAction: "선택",
      noComparisonTarget: "비교 대상 없음"
    },
    leave: {
      leaveType: "휴가 유형",
      requestUnit: "신청 단위",
      fullDay: "일 단위",
      halfDay: "반차",
      hourly: "시간 단위",
      startDate: "시작일",
      endDate: "종료일",
      hours: "시간(시)",
      cancelReason: "취소 사유",
      requestReasonOptional: "신청 사유(선택)",
      recentTargetRequestId: "최근/대상 요청 ID",
      preSubmitChecks: "제출 직전 검증",
      passed: "통과",
      preSubmitChecksAriaLabel: "휴가 제출 직전 검증",
      quickPresetsAriaLabel: "휴가 빠른 입력",
      todayHalfDay: "오늘 반차",
      tomorrowFullDay: "내일 하루",
      nextMonday: "다음주 월요일",
      noRequests: "휴가 요청이 없습니다.",
      dayUnitSuffix: "일",
      hourUnitSuffix: "시간",
      halfDaySuffix: "반차"
    },
    leaveCalendar: {
      usageRateLabel: "연차 사용률",
      usedLabel: "사용",
      grantedLabel: "부여",
      visualizationAriaLabel: "연차 잔여 시각화",
      usageRateShort: "사용률",
      visualizationHint: "잔여 연차 데이터를 불러오면 시각화가 활성화됩니다.",
      densityViewLabel: "밀도 보기",
      quickNavigationAriaLabel: "캘린더 빠른 이동",
      previousMonth: "이전 달",
      currentMonth: "이번 달",
      nextMonth: "다음 달",
      noScheduleInDateLabel: "휴가 일정 없음",
      noScheduleLabel: "일정 없음",
      itemSuffix: "건",
      approvedLabel: "승인",
      pendingLabel: "대기",
      rejectedLabel: "반려",
      rejectedOrCanceledLabel: "반려/취소",
      noScheduleInRange: "이번 조회 구간에 휴가 일정이 없습니다."
    },
    schedule: {
      devSchedulingCockpit: "(dev) 스케줄링 Cockpit",
      noSchedules: "근무 일정이 없습니다.",
      breakMinutesFormat: (minutes: number) => `휴게 ${minutes}분`
    },
    apiLogs: {
      runningNow: "현재 실행 중",
      none: "없음",
      totalCalls: "총 호출",
      successLabel: "성공",
      failLabel: "실패",
      summary: (success: number, fail: number) => `건 (성공 ${success}건, 실패 ${fail}건)`,
      clearLogs: "로그 초기화"
    }
  },
  en: {
    attendance: {
      checkInTime: "Check-in time",
      checkOutTime: "Check-out time",
      breakMinutes: "Break minutes",
      holidayWork: "Holiday work",
      noOption: "No",
      yesOption: "Yes",
      correctionNote: "Correction note",
      recentTargetRecordId: "Recent/target record ID",
      selectCorrectionTargetRecord: "Select correction target record",
      selectFromRecentRecords: "Select from recent records",
      workTimeDelta: "Work-time delta",
      preSubmitChecks: "Pre-submit checks",
      passed: "passed",
      preSubmitChecksAriaLabel: "Attendance pre-submit checks",
      loadSelectedRecord: "Load selected record",
      loadLatestRecord: "Load latest record",
      noRecords: "No attendance records.",
      selectAction: "Select",
      noComparisonTarget: "No comparison target"
    },
    leave: {
      leaveType: "Leave type",
      requestUnit: "Request unit",
      fullDay: "Full day",
      halfDay: "Half day",
      hourly: "Hourly",
      startDate: "Start date",
      endDate: "End date",
      hours: "Hours",
      cancelReason: "Cancel reason",
      requestReasonOptional: "Request reason (optional)",
      recentTargetRequestId: "Recent/target request ID",
      preSubmitChecks: "Pre-submit checks",
      passed: "passed",
      preSubmitChecksAriaLabel: "Leave pre-submit checks",
      quickPresetsAriaLabel: "Leave quick presets",
      todayHalfDay: "Today half-day",
      tomorrowFullDay: "Tomorrow full-day",
      nextMonday: "Next Monday",
      noRequests: "No leave requests.",
      dayUnitSuffix: "d",
      hourUnitSuffix: "h",
      halfDaySuffix: "Half day"
    },
    leaveCalendar: {
      usageRateLabel: "Leave usage rate",
      usedLabel: "used",
      grantedLabel: "granted",
      visualizationAriaLabel: "Leave balance visualization",
      usageRateShort: "Usage rate",
      visualizationHint: "Visualization is enabled after leave balance is loaded.",
      densityViewLabel: "density view",
      quickNavigationAriaLabel: "Calendar quick navigation",
      previousMonth: "Previous month",
      currentMonth: "Current month",
      nextMonth: "Next month",
      noScheduleInDateLabel: "no leave schedule",
      noScheduleLabel: "No schedule",
      itemSuffix: " items",
      approvedLabel: "approved",
      pendingLabel: "pending",
      rejectedLabel: "rejected",
      rejectedOrCanceledLabel: "rejected/canceled",
      noScheduleInRange: "No leave schedule in the current range."
    },
    schedule: {
      devSchedulingCockpit: "(dev) Scheduling Cockpit",
      noSchedules: "No schedules.",
      breakMinutesFormat: (minutes: number) => `Break ${minutes}m`
    },
    apiLogs: {
      runningNow: "Running now",
      none: "none",
      totalCalls: "Total calls",
      successLabel: "success",
      failLabel: "fail",
      summary: (success: number, fail: number) => ` (success ${success}, fail ${fail})`,
      clearLogs: "Clear logs"
    }
  }
} as const;

export function isDefaultEmployeeCancelReason(reason: string) {
  return reason === DEFAULT_CANCEL_REASON_BY_LOCALE.ko || reason === DEFAULT_CANCEL_REASON_BY_LOCALE.en;
}

export function resolveEmployeeLocaleLabelBundle(isKoLocale: boolean) {
  const localeKey = isKoLocale ? "ko" : "en";

  return {
    requestStatusLabels: REQUEST_STATUS_LABELS_BY_LOCALE[localeKey],
    leaveTypeLabels: LEAVE_TYPE_LABELS_BY_LOCALE[localeKey],
    preSubmitStatusLabels: PRE_SUBMIT_STATUS_LABELS_BY_LOCALE[localeKey],
    listBadgeLabels: LIST_BADGE_LABELS_BY_LOCALE[localeKey],
    leaveCalendarWeekdays: LEAVE_CALENDAR_WEEKDAYS_BY_LOCALE[localeKey],
    attendanceNotePresets: ATTENDANCE_NOTE_PRESETS_BY_LOCALE[localeKey],
    defaultCancelReason: DEFAULT_CANCEL_REASON_BY_LOCALE[localeKey],
    surfaceCopy: EMPLOYEE_SURFACE_COPY_BY_LOCALE[localeKey],
    notConfiguredLabel: isKoLocale ? "미설정" : "not configured",
    runtimeLocale: isKoLocale ? "ko-KR" : "en-US",
    correctionRequestNote: isKoLocale ? "정정 요청" : "Correction request",
    callApiLabels: {
      attendanceList: isKoLocale ? "내 출퇴근 조회" : "Load my attendance",
      leaveList: isKoLocale ? "내 휴가 요청 조회" : "Load my leave requests",
      scheduleList: isKoLocale ? "내 근무 일정 조회" : "Load my schedules",
      leaveBalance: isKoLocale ? "내 휴가 잔여 조회" : "Load my leave balance",
      createAttendance: isKoLocale ? "출퇴근 기록 생성" : "Create attendance record",
      checkOutNow: isKoLocale ? "퇴근 처리(지금)" : "Check-out now",
      requestAttendanceCorrection: isKoLocale ? "출퇴근 정정(요청)" : "Request attendance correction",
      createLeave: isKoLocale ? "휴가 신청" : "Create leave request",
      cancelLeave: isKoLocale ? "휴가 취소" : "Cancel leave request"
    }
  } as const;
}

export function formatEmployeeDeltaMinutes(deltaMinutes: number, isKoLocale: boolean) {
  if (deltaMinutes === 0) {
    return isKoLocale ? "변화 없음" : "No change";
  }
  const absMinutes = Math.abs(deltaMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(isKoLocale ? `${hours}시간` : `${hours}h`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(isKoLocale ? `${minutes}분` : `${minutes}m`);
  }
  const sign = deltaMinutes > 0 ? "+" : "-";
  return `${sign}${parts.join(" ")}`;
}

export function extractEmployeeErrorMessage(body: unknown, isKoLocale: boolean) {
  if (body === null || body === undefined) {
    return isKoLocale ? "서버 응답이 비어 있습니다." : "Server response is empty.";
  }
  if (typeof body === "string") {
    return body.trim().length > 0 ? body : isKoLocale ? "알 수 없는 오류" : "Unknown error";
  }
  if (typeof body !== "object") {
    return String(body);
  }

  const record = body as Record<string, unknown>;
  const candidates = [record.error, record.message, record.reason, record.detail];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  const errors = record.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === "string") {
      return first;
    }
    if (first && typeof first === "object") {
      const firstRecord = first as Record<string, unknown>;
      if (typeof firstRecord.message === "string" && firstRecord.message.trim().length > 0) {
        return firstRecord.message;
      }
    }
  }

  try {
    const compact = JSON.stringify(body);
    return compact.length > 140 ? `${compact.slice(0, 140)}...` : compact;
  } catch {
    return isKoLocale ? "응답을 해석할 수 없습니다." : "Response cannot be parsed.";
  }
}
