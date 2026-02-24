import { coerceNumber } from "@/app/employee/page-helpers";
import type {
  IntegratedSubmitChecklistCard,
  LeaveBalanceDto,
  PreSubmitCheckItem,
  ResubmitCandidate
} from "@/app/employee/page-types";

type CorrectionValidationCopy = {
  missingTargetRecordId: string;
  invalidCheckInFormat: string;
  excessiveBreakMinutes: string;
  invalidCheckOutFormat: string;
  invalidTimeOrder: string;
  breakExceedsWorkMinutes: string;
};

type AttendanceCheckCopy = {
  targetLabel: string;
  targetSelectedDetail: string;
  targetMissingDetail: string;
  checkInFormatLabel: string;
  checkInFormatValidDetail: string;
  checkInFormatInvalidDetail: string;
  breakRangeLabel: string;
  breakRangeValidDetail: (minutes: number) => string;
  breakRangeInvalidDetail: string;
  checkOutFormatLabel: string;
  checkOutFormatValidDetail: string;
  checkOutFormatInvalidDetail: string;
  timeOrderLabel: string;
  timeOrderValidDetail: string;
  timeOrderInvalidDetail: string;
};

type LeaveCheckCopy = {
  startDateFormatLabel: string;
  startDateFormatValidDetail: string;
  startDateFormatInvalidDetail: string;
  endDateFormatLabel: string;
  endDateFormatValidDetail: string;
  endDateFormatInvalidDetail: string;
  requestRangeLabel: string;
  requestRangeValidDetail: string;
  requestRangeInvalidDetail: string;
  hourlyInputLabel: string;
  hourlyInputValidDetail: (hours: number) => string;
  hourlyInputInvalidDetail: string;
  estimatedDaysLabel: string;
  estimatedDaysValidDetail: (daysLabel: string) => string;
  estimatedDaysInvalidDetail: string;
  annualBalanceLabel: string;
  annualBalanceSufficientDetail: (remainingDaysLabel: string) => string;
  annualBalanceInsufficientDetail: (remainingDaysLabel: string, requestedDaysLabel: string) => string;
};

type ResubmitFlowCheckCopy = {
  candidateLabel: string;
  candidateSelectedDetail: string;
  candidateMissingDetail: string;
  draftAppliedLabel: string;
  draftAppliedDetail: string;
  draftMissingDetail: string;
  submitReadyLabel: string;
  submitReadyDetail: string;
  submitNotReadyDetail: string;
};

type SubmitChecklistCardCopy = {
  attendanceCorrectionLabel: string;
  attendanceReadyDetail: string;
  attendanceFallbackDetail: string;
  leaveSubmissionLabel: string;
  leaveReadyDetail: (daysLabel: string) => string;
  leaveFallbackDetail: string;
  requestResubmitLabel: string;
  requestResubmitReadyDetail: string;
  requestResubmitFallbackDetail: string;
};

export type CorrectionValidationResult = {
  isValid: boolean;
  message: string | null;
};

type BuildCorrectionValidationArgs = {
  lastAttendanceId: string;
  checkInAt: string;
  checkOutAt: string;
  breakMinutes: string;
  correctionValidationCopy: CorrectionValidationCopy;
};

export function buildCorrectionValidation({
  lastAttendanceId,
  checkInAt,
  checkOutAt,
  breakMinutes,
  correctionValidationCopy
}: BuildCorrectionValidationArgs): CorrectionValidationResult {
  if (!lastAttendanceId.trim()) {
    return { isValid: false, message: correctionValidationCopy.missingTargetRecordId };
  }

  const checkInMs = new Date(checkInAt).getTime();
  if (Number.isNaN(checkInMs)) {
    return { isValid: false, message: correctionValidationCopy.invalidCheckInFormat };
  }

  const normalizedBreakMinutes = Math.max(0, Math.trunc(coerceNumber(breakMinutes)));
  if (normalizedBreakMinutes > 12 * 60) {
    return { isValid: false, message: correctionValidationCopy.excessiveBreakMinutes };
  }

  if (checkOutAt.trim().length === 0) {
    return { isValid: true, message: null };
  }

  const checkOutMs = new Date(checkOutAt).getTime();
  if (Number.isNaN(checkOutMs)) {
    return { isValid: false, message: correctionValidationCopy.invalidCheckOutFormat };
  }
  if (checkOutMs <= checkInMs) {
    return { isValid: false, message: correctionValidationCopy.invalidTimeOrder };
  }

  const totalMinutes = Math.round((checkOutMs - checkInMs) / 60_000);
  if (normalizedBreakMinutes >= totalMinutes) {
    return { isValid: false, message: correctionValidationCopy.breakExceedsWorkMinutes };
  }

  return { isValid: true, message: null };
}

