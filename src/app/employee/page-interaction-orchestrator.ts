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

type InteractionSetterKeys =
  | keyof AttendanceInteractionSetters
  | keyof LeaveInteractionSetters
  | keyof RequestInteractionSetters
  | keyof PeriodInteractionSetters;

type RefreshEmployeeSnapshotInput = { fromIso: string; toIso: string };

type UseEmployeeInteractionOrchestratorInput = Omit<
  BuildEmployeeInteractionHandlersInput,
  "refreshEmployeeSnapshot" | InteractionSetterKeys
> & {
  refreshEmployeeSnapshot: (range?: RefreshEmployeeSnapshotInput) => Promise<void>;
  attendanceInteractionSetters: AttendanceInteractionSetters;
  leaveInteractionSetters: LeaveInteractionSetters;
  requestInteractionSetters: RequestInteractionSetters;
  periodInteractionSetters: PeriodInteractionSetters;
};

export function useEmployeeInteractionOrchestratorInput(
  input: UseEmployeeInteractionOrchestratorInput
): BuildEmployeeInteractionHandlersInput {
  return {
    attendance: input.attendance,
    correctionRequestNote: input.correctionRequestNote,
    defaultsCopy: input.defaultsCopy,
    feedbackCopy: input.feedbackCopy,
    isKoLocale: input.isKoLocale,
    latestAttendance: input.latestAttendance,
    leaveRequests: input.leaveRequests,
    periodStart: input.periodStart,
    refreshEmployeeSnapshot: async ({ fromIso, toIso }) => {
      await input.refreshEmployeeSnapshot({ fromIso, toIso });
    },
    resubmitCandidates: input.resubmitCandidates,
    selectedCorrectionRecord: input.selectedCorrectionRecord,
    selectedResubmitCandidate: input.selectedResubmitCandidate,
    ...input.attendanceInteractionSetters,
    ...input.leaveInteractionSetters,
    ...input.requestInteractionSetters,
    ...input.periodInteractionSetters
  };
}
