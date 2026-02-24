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
