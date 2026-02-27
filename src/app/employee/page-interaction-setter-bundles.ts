import type { BuildEmployeeInteractionHandlersInput } from "@/app/employee/page-interaction-actions";

type AttendanceInteractionSetters = Pick<
  BuildEmployeeInteractionHandlersInput,
  | "setAttendanceNotes"
  | "setBreakMinutes"
  | "setCheckInAt"
  | "setCheckOutAt"
  | "setIsHoliday"
  | "setLastAttendanceId"
  | "setSelectedCorrectionRecordId"
>;

type LeaveInteractionSetters = Pick<
  BuildEmployeeInteractionHandlersInput,
  | "setLastLeaveRequestId"
  | "setLeaveEndDate"
  | "setLeaveHours"
  | "setLeaveReason"
  | "setLeaveStartDate"
  | "setLeaveType"
  | "setLeaveUnit"
>;

type RequestInteractionSetters = Pick<
  BuildEmployeeInteractionHandlersInput,
  | "setLastAppliedResubmitCandidateKey"
  | "setMobileFlowFeedback"
  | "setRequestSearchQuery"
  | "setRequestSearchScope"
  | "setRequestSortOption"
  | "setSelectedResubmitCandidateKey"
>;

type PeriodInteractionSetters = Pick<
  BuildEmployeeInteractionHandlersInput,
  "setPeriodEnd" | "setPeriodStart"
>;

type BuildEmployeeInteractionSetterBundlesInput = AttendanceInteractionSetters &
  LeaveInteractionSetters &
  RequestInteractionSetters &
  PeriodInteractionSetters;

export function buildEmployeeInteractionSetterBundles(
  input: BuildEmployeeInteractionSetterBundlesInput
) {
  const attendanceInteractionSetters = {
    setAttendanceNotes: input.setAttendanceNotes,
    setBreakMinutes: input.setBreakMinutes,
    setCheckInAt: input.setCheckInAt,
    setCheckOutAt: input.setCheckOutAt,
    setIsHoliday: input.setIsHoliday,
    setLastAttendanceId: input.setLastAttendanceId,
    setSelectedCorrectionRecordId: input.setSelectedCorrectionRecordId
  };
  const leaveInteractionSetters = {
    setLastLeaveRequestId: input.setLastLeaveRequestId,
    setLeaveEndDate: input.setLeaveEndDate,
    setLeaveHours: input.setLeaveHours,
    setLeaveReason: input.setLeaveReason,
    setLeaveStartDate: input.setLeaveStartDate,
    setLeaveType: input.setLeaveType,
    setLeaveUnit: input.setLeaveUnit
  };
  const requestInteractionSetters = {
    setLastAppliedResubmitCandidateKey: input.setLastAppliedResubmitCandidateKey,
    setMobileFlowFeedback: input.setMobileFlowFeedback,
    setRequestSearchQuery: input.setRequestSearchQuery,
    setRequestSearchScope: input.setRequestSearchScope,
    setRequestSortOption: input.setRequestSortOption,
    setSelectedResubmitCandidateKey: input.setSelectedResubmitCandidateKey
  };
  const periodInteractionSetters = {
    setPeriodEnd: input.setPeriodEnd,
    setPeriodStart: input.setPeriodStart
  };

  return {
    attendanceInteractionSetters,
    leaveInteractionSetters,
    requestInteractionSetters,
    periodInteractionSetters
  };
}
