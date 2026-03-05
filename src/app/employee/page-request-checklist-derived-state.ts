import { useMemo } from "react";

import { matchesRequestSearch, sortRequestRowsByOption } from "@/app/employee/page-helpers";
import {
  buildMobileRequestTimeline,
  buildRequestFailureCauses,
  buildRequestFeedbackRows,
  buildRequestSearchRows,
  filterMobileRequestTimeline,
  filterRequestFeedbackRows
} from "@/app/employee/page-request-helpers";
import {
  buildAttendancePreSubmitChecks,
  buildCorrectionValidation,
  buildIntegratedSubmitChecklistCards,
  buildLeavePreSubmitChecks,
  buildResubmitFlowChecks
} from "@/app/employee/page-validation-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  IntegratedSubmitChecklistCard,
  LeaveBalanceDto,
  LeaveTypeDto,
  LeaveRequestDto,
  MobileRequestTimelineItem,
  PreSubmitCheckItem,
  RequestFailureCause,
  RequestFeedbackRow,
  RequestSearchRow,
  RequestSearchScope,
  RequestSortOption,
  RequestStatusFilter,
  ResubmitCandidate,
  TimelineChannelFilter
} from "@/app/employee/page-types";

type RequestFeedbackCopyInput = Parameters<typeof buildRequestFeedbackRows>[0]["requestFeedbackCopy"];
type RequestSearchDefaultsInput = Parameters<typeof buildRequestSearchRows>[0]["defaultsCopy"];
type MobileRequestDefaultsInput = Parameters<typeof buildMobileRequestTimeline>[0]["defaultsCopy"];
type LeaveUnitCopyInput = Parameters<typeof buildRequestSearchRows>[0]["leaveUnitCopy"];
type RequestFailureDefaultsInput = Parameters<typeof buildRequestFailureCauses>[0]["defaultsCopy"];
type CorrectionValidationCopyInput = Parameters<typeof buildCorrectionValidation>[0]["correctionValidationCopy"];
type AttendanceCheckCopyInput = Parameters<typeof buildAttendancePreSubmitChecks>[0]["attendanceCheckCopy"];
type LeaveCheckCopyInput = Parameters<typeof buildLeavePreSubmitChecks>[0]["leaveCheckCopy"];
type ResubmitFlowCheckCopyInput = Parameters<typeof buildResubmitFlowChecks>[0]["resubmitFlowCheckCopy"];
type SubmitChecklistCardCopyInput = Parameters<typeof buildIntegratedSubmitChecklistCards>[0]["submitChecklistCardCopy"];

type EmployeeRequestChecklistDerivedStateInput = {
  latestAttendance: AttendanceRecordDto | null;
  attendance: AttendanceRecordDto[];
  leaveRequests: LeaveRequestDto[];
  logs: ApiLog[];
  isKoLocale: boolean;
  requestNowMs: number;
  requestSearchScope: RequestSearchScope;
  normalizedRequestSearchQuery: string;
  requestSortOption: RequestSortOption;
  requestFeedbackStatusFilter: RequestStatusFilter;
  timelineChannelFilter: TimelineChannelFilter;
  timelineStatusFilter: RequestStatusFilter;
  selectedResubmitCandidate: ResubmitCandidate | null;
  lastAppliedResubmitCandidateKey: string;
  lastAttendanceId: string;
  checkInAt: string;
  checkOutAt: string;
  breakMinutes: string;
  leaveType: LeaveTypeDto;
  leaveUnit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  leaveHours: string;
  leaveStartDate: string;
  leaveEndDate: string;
  leaveBalance: LeaveBalanceDto | null;
  formatDays: (value: number) => string;
  formatDateTimeByLocale: (value: string | null) => string;
  toLeaveTypeLabel: (leaveType: LeaveRequestDto["leaveType"]) => string;
  extractEmployeeErrorMessage: (body: unknown, isKoLocale: boolean) => string;
  requestFeedbackCopy: RequestFeedbackCopyInput;
  requestFeedbackNoReasonProvided: string;
  requestSearchDefaultsCopy: RequestSearchDefaultsInput;
  mobileRequestDefaultsCopy: MobileRequestDefaultsInput;
  leaveUnitCopy: LeaveUnitCopyInput;
  requestFailureDefaultsCopy: RequestFailureDefaultsInput;
  correctionValidationCopy: CorrectionValidationCopyInput;
  attendanceCheckCopy: AttendanceCheckCopyInput;
  leaveCheckCopy: LeaveCheckCopyInput;
  resubmitFlowCheckCopy: ResubmitFlowCheckCopyInput;
  submitChecklistCardCopy: SubmitChecklistCardCopyInput;
};

