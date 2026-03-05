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
    sectionTitles: {
      attendance: "출퇴근",
      leave: "휴가",
      leaveCalendar: "휴가 캘린더",
      schedule: "근무 일정",
      apiLogs: "API 실행 로그"
    },
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
      teamScopeHint: "본인 + 같은 부서 동료 휴가를 월간 캘린더로 표시합니다.",
      legendLabel: "상태 색상",
      mineShort: "나",
      coworkerFallback: "동료",
      noScheduleInRange: "현재 조회 구간에 휴가 일정이 없습니다.",
      clickToPrefill: "날짜를 클릭하면 휴가 신청 폼이 자동 입력됩니다."
    },
    schedule: {
      devSchedulingCockpit: "(개발) 스케줄링 대시보드",
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
    sectionTitles: {
      attendance: "Attendance",
      leave: "Leave",
      leaveCalendar: "Leave calendar",
      schedule: "Work schedule",
      apiLogs: "API execution logs"
    },
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
      teamScopeHint: "Monthly calendar for your leave and same-department coworkers.",
      legendLabel: "Status colors",
      mineShort: "Me",
      coworkerFallback: "Coworker",
      noScheduleInRange: "No leave schedule in the current range.",
      clickToPrefill: "Click a date to prefill the leave request form."
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

const EMPLOYEE_VALIDATION_COPY_BY_LOCALE = {
  ko: {
    feedback: {
      pendingRequestFilterApplied: "대기 요청 필터가 적용되었습니다.",
      selectedAttendanceResubmitMissing: "선택한 출퇴근 재제출 대상이 최신 목록에 없습니다.",
      selectedLeaveResubmitMissing: "선택한 휴가 재제출 대상이 최신 목록에 없습니다.",
      attendanceResubmitDraftApplied: "출퇴근 재제출 초안을 정정 폼에 반영했습니다.",
      leaveResubmitDraftApplied: "휴가 재제출 초안을 신청 폼에 반영했습니다.",
      selectResubmitCandidateFirst: "재제출 후보를 먼저 선택해 주세요.",
      noResubmitTarget: "재제출할 반려/취소 건이 없습니다.",
      resetResubmitSelection: "재제출 후보 선택을 초기화했습니다.",
      noFailureCauseToCopy: "복사할 실패 원인이 없습니다.",
      clipboardUnavailable: "클립보드 복사를 지원하지 않는 환경입니다.",
      copiedLatestFailureCause: "최근 실패 원인을 클립보드에 복사했습니다.",
      copyFailureCauseFailed: "실패 원인 복사에 실패했습니다."
    },
    defaults: {
      resubmitCorrectionNote: "재제출 정정",
      noApiCallHistory: "아직 호출 이력이 없습니다.",
      noRecord: "기록 없음",
      working: "근무 중",
      checkedOut: "퇴근 완료",
      noReasonProvided: "사유 미기록",
      noReason: "사유 미기록",
      noNote: "메모 없음",
      attendanceRequestTitle: "출퇴근 요청",
      leaveRequestTitle: "휴가 요청",
      attendanceRejectedSource: "출퇴근 반려",
      leaveRejectedSource: "휴가 반려",
      leaveCanceledSource: "휴가 취소",
      rejectionReasonMissing: "반려 사유가 기록되지 않았습니다.",
      reasonMissing: "사유가 기록되지 않았습니다.",
      notComparable: "비교 불가"
    },
    summaryCards: {
      pendingRequestsLabel: "대기 요청",
      pendingRequestsDetail: (attendancePending: number, leavePending: number) =>
        `출퇴근 ${attendancePending} / 휴가 ${leavePending}`,
      completionRateLabel: "처리 완료율",
      completionRateDetail: (approvedCount: number, needsActionCount: number) =>
        `승인 ${approvedCount} / 조치 필요 ${needsActionCount}`,
      resubmitNeededLabel: "재제출 필요",
      resubmitNeededDetail: (count: number) => `${count}건 반려/취소`,
      noResubmitNeededDetail: "반려/취소 요청 없음",
      apiFailuresLabel: "API 실패",
      apiFailuresDetail: (successCount: number, failCount: number) => `성공 ${successCount} / 실패 ${failCount}`
    },
    requestFeedback: {
      rejectionReasonPrefix: "반려 사유",
      cancelReasonPrefix: "취소 사유",
      pendingMessage: "승인 대기 중입니다.",
      successMessage: "정상 처리되었습니다."
    },
    correctionValidation: {
      missingTargetRecordId: "정정 대상 기록 ID를 선택해 주세요.",
      invalidCheckInFormat: "출근 시각 형식이 올바르지 않습니다.",
      excessiveBreakMinutes: "휴게 시간이 과도합니다. 12시간 이하로 입력해 주세요.",
      invalidCheckOutFormat: "퇴근 시각 형식이 올바르지 않습니다.",
      invalidTimeOrder: "퇴근 시각은 출근 시각 이후여야 합니다.",
      breakExceedsWorkMinutes: "휴게 시간이 근무 시간보다 크거나 같습니다."
    },
    attendanceChecks: {
      targetLabel: "정정 대상 선택",
      targetSelectedDetail: "정정 대상 기록이 선택되었습니다.",
      targetMissingDetail: "정정 대상 기록 ID를 선택해 주세요.",
      checkInFormatLabel: "출근 시각 형식",
      checkInFormatValidDetail: "출근 시각 형식이 유효합니다.",
      checkInFormatInvalidDetail: "출근 시각 형식이 올바르지 않습니다.",
      breakRangeLabel: "휴게 시간 범위",
      breakRangeValidDetail: (minutes: number) => `휴게 ${minutes}분`,
      breakRangeInvalidDetail: "휴게 시간이 과도합니다. 12시간 이하로 입력해 주세요.",
      checkOutFormatLabel: "퇴근 시각 형식",
      checkOutFormatValidDetail: "퇴근 시각 형식이 유효합니다.",
      checkOutFormatInvalidDetail: "퇴근 시각 형식이 올바르지 않습니다.",
      timeOrderLabel: "출퇴근 시간 순서",
      timeOrderValidDetail: "출퇴근 시간 순서가 유효합니다.",
      timeOrderInvalidDetail: "퇴근 시각은 출근 시각 이후여야 합니다."
    },
    leaveChecks: {
      startDateFormatLabel: "시작일 형식",
      startDateFormatValidDetail: "시작일 형식이 유효합니다.",
      startDateFormatInvalidDetail: "시작일 형식이 올바르지 않습니다.",
      endDateFormatLabel: "종료일 형식",
      endDateFormatValidDetail: "종료일 형식이 유효합니다.",
      endDateFormatInvalidDetail: "종료일 형식이 올바르지 않습니다.",
      requestRangeLabel: "신청 기간",
      requestRangeValidDetail: "신청 기간이 유효합니다.",
      requestRangeInvalidDetail: "종료일은 시작일과 같거나 이후여야 합니다.",
      hourlyInputLabel: "시간 단위 입력",
      hourlyInputValidDetail: (hours: number) => `${hours.toFixed(1)}시간`,
      hourlyInputInvalidDetail: "시간 단위는 0보다 크고 12 이하여야 합니다.",
      estimatedDaysLabel: "신청 일수 계산",
      estimatedDaysValidDetail: (daysLabel: string) => `예상 신청 ${daysLabel}일`,
      estimatedDaysInvalidDetail: "신청 일수를 계산할 수 없습니다.",
      annualBalanceLabel: "잔여 연차 검증",
      annualBalanceSufficientDetail: (remainingDaysLabel: string) => `잔여 ${remainingDaysLabel}일`,
      annualBalanceInsufficientDetail: (remainingDaysLabel: string, requestedDaysLabel: string) =>
        `잔여 ${remainingDaysLabel}일, 요청 ${requestedDaysLabel}일`
    },
    resubmitFlowChecks: {
      candidateLabel: "재제출 후보 선택",
      candidateSelectedDetail: "재제출 대상이 선택되었습니다.",
      candidateMissingDetail: "반려/취소 요청에서 재제출 대상을 선택해 주세요.",
      draftAppliedLabel: "초안 반영",
      draftAppliedDetail: "선택 후보 초안을 신청 폼에 반영했습니다.",
      draftMissingDetail: "선택 초안 적용 버튼으로 폼을 먼저 채워 주세요.",
      submitReadyLabel: "제출 가능 상태",
      submitReadyDetail: "검증을 통과했습니다. 해당 폼에서 재제출할 수 있습니다.",
      submitNotReadyDetail: "재제출 전 입력값 검증을 다시 확인해 주세요."
    },
    submitChecklistCards: {
      attendanceCorrectionLabel: "출퇴근 정정 제출",
      attendanceReadyDetail: "정정 제출이 가능합니다.",
      attendanceFallbackDetail: "정정 입력을 보완해 주세요.",
      leaveSubmissionLabel: "휴가 신청 제출",
      leaveReadyDetail: (daysLabel: string) => `예상 ${daysLabel}일 신청 가능합니다.`,
      leaveFallbackDetail: "휴가 신청 입력을 보완해 주세요.",
      requestResubmitLabel: "요청 재제출",
      requestResubmitReadyDetail: "재제출 흐름 검증을 통과했습니다.",
      requestResubmitFallbackDetail: "재제출 후보 선택 및 초안 반영이 필요합니다."
    }
  },
  en: {
    feedback: {
      pendingRequestFilterApplied: "Pending requests filter is now applied.",
      selectedAttendanceResubmitMissing: "Selected attendance resubmit candidate is not in the latest list.",
      selectedLeaveResubmitMissing: "Selected leave resubmit candidate is not in the latest list.",
      attendanceResubmitDraftApplied: "Applied attendance resubmit draft to correction form.",
      leaveResubmitDraftApplied: "Applied leave resubmit draft to request form.",
      selectResubmitCandidateFirst: "Select a resubmit candidate first.",
      noResubmitTarget: "No rejected/canceled request to resubmit.",
      resetResubmitSelection: "Reset resubmit candidate selection.",
      noFailureCauseToCopy: "No failure cause available to copy.",
      clipboardUnavailable: "Clipboard copy is not available in this environment.",
      copiedLatestFailureCause: "Copied the latest failure cause to clipboard.",
      copyFailureCauseFailed: "Failed to copy failure cause."
    },
    defaults: {
      resubmitCorrectionNote: "Resubmit correction",
      noApiCallHistory: "No API call history yet.",
      noRecord: "No record",
      working: "Working",
      checkedOut: "Checked out",
      noReasonProvided: "No reason provided",
      noReason: "No reason",
      noNote: "No note",
      attendanceRequestTitle: "Attendance request",
      leaveRequestTitle: "Leave request",
      attendanceRejectedSource: "Attendance rejected",
      leaveRejectedSource: "Leave rejected",
      leaveCanceledSource: "Leave canceled",
      rejectionReasonMissing: "Rejection reason was not recorded.",
      reasonMissing: "Reason was not recorded.",
      notComparable: "Not comparable"
    },
    summaryCards: {
      pendingRequestsLabel: "Pending requests",
      pendingRequestsDetail: (attendancePending: number, leavePending: number) =>
        `Attendance ${attendancePending} / Leave ${leavePending}`,
      completionRateLabel: "Completion rate",
      completionRateDetail: (approvedCount: number, needsActionCount: number) =>
        `Approved ${approvedCount} / Needs action ${needsActionCount}`,
      resubmitNeededLabel: "Resubmit needed",
      resubmitNeededDetail: (count: number) => `${count} rejected or canceled request(s)`,
      noResubmitNeededDetail: "No rejected or canceled request",
      apiFailuresLabel: "API failures",
      apiFailuresDetail: (successCount: number, failCount: number) => `Success ${successCount} / Failed ${failCount}`
    },
    requestFeedback: {
      rejectionReasonPrefix: "Rejection reason",
      cancelReasonPrefix: "Cancel reason",
      pendingMessage: "Pending approval.",
      successMessage: "Processed successfully."
    },
    correctionValidation: {
      missingTargetRecordId: "Select a correction target record ID.",
      invalidCheckInFormat: "Invalid check-in time format.",
      excessiveBreakMinutes: "Break time is too large. Enter 12 hours or less.",
      invalidCheckOutFormat: "Invalid check-out time format.",
      invalidTimeOrder: "Check-out time must be later than check-in time.",
      breakExceedsWorkMinutes: "Break minutes cannot be greater than or equal to work minutes."
    },
    attendanceChecks: {
      targetLabel: "Correction target selection",
      targetSelectedDetail: "Correction target record is selected.",
      targetMissingDetail: "Select a correction target record ID.",
      checkInFormatLabel: "Check-in time format",
      checkInFormatValidDetail: "Check-in time format is valid.",
      checkInFormatInvalidDetail: "Invalid check-in time format.",
      breakRangeLabel: "Break time range",
      breakRangeValidDetail: (minutes: number) => `Break ${minutes}m`,
      breakRangeInvalidDetail: "Break time is too large. Enter 12 hours or less.",
      checkOutFormatLabel: "Check-out time format",
      checkOutFormatValidDetail: "Check-out time format is valid.",
      checkOutFormatInvalidDetail: "Invalid check-out time format.",
      timeOrderLabel: "Time order",
      timeOrderValidDetail: "Time order is valid.",
      timeOrderInvalidDetail: "Check-out time must be later than check-in time."
    },
    leaveChecks: {
      startDateFormatLabel: "Start date format",
      startDateFormatValidDetail: "Start date format is valid.",
      startDateFormatInvalidDetail: "Invalid start date format.",
      endDateFormatLabel: "End date format",
      endDateFormatValidDetail: "End date format is valid.",
      endDateFormatInvalidDetail: "Invalid end date format.",
      requestRangeLabel: "Request range",
      requestRangeValidDetail: "Request range is valid.",
      requestRangeInvalidDetail: "End date must be the same as or later than start date.",
      hourlyInputLabel: "Hourly input",
      hourlyInputValidDetail: (hours: number) => `${hours.toFixed(1)}h`,
      hourlyInputInvalidDetail: "Hourly unit must be greater than 0 and up to 12.",
      estimatedDaysLabel: "Requested days estimate",
      estimatedDaysValidDetail: (daysLabel: string) => `Estimated request ${daysLabel}d`,
      estimatedDaysInvalidDetail: "Unable to estimate requested days.",
      annualBalanceLabel: "Annual leave balance check",
      annualBalanceSufficientDetail: (remainingDaysLabel: string) => `Remaining ${remainingDaysLabel}d`,
      annualBalanceInsufficientDetail: (remainingDaysLabel: string, requestedDaysLabel: string) =>
        `Remaining ${remainingDaysLabel}d, requested ${requestedDaysLabel}d`
    },
    resubmitFlowChecks: {
      candidateLabel: "Resubmit candidate selection",
      candidateSelectedDetail: "Resubmit target is selected.",
      candidateMissingDetail: "Select a resubmit target from rejected/canceled requests.",
      draftAppliedLabel: "Draft applied",
      draftAppliedDetail: "Applied selected draft to request form.",
      draftMissingDetail: "Fill the form first using apply selected draft.",
      submitReadyLabel: "Submit-ready state",
      submitReadyDetail: "Validation passed. You can resubmit from the form.",
      submitNotReadyDetail: "Check input validation before resubmitting."
    },
    submitChecklistCards: {
      attendanceCorrectionLabel: "Attendance correction submit",
      attendanceReadyDetail: "Ready to submit correction.",
      attendanceFallbackDetail: "Complete correction inputs before submitting.",
      leaveSubmissionLabel: "Leave request submit",
      leaveReadyDetail: (daysLabel: string) => `Ready to submit estimated ${daysLabel}d.`,
      leaveFallbackDetail: "Complete leave request inputs before submitting.",
      requestResubmitLabel: "Request resubmit",
      requestResubmitReadyDetail: "Resubmit flow validation passed.",
      requestResubmitFallbackDetail: "Select a resubmit candidate and apply draft first."
    }
  }
} as const;

const EMPLOYEE_SUMMARY_COPY_BY_LOCALE = {
  ko: {
    leaveBalance: {
      notLoaded: "잔여 휴가 정보를 아직 불러오지 못했습니다.",
      summary: (remainingDaysLabel: string, grantedDaysLabel: string, usedDaysLabel: string) =>
        `잔여 ${remainingDaysLabel}일 (부여 ${grantedDaysLabel}일, 사용 ${usedDaysLabel}일)`,
      cardLabels: {
        remaining: "잔여",
        granted: "부여",
        used: "사용",
        carryOver: "이월"
      },
      dayUnit: (daysLabel: string) => `${daysLabel}일`,
      projectionPending: "연차 사용 속도 예측은 잔여 정보를 불러오면 표시됩니다.",
      projectedRemaining: (daysLabel: string) => `현재 사용 속도 기준 연말 예상 잔여 ${daysLabel}일`,
      projectedShortage: (daysLabel: string) => `현재 사용 속도 기준 연말 예상 부족 ${daysLabel}일`
    },
    leaveUnits: {
      hourUnit: (hoursLabel: string) => `${hoursLabel}시간`,
      halfDay: "반차",
      dayUnit: (daysLabel: string) => `${daysLabel}일`
    }
  },
  en: {
    leaveBalance: {
      notLoaded: "Leave balance is not loaded yet.",
      summary: (remainingDaysLabel: string, grantedDaysLabel: string, usedDaysLabel: string) =>
        `Remaining ${remainingDaysLabel}d (granted ${grantedDaysLabel}d, used ${usedDaysLabel}d)`,
      cardLabels: {
        remaining: "Remaining",
        granted: "Granted",
        used: "Used",
        carryOver: "Carry-over"
      },
      dayUnit: (daysLabel: string) => `${daysLabel}d`,
      projectionPending: "Projection is shown after leave balance is loaded.",
      projectedRemaining: (daysLabel: string) => `Projected year-end remaining ${daysLabel}d at current usage rate`,
      projectedShortage: (daysLabel: string) => `Projected year-end shortage ${daysLabel}d at current usage rate`
    },
    leaveUnits: {
      hourUnit: (hoursLabel: string) => `${hoursLabel}h`,
      halfDay: "0.5d",
      dayUnit: (daysLabel: string) => `${daysLabel}d`
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
    validationCopy: EMPLOYEE_VALIDATION_COPY_BY_LOCALE[localeKey],
    summaryCopy: EMPLOYEE_SUMMARY_COPY_BY_LOCALE[localeKey],
    notConfiguredLabel: isKoLocale ? "미설정" : "not configured",
    runtimeLocale: isKoLocale ? "ko-KR" : "en-US",
    correctionRequestNote: isKoLocale ? "정정 요청" : "Correction request",
    callApiLabels: {
      attendanceList: isKoLocale ? "내 출퇴근 조회" : "Load my attendance",
      leaveList: isKoLocale ? "내 휴가 요청 조회" : "Load my leave requests",
      leaveDepartmentCalendar: isKoLocale ? "내 부서 휴가 캘린더 조회" : "Load leave calendar for my department",
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