type BuildAttendancePreSubmitChecksArgs = {
  lastAttendanceId: string;
  checkInAt: string;
  checkOutAt: string;
  breakMinutes: string;
  attendanceCheckCopy: AttendanceCheckCopy;
};

export function buildAttendancePreSubmitChecks({
  lastAttendanceId,
  checkInAt,
  checkOutAt,
  breakMinutes,
  attendanceCheckCopy
}: BuildAttendancePreSubmitChecksArgs): PreSubmitCheckItem[] {
  const checks: PreSubmitCheckItem[] = [];
  checks.push({
    id: "attendance-target",
    pass: lastAttendanceId.trim().length > 0,
    label: attendanceCheckCopy.targetLabel,
    detail:
      lastAttendanceId.trim().length > 0
        ? attendanceCheckCopy.targetSelectedDetail
        : attendanceCheckCopy.targetMissingDetail
  });

  const checkInMs = new Date(checkInAt).getTime();
  checks.push({
    id: "attendance-checkin",
    pass: !Number.isNaN(checkInMs),
    label: attendanceCheckCopy.checkInFormatLabel,
    detail: !Number.isNaN(checkInMs)
      ? attendanceCheckCopy.checkInFormatValidDetail
      : attendanceCheckCopy.checkInFormatInvalidDetail
  });

  const normalizedBreakMinutes = Math.max(0, Math.trunc(coerceNumber(breakMinutes)));
  checks.push({
    id: "attendance-break",
    pass: normalizedBreakMinutes <= 12 * 60,
    label: attendanceCheckCopy.breakRangeLabel,
    detail:
      normalizedBreakMinutes <= 12 * 60
        ? attendanceCheckCopy.breakRangeValidDetail(normalizedBreakMinutes)
        : attendanceCheckCopy.breakRangeInvalidDetail
  });

  if (checkOutAt.trim().length > 0) {
    const checkOutMs = new Date(checkOutAt).getTime();
    checks.push({
      id: "attendance-checkout-format",
      pass: !Number.isNaN(checkOutMs),
      label: attendanceCheckCopy.checkOutFormatLabel,
      detail:
        !Number.isNaN(checkOutMs)
          ? attendanceCheckCopy.checkOutFormatValidDetail
          : attendanceCheckCopy.checkOutFormatInvalidDetail
    });
    checks.push({
      id: "attendance-time-order",
      pass: !Number.isNaN(checkOutMs) && !Number.isNaN(checkInMs) && checkOutMs > checkInMs,
      label: attendanceCheckCopy.timeOrderLabel,
      detail: !Number.isNaN(checkOutMs) && !Number.isNaN(checkInMs) && checkOutMs > checkInMs
        ? attendanceCheckCopy.timeOrderValidDetail
        : attendanceCheckCopy.timeOrderInvalidDetail
    });
  }

  return checks;
}

type BuildLeavePreSubmitChecksArgs = {
  leaveStartDate: string;
  leaveEndDate: string;
  leaveUnit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  leaveHours: string;
  leaveType: "ANNUAL" | "SICK" | "UNPAID";
  leaveBalance: LeaveBalanceDto | null;
  estimatedLeaveRequestedDays: number;
  leaveCheckCopy: LeaveCheckCopy;
  formatDays: (value: number) => string;
};