type EmployeeRequestChecklistDerivedState = {
  requestFeedbackRows: RequestFeedbackRow[];
  filteredRequestFeedbackRows: RequestFeedbackRow[];
  requestSearchRows: RequestSearchRow[];
  filteredRequestSearchRows: RequestSearchRow[];
  mobileRequestTimeline: MobileRequestTimelineItem[];
  filteredMobileRequestTimeline: MobileRequestTimelineItem[];
  requestFailureCauses: RequestFailureCause[];
  latestFailureCauseMessage: string;
  correctionValidation: ReturnType<typeof buildCorrectionValidation>;
  attendancePreSubmitChecks: PreSubmitCheckItem[];
  attendancePreSubmitValid: boolean;
  attendanceFirstFailCheck: PreSubmitCheckItem | null;
  estimatedLeaveRequestedDays: number;
  leavePreSubmitChecks: PreSubmitCheckItem[];
  leavePreSubmitValid: boolean;
  leaveFirstFailCheck: PreSubmitCheckItem | null;
  resubmitFlowChecks: PreSubmitCheckItem[];
  resubmitFlowReady: boolean;
  resubmitFirstFailCheck: PreSubmitCheckItem | null;
  integratedSubmitChecklistCards: IntegratedSubmitChecklistCard[];
};

function estimateLeaveRequestedDays(input: {
  startDate: string;
  endDate: string;
  unit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  hoursInput: string;
}) {
  if (input.unit === "HOUR") {
    const hours = Number(input.hoursInput);
    if (!Number.isFinite(hours) || hours <= 0) {
      return 0;
    }
    return Number((hours / 8).toFixed(2));
  }
  if (input.unit === "HALF_DAY") {
    return 0.5;
  }
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const startTime = start.getTime();
  const endTime = end.getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime < startTime) {
    return 0;
  }
  return Number(((endTime - startTime) / 86_400_000 + 1).toFixed(2));
}