export function buildLeavePreSubmitChecks({
  leaveStartDate,
  leaveEndDate,
  leaveUnit,
  leaveHours,
  leaveType,
  leaveBalance,
  estimatedLeaveRequestedDays,
  leaveCheckCopy,
  formatDays
}: BuildLeavePreSubmitChecksArgs): PreSubmitCheckItem[] {
  const checks: PreSubmitCheckItem[] = [];
  const startMs = new Date(leaveStartDate).getTime();
  const endMs = new Date(leaveEndDate).getTime();
  const validStart = !Number.isNaN(startMs);
  const validEnd = !Number.isNaN(endMs);

  checks.push({
    id: "leave-start-format",
    pass: validStart,
    label: leaveCheckCopy.startDateFormatLabel,
    detail: validStart ? leaveCheckCopy.startDateFormatValidDetail : leaveCheckCopy.startDateFormatInvalidDetail
  });
  checks.push({
    id: "leave-end-format",
    pass: validEnd,
    label: leaveCheckCopy.endDateFormatLabel,
    detail: validEnd ? leaveCheckCopy.endDateFormatValidDetail : leaveCheckCopy.endDateFormatInvalidDetail
  });
  checks.push({
    id: "leave-range",
    pass: validStart && validEnd && endMs >= startMs,
    label: leaveCheckCopy.requestRangeLabel,
    detail: validStart && validEnd && endMs >= startMs
      ? leaveCheckCopy.requestRangeValidDetail
      : leaveCheckCopy.requestRangeInvalidDetail
  });

  if (leaveUnit === "HOUR") {
    const hours = Math.max(0, coerceNumber(leaveHours));
    checks.push({
      id: "leave-hours",
      pass: hours > 0 && hours <= 12,
      label: leaveCheckCopy.hourlyInputLabel,
      detail:
        hours > 0 && hours <= 12
          ? leaveCheckCopy.hourlyInputValidDetail(hours)
          : leaveCheckCopy.hourlyInputInvalidDetail
    });
  }

  checks.push({
    id: "leave-estimated-days",
    pass: estimatedLeaveRequestedDays > 0,
    label: leaveCheckCopy.estimatedDaysLabel,
    detail:
      estimatedLeaveRequestedDays > 0
        ? leaveCheckCopy.estimatedDaysValidDetail(formatDays(estimatedLeaveRequestedDays))
        : leaveCheckCopy.estimatedDaysInvalidDetail
  });

  if (leaveType === "ANNUAL" && leaveBalance) {
    checks.push({
      id: "leave-balance",
      pass: leaveBalance.remainingDays >= estimatedLeaveRequestedDays,
      label: leaveCheckCopy.annualBalanceLabel,
      detail:
        leaveBalance.remainingDays >= estimatedLeaveRequestedDays
          ? leaveCheckCopy.annualBalanceSufficientDetail(formatDays(leaveBalance.remainingDays))
          : leaveCheckCopy.annualBalanceInsufficientDetail(
              formatDays(leaveBalance.remainingDays),
              formatDays(estimatedLeaveRequestedDays)
            )
    });
  }

  return checks;
}

type BuildResubmitFlowChecksArgs = {
  selectedResubmitCandidate: ResubmitCandidate | null;
  lastAppliedResubmitCandidateKey: string;
  correctionValidationIsValid: boolean;
  attendancePreSubmitValid: boolean;
  leavePreSubmitValid: boolean;
  resubmitFlowCheckCopy: ResubmitFlowCheckCopy;
};

export function buildResubmitFlowChecks({
  selectedResubmitCandidate,
  lastAppliedResubmitCandidateKey,
  correctionValidationIsValid,
  attendancePreSubmitValid,
  leavePreSubmitValid,
  resubmitFlowCheckCopy
}: BuildResubmitFlowChecksArgs): PreSubmitCheckItem[] {
  const hasCandidate = Boolean(selectedResubmitCandidate);
  const isDraftApplied =
    hasCandidate && selectedResubmitCandidate
      ? lastAppliedResubmitCandidateKey === selectedResubmitCandidate.key
      : false;
  const isSubmissionReady = !hasCandidate
    ? false
    : selectedResubmitCandidate?.channel === "attendance"
      ? correctionValidationIsValid && attendancePreSubmitValid
      : leavePreSubmitValid;

  return [
    {
      id: "resubmit-candidate",
      pass: hasCandidate,
      label: resubmitFlowCheckCopy.candidateLabel,
      detail: hasCandidate
        ? resubmitFlowCheckCopy.candidateSelectedDetail
        : resubmitFlowCheckCopy.candidateMissingDetail
    },
    {
      id: "resubmit-draft",
      pass: isDraftApplied,
      label: resubmitFlowCheckCopy.draftAppliedLabel,
      detail: isDraftApplied
        ? resubmitFlowCheckCopy.draftAppliedDetail
        : resubmitFlowCheckCopy.draftMissingDetail
    },
    {
      id: "resubmit-submit-ready",
      pass: isSubmissionReady,
      label: resubmitFlowCheckCopy.submitReadyLabel,
      detail: isSubmissionReady
        ? resubmitFlowCheckCopy.submitReadyDetail
        : resubmitFlowCheckCopy.submitNotReadyDetail
    }
  ];
}