export function useEmployeeRequestChecklistDerivedState(
  input: EmployeeRequestChecklistDerivedStateInput
): EmployeeRequestChecklistDerivedState {
  const {
    latestAttendance,
    attendance,
    leaveRequests,
    logs,
    isKoLocale,
    requestNowMs,
    requestSearchScope,
    normalizedRequestSearchQuery,
    requestSortOption,
    requestFeedbackStatusFilter,
    timelineChannelFilter,
    timelineStatusFilter,
    selectedResubmitCandidate,
    lastAppliedResubmitCandidateKey,
    lastAttendanceId,
    checkInAt,
    checkOutAt,
    breakMinutes,
    leaveType,
    leaveUnit,
    leaveHours,
    leaveStartDate,
    leaveEndDate,
    leaveBalance,
    formatDays,
    formatDateTimeByLocale,
    toLeaveTypeLabel,
    extractEmployeeErrorMessage,
    requestFeedbackCopy,
    requestFeedbackNoReasonProvided,
    requestSearchDefaultsCopy,
    mobileRequestDefaultsCopy,
    leaveUnitCopy,
    requestFailureDefaultsCopy,
    correctionValidationCopy,
    attendanceCheckCopy,
    leaveCheckCopy,
    resubmitFlowCheckCopy,
    submitChecklistCardCopy
  } = input;

  const latestLeaveRequest = useMemo(() => {
    if (leaveRequests.length === 0) {
      return null;
    }
    return leaveRequests[leaveRequests.length - 1] ?? null;
  }, [leaveRequests]);

  const requestFeedbackRows = useMemo<RequestFeedbackRow[]>(() => {
    return buildRequestFeedbackRows({
      latestAttendance,
      latestLeaveRequest,
      defaultsCopy: {
        noReasonProvided: requestFeedbackNoReasonProvided
      },
      requestFeedbackCopy
    });
  }, [latestAttendance, latestLeaveRequest, requestFeedbackCopy, requestFeedbackNoReasonProvided]);

  const requestSearchRows = useMemo<RequestSearchRow[]>(() => {
    return buildRequestSearchRows({
      attendance,
      leaveRequests,
      requestNowMs,
      defaultsCopy: requestSearchDefaultsCopy,
      leaveUnitCopy,
      formatDays,
      toLeaveTypeLabel,
      formatDateTime: formatDateTimeByLocale
    });
  }, [
    attendance,
    leaveRequests,
    requestNowMs,
    requestSearchDefaultsCopy,
    leaveUnitCopy,
    formatDays,
    toLeaveTypeLabel,
    formatDateTimeByLocale
  ]);

  const filteredRequestSearchRows = useMemo(() => {
    const filtered = requestSearchRows.filter((row) =>
      matchesRequestSearch(requestSearchScope, normalizedRequestSearchQuery, row)
    );
    return sortRequestRowsByOption(filtered, requestSortOption);
  }, [requestSearchRows, requestSearchScope, normalizedRequestSearchQuery, requestSortOption]);

  const filteredRequestFeedbackRows = useMemo(() => {
    return filterRequestFeedbackRows(requestFeedbackRows, requestFeedbackStatusFilter);
  }, [requestFeedbackRows, requestFeedbackStatusFilter]);

  const mobileRequestTimeline = useMemo<MobileRequestTimelineItem[]>(() => {
    return buildMobileRequestTimeline({
      attendance,
      leaveRequests,
      defaultsCopy: mobileRequestDefaultsCopy,
      toLeaveTypeLabel,
      formatDateTime: formatDateTimeByLocale
    });
  }, [attendance, leaveRequests, mobileRequestDefaultsCopy, toLeaveTypeLabel, formatDateTimeByLocale]);

  const filteredMobileRequestTimeline = useMemo(() => {
    return filterMobileRequestTimeline(
      mobileRequestTimeline,
      timelineChannelFilter,
      timelineStatusFilter
    );
  }, [mobileRequestTimeline, timelineChannelFilter, timelineStatusFilter]);

  const requestFailureCauses = useMemo<RequestFailureCause[]>(() => {
    return buildRequestFailureCauses({
      logs,
      attendance,
      leaveRequests,
      defaultsCopy: requestFailureDefaultsCopy,
      isKoLocale,
      formatDateTime: formatDateTimeByLocale,
      extractEmployeeErrorMessage
    });
  }, [
    logs,
    attendance,
    leaveRequests,
    requestFailureDefaultsCopy,
    isKoLocale,
    formatDateTimeByLocale,
    extractEmployeeErrorMessage
  ]);

  const latestFailureCauseMessage = requestFailureCauses[0]?.message ?? "";

  const correctionValidation = useMemo(
    () =>
      buildCorrectionValidation({
        lastAttendanceId,
        checkInAt,
        checkOutAt,
        breakMinutes,
        correctionValidationCopy
      }),
    [lastAttendanceId, checkInAt, checkOutAt, breakMinutes, correctionValidationCopy]
  );

  const attendancePreSubmitChecks = useMemo<PreSubmitCheckItem[]>(
    () =>
      buildAttendancePreSubmitChecks({
        lastAttendanceId,
        checkInAt,
        checkOutAt,
        breakMinutes,
        attendanceCheckCopy
      }),
    [lastAttendanceId, checkInAt, checkOutAt, breakMinutes, attendanceCheckCopy]
  );

  const attendancePreSubmitValid = useMemo(
    () => attendancePreSubmitChecks.every((check) => check.pass),
    [attendancePreSubmitChecks]
  );

  const attendanceFirstFailCheck = useMemo(
    () => attendancePreSubmitChecks.find((check) => !check.pass) ?? null,
    [attendancePreSubmitChecks]
  );

  const estimatedLeaveRequestedDays = useMemo(
    () =>
      estimateLeaveRequestedDays({
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        unit: leaveUnit,
        hoursInput: leaveHours
      }),
    [leaveStartDate, leaveEndDate, leaveUnit, leaveHours]
  );

  const leavePreSubmitChecks = useMemo<PreSubmitCheckItem[]>(
    () =>
      buildLeavePreSubmitChecks({
        leaveStartDate,
        leaveEndDate,
        leaveUnit,
        leaveHours,
        leaveType,
        leaveBalance,
        estimatedLeaveRequestedDays,
        leaveCheckCopy,
        formatDays
      }),
    [
      leaveStartDate,
      leaveEndDate,
      leaveUnit,
      leaveHours,
      leaveType,
      leaveBalance,
      estimatedLeaveRequestedDays,
      leaveCheckCopy,
      formatDays
    ]
  );

  const leavePreSubmitValid = useMemo(() => leavePreSubmitChecks.every((check) => check.pass), [leavePreSubmitChecks]);

  const leaveFirstFailCheck = useMemo(
    () => leavePreSubmitChecks.find((check) => !check.pass) ?? null,
    [leavePreSubmitChecks]
  );

  const resubmitFlowChecks = useMemo<PreSubmitCheckItem[]>(
    () =>
      buildResubmitFlowChecks({
        selectedResubmitCandidate,
        lastAppliedResubmitCandidateKey,
        correctionValidationIsValid: correctionValidation.isValid,
        attendancePreSubmitValid,
        leavePreSubmitValid,
        resubmitFlowCheckCopy
      }),
    [
      selectedResubmitCandidate,
      lastAppliedResubmitCandidateKey,
      correctionValidation.isValid,
      attendancePreSubmitValid,
      leavePreSubmitValid,
      resubmitFlowCheckCopy
    ]
  );

  const resubmitFlowReady = useMemo(
    () => resubmitFlowChecks.every((check) => check.pass),
    [resubmitFlowChecks]
  );

  const resubmitFirstFailCheck = useMemo(
    () => resubmitFlowChecks.find((check) => !check.pass) ?? null,
    [resubmitFlowChecks]
  );

  const integratedSubmitChecklistCards = useMemo<IntegratedSubmitChecklistCard[]>(
    () =>
      buildIntegratedSubmitChecklistCards({
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
      }),
    [
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
    ]
  );

  return {
    requestFeedbackRows,
    filteredRequestFeedbackRows,
    requestSearchRows,
    filteredRequestSearchRows,
    mobileRequestTimeline,
    filteredMobileRequestTimeline,
    requestFailureCauses,
    latestFailureCauseMessage,
    correctionValidation,
    attendancePreSubmitChecks,
    attendancePreSubmitValid,
    attendanceFirstFailCheck,
    estimatedLeaveRequestedDays,
    leavePreSubmitChecks,
    leavePreSubmitValid,
    leaveFirstFailCheck,
    resubmitFlowChecks,
    resubmitFlowReady,
    resubmitFirstFailCheck,
    integratedSubmitChecklistCards
  };
}