type BuildIntegratedSubmitChecklistCardsArgs = {
  attendancePreSubmitChecks: PreSubmitCheckItem[];
  leavePreSubmitChecks: PreSubmitCheckItem[];
  resubmitFlowChecks: PreSubmitCheckItem[];
  attendancePreSubmitValid: boolean;
  correctionValidation: CorrectionValidationResult;
  lastAttendanceId: string;
  attendanceFirstFailCheck: PreSubmitCheckItem | null;
  leavePreSubmitValid: boolean;
  estimatedLeaveRequestedDays: number;
  leaveFirstFailCheck: PreSubmitCheckItem | null;
  resubmitFlowReady: boolean;
  resubmitFirstFailCheck: PreSubmitCheckItem | null;
  submitChecklistCardCopy: SubmitChecklistCardCopy;
  formatDays: (value: number) => string;
};

export function buildIntegratedSubmitChecklistCards({
  attendancePreSubmitChecks,
  leavePreSubmitChecks,
  resubmitFlowChecks,
  attendancePreSubmitValid,
  correctionValidation,
  lastAttendanceId,
  attendanceFirstFailCheck,
  leavePreSubmitValid,
  estimatedLeaveRequestedDays,
  leaveFirstFailCheck,
  resubmitFlowReady,
  resubmitFirstFailCheck,
  submitChecklistCardCopy,
  formatDays
}: BuildIntegratedSubmitChecklistCardsArgs): IntegratedSubmitChecklistCard[] {
  const attendancePassCount = attendancePreSubmitChecks.filter((check) => check.pass).length;
  const leavePassCount = leavePreSubmitChecks.filter((check) => check.pass).length;
  const resubmitPassCount = resubmitFlowChecks.filter((check) => check.pass).length;
  const attendanceReady =
    attendancePreSubmitValid && correctionValidation.isValid && lastAttendanceId.trim().length > 0;

  return [
    {
      key: "attendance",
      label: submitChecklistCardCopy.attendanceCorrectionLabel,
      passCount: attendancePassCount,
      totalCount: attendancePreSubmitChecks.length,
      ready: attendanceReady,
      detail: attendanceReady
        ? submitChecklistCardCopy.attendanceReadyDetail
        : correctionValidation.message || attendanceFirstFailCheck?.detail || submitChecklistCardCopy.attendanceFallbackDetail,
      targetSectionId: "attendance"
    },
    {
      key: "leave",
      label: submitChecklistCardCopy.leaveSubmissionLabel,
      passCount: leavePassCount,
      totalCount: leavePreSubmitChecks.length,
      ready: leavePreSubmitValid,
      detail: leavePreSubmitValid
        ? submitChecklistCardCopy.leaveReadyDetail(formatDays(estimatedLeaveRequestedDays))
        : leaveFirstFailCheck?.detail || submitChecklistCardCopy.leaveFallbackDetail,
      targetSectionId: "leave"
    },
    {
      key: "resubmit",
      label: submitChecklistCardCopy.requestResubmitLabel,
      passCount: resubmitPassCount,
      totalCount: resubmitFlowChecks.length,
      ready: resubmitFlowReady,
      detail: resubmitFlowReady
        ? submitChecklistCardCopy.requestResubmitReadyDetail
        : resubmitFirstFailCheck?.detail || submitChecklistCardCopy.requestResubmitFallbackDetail,
      targetSectionId: "request-resubmit"
    }
  ];
}
