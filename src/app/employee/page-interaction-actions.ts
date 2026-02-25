import type { Dispatch, SetStateAction } from "react";

import { shiftDays, startOfLocalDay, toIso, toLocalInputValue } from "@/app/employee/page-helpers";
import type {
  AttendanceRecordDto,
  LeaveRequestDto,
  RequestSearchScope,
  RequestSortOption,
  ResubmitCandidate
} from "@/app/employee/page-types";

export function jumpToSectionAction(sectionId: string) {
  if (typeof document === "undefined") {
    return;
  }
  const target = document.getElementById(sectionId);
  if (!target) {
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", `#${sectionId}`);
  }
}

export function pushMobileFlowFeedbackAction(
  message: string,
  setMobileFlowFeedback: Dispatch<SetStateAction<string>>
) {
  setMobileFlowFeedback(message);
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      setMobileFlowFeedback((current) => (current === message ? "" : current));
    }, 2200);
  }
}

interface ApplyLeaveQuickPresetActionInput {
  preset: "today-half" | "tomorrow-full" | "next-week-full";
  setLeaveType: Dispatch<SetStateAction<"ANNUAL" | "SICK" | "UNPAID">>;
  setLeaveUnit: Dispatch<SetStateAction<"FULL_DAY" | "HALF_DAY" | "HOUR">>;
  setLeaveStartDate: Dispatch<SetStateAction<string>>;
  setLeaveEndDate: Dispatch<SetStateAction<string>>;
}

export function applyLeaveQuickPresetAction(input: ApplyLeaveQuickPresetActionInput) {
  const { preset, setLeaveType, setLeaveUnit, setLeaveStartDate, setLeaveEndDate } = input;
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
  let nextUnit: "FULL_DAY" | "HALF_DAY" | "HOUR" = "FULL_DAY";

  if (preset === "today-half") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
    nextUnit = "HALF_DAY";
  } else if (preset === "tomorrow-full") {
    const tomorrow = shiftDays(startOfLocalDay(now), 1);
    start = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0, 0);
    end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 18, 0, 0);
    nextUnit = "FULL_DAY";
  } else {
    const todayStart = startOfLocalDay(now);
    const daysUntilNextMonday = ((8 - todayStart.getDay()) % 7) || 7;
    const nextMonday = shiftDays(todayStart, daysUntilNextMonday);
    start = new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 9, 0, 0);
    end = new Date(nextMonday.getFullYear(), nextMonday.getMonth(), nextMonday.getDate(), 18, 0, 0);
    nextUnit = "FULL_DAY";
  }

  setLeaveType("ANNUAL");
  setLeaveUnit(nextUnit);
  setLeaveStartDate(toLocalInputValue(start));
  setLeaveEndDate(toLocalInputValue(end));
}

interface PrefillLeaveFormFromCalendarDateActionInput {
  dateKey: string;
  isKoLocale: boolean;
  setLeaveType: Dispatch<SetStateAction<"ANNUAL" | "SICK" | "UNPAID">>;
  setLeaveUnit: Dispatch<SetStateAction<"FULL_DAY" | "HALF_DAY" | "HOUR">>;
  setLeaveStartDate: Dispatch<SetStateAction<string>>;
  setLeaveEndDate: Dispatch<SetStateAction<string>>;
  setLeaveReason: Dispatch<SetStateAction<string>>;
  jumpToSection: (sectionId: string) => void;
  pushMobileFlowFeedback: (message: string) => void;
}

export function prefillLeaveFormFromCalendarDateAction(input: PrefillLeaveFormFromCalendarDateActionInput) {
  const {
    dateKey,
    isKoLocale,
    setLeaveType,
    setLeaveUnit,
    setLeaveStartDate,
    setLeaveEndDate,
    setLeaveReason,
    jumpToSection,
    pushMobileFlowFeedback
  } = input;
  const [yearText, monthText, dayText] = dateKey.split("-");
  const yearNumber = Number(yearText);
  const monthNumber = Number(monthText);
  const dayNumber = Number(dayText);
  if (
    !Number.isInteger(yearNumber) ||
    !Number.isInteger(monthNumber) ||
    !Number.isInteger(dayNumber) ||
    monthNumber < 1 ||
    monthNumber > 12 ||
    dayNumber < 1 ||
    dayNumber > 31
  ) {
    pushMobileFlowFeedback(
      isKoLocale ? "선택한 날짜를 해석할 수 없습니다." : "Unable to parse selected calendar date."
    );
    return;
  }

  const start = new Date(yearNumber, monthNumber - 1, dayNumber, 9, 0, 0);
  const end = new Date(yearNumber, monthNumber - 1, dayNumber, 18, 0, 0);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    pushMobileFlowFeedback(
      isKoLocale ? "선택한 날짜를 해석할 수 없습니다." : "Unable to parse selected calendar date."
    );
    return;
  }

  setLeaveType("ANNUAL");
  setLeaveUnit("FULL_DAY");
  setLeaveStartDate(toLocalInputValue(start));
  setLeaveEndDate(toLocalInputValue(end));
  setLeaveReason(
    isKoLocale
      ? `${dateKey} 캘린더 선택으로 자동 입력`
      : `Auto-prefilled from calendar selection (${dateKey})`
  );
  jumpToSection("leave");
  pushMobileFlowFeedback(
    isKoLocale
      ? `${dateKey} 휴가 요청 초안이 자동 입력되었습니다.`
      : `Leave request draft for ${dateKey} was auto-prefilled.`
  );
}

interface SetCalendarMonthFromAnchorActionInput {
  anchor: Date;
  monthOffset: number;
  setPeriodStart: Dispatch<SetStateAction<string>>;
  setPeriodEnd: Dispatch<SetStateAction<string>>;
  refreshEmployeeSnapshot: (input: { fromIso: string; toIso: string }) => Promise<void>;
}

export async function setCalendarMonthFromAnchorAction(input: SetCalendarMonthFromAnchorActionInput) {
  const { anchor, monthOffset, setPeriodStart, setPeriodEnd, refreshEmployeeSnapshot } = input;
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth() + monthOffset, 1, 0, 0, 0);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + monthOffset + 1, 0, 23, 59, 0);
  const nextPeriodStart = toLocalInputValue(monthStart);
  const nextPeriodEnd = toLocalInputValue(monthEnd);
  setPeriodStart(nextPeriodStart);
  setPeriodEnd(nextPeriodEnd);
  await refreshEmployeeSnapshot({
    fromIso: toIso(nextPeriodStart),
    toIso: toIso(nextPeriodEnd)
  });
}

interface MoveCalendarMonthActionInput {
  monthOffset: number;
  periodStart: string;
  setCalendarMonthFromAnchor: (anchor: Date, monthOffset: number) => Promise<void>;
}

export async function moveCalendarMonthAction(input: MoveCalendarMonthActionInput) {
  const { monthOffset, periodStart, setCalendarMonthFromAnchor } = input;
  const parsedPeriodStart = new Date(periodStart);
  const anchor = Number.isNaN(parsedPeriodStart.getTime()) ? new Date() : parsedPeriodStart;
  await setCalendarMonthFromAnchor(anchor, monthOffset);
}

export async function resetCalendarToCurrentMonthAction(
  setCalendarMonthFromAnchor: (anchor: Date, monthOffset: number) => Promise<void>
) {
  await setCalendarMonthFromAnchor(new Date(), 0);
}

interface ApplyRequestSearchPresetActionInput {
  preset: {
    scope: RequestSearchScope;
    query: string;
    sortOption: RequestSortOption;
    targetSectionId: string;
    feedback: string;
  };
  setRequestSearchScope: Dispatch<SetStateAction<RequestSearchScope>>;
  setRequestSearchQuery: Dispatch<SetStateAction<string>>;
  setRequestSortOption: Dispatch<SetStateAction<RequestSortOption>>;
  jumpToSection: (sectionId: string) => void;
  pushMobileFlowFeedback: (message: string) => void;
}

export function applyRequestSearchPresetAction(input: ApplyRequestSearchPresetActionInput) {
  const {
    preset,
    setRequestSearchScope,
    setRequestSearchQuery,
    setRequestSortOption,
    jumpToSection,
    pushMobileFlowFeedback
  } = input;
  setRequestSearchScope(preset.scope);
  setRequestSearchQuery(preset.query);
  setRequestSortOption(preset.sortOption);
  jumpToSection(preset.targetSectionId);
  pushMobileFlowFeedback(preset.feedback);
}

interface ApplyLeaveRequestToResubmitDraftActionInput {
  request: LeaveRequestDto;
  setLeaveType: Dispatch<SetStateAction<"ANNUAL" | "SICK" | "UNPAID">>;
  setLeaveUnit: Dispatch<SetStateAction<"FULL_DAY" | "HALF_DAY" | "HOUR">>;
  setLeaveStartDate: Dispatch<SetStateAction<string>>;
  setLeaveEndDate: Dispatch<SetStateAction<string>>;
  setLeaveHours: Dispatch<SetStateAction<string>>;
  setLeaveReason: Dispatch<SetStateAction<string>>;
  setLastLeaveRequestId: Dispatch<SetStateAction<string>>;
}

export function applyLeaveRequestToResubmitDraftAction(input: ApplyLeaveRequestToResubmitDraftActionInput) {
  const {
    request,
    setLeaveType,
    setLeaveUnit,
    setLeaveStartDate,
    setLeaveEndDate,
    setLeaveHours,
    setLeaveReason,
    setLastLeaveRequestId
  } = input;
  setLeaveType(request.leaveType);
  setLeaveUnit(request.unit);
  setLeaveStartDate(toLocalInputValue(new Date(request.startDate)));
  setLeaveEndDate(toLocalInputValue(new Date(request.endDate)));
  if (request.unit === "HOUR") {
    setLeaveHours(request.hours !== null ? String(request.hours) : "4");
  }
  setLeaveReason(request.reason?.trim() || request.decisionReason?.trim() || "Resubmit draft");
  setLastLeaveRequestId(request.id);
}

interface ApplyAttendanceRecordToCorrectionFormActionInput {
  record: AttendanceRecordDto;
  correctionRequestNote: string;
  setSelectedCorrectionRecordId: Dispatch<SetStateAction<string>>;
  setLastAttendanceId: Dispatch<SetStateAction<string>>;
  setCheckInAt: Dispatch<SetStateAction<string>>;
  setCheckOutAt: Dispatch<SetStateAction<string>>;
  setBreakMinutes: Dispatch<SetStateAction<string>>;
  setIsHoliday: Dispatch<SetStateAction<boolean>>;
  setAttendanceNotes: Dispatch<SetStateAction<string>>;
}

export function applyAttendanceRecordToCorrectionFormAction(
  input: ApplyAttendanceRecordToCorrectionFormActionInput
) {
  const {
    record,
    correctionRequestNote,
    setSelectedCorrectionRecordId,
    setLastAttendanceId,
    setCheckInAt,
    setCheckOutAt,
    setBreakMinutes,
    setIsHoliday,
    setAttendanceNotes
  } = input;
  setSelectedCorrectionRecordId(record.id);
  setLastAttendanceId(record.id);
  setCheckInAt(toLocalInputValue(new Date(record.checkInAt)));
  setCheckOutAt(record.checkOutAt ? toLocalInputValue(new Date(record.checkOutAt)) : "");
  setBreakMinutes(String(record.breakMinutes));
  setIsHoliday(record.isHoliday);
  setAttendanceNotes(record.notes ?? correctionRequestNote);
}

interface ApplyResubmitCandidateToDraftActionInput {
  candidate: ResubmitCandidate;
  attendance: AttendanceRecordDto[];
  leaveRequests: LeaveRequestDto[];
  defaultsCopy: {
    resubmitCorrectionNote: string;
  };
  feedbackCopy: {
    selectedAttendanceResubmitMissing: string;
    selectedLeaveResubmitMissing: string;
    attendanceResubmitDraftApplied: string;
    leaveResubmitDraftApplied: string;
  };
  jumpToSection: (sectionId: string) => void;
  pushMobileFlowFeedback: (message: string) => void;
  setAttendanceNotes: Dispatch<SetStateAction<string>>;
  setLastAppliedResubmitCandidateKey: Dispatch<SetStateAction<string>>;
  applyAttendanceRecordToCorrectionForm: (record: AttendanceRecordDto) => void;
  applyLeaveRequestToResubmitDraft: (request: LeaveRequestDto) => void;
}

export function applyResubmitCandidateToDraftAction(input: ApplyResubmitCandidateToDraftActionInput) {
  const {
    candidate,
    attendance,
    leaveRequests,
    defaultsCopy,
    feedbackCopy,
    jumpToSection,
    pushMobileFlowFeedback,
    setAttendanceNotes,
    setLastAppliedResubmitCandidateKey,
    applyAttendanceRecordToCorrectionForm,
    applyLeaveRequestToResubmitDraft
  } = input;

  if (candidate.channel === "attendance") {
    const targetAttendance = attendance.find((record) => record.id === candidate.recordId);
    if (!targetAttendance) {
      pushMobileFlowFeedback(feedbackCopy.selectedAttendanceResubmitMissing);
      return;
    }
    applyAttendanceRecordToCorrectionForm(targetAttendance);
    setAttendanceNotes(targetAttendance.notes?.trim() || defaultsCopy.resubmitCorrectionNote);
    setLastAppliedResubmitCandidateKey(candidate.key);
    jumpToSection("attendance");
    pushMobileFlowFeedback(feedbackCopy.attendanceResubmitDraftApplied);
    return;
  }

  const targetLeave = leaveRequests.find((request) => request.id === candidate.recordId);
  if (!targetLeave) {
    pushMobileFlowFeedback(feedbackCopy.selectedLeaveResubmitMissing);
    return;
  }
  applyLeaveRequestToResubmitDraft(targetLeave);
  setLastAppliedResubmitCandidateKey(candidate.key);
  jumpToSection("leave");
  pushMobileFlowFeedback(feedbackCopy.leaveResubmitDraftApplied);
}

interface ApplySelectedResubmitCandidateActionInput {
  selectedResubmitCandidate: ResubmitCandidate | null;
  selectResubmitCandidateFirstMessage: string;
  pushMobileFlowFeedback: (message: string) => void;
  applyResubmitCandidateToDraft: (candidate: ResubmitCandidate) => void;
}

export function applySelectedResubmitCandidateAction(input: ApplySelectedResubmitCandidateActionInput) {
  const {
    selectedResubmitCandidate,
    selectResubmitCandidateFirstMessage,
    pushMobileFlowFeedback,
    applyResubmitCandidateToDraft
  } = input;
  if (!selectedResubmitCandidate) {
    pushMobileFlowFeedback(selectResubmitCandidateFirstMessage);
    return;
  }
  applyResubmitCandidateToDraft(selectedResubmitCandidate);
}

interface ApplyLatestResubmitCandidateActionInput {
  resubmitCandidates: ResubmitCandidate[];
  noResubmitTargetMessage: string;
  setSelectedResubmitCandidateKey: Dispatch<SetStateAction<string>>;
  applyResubmitCandidateToDraft: (candidate: ResubmitCandidate) => void;
  pushMobileFlowFeedback: (message: string) => void;
}

export function applyLatestResubmitCandidateAction(input: ApplyLatestResubmitCandidateActionInput) {
  const {
    resubmitCandidates,
    noResubmitTargetMessage,
    setSelectedResubmitCandidateKey,
    applyResubmitCandidateToDraft,
    pushMobileFlowFeedback
  } = input;
  if (resubmitCandidates.length === 0) {
    pushMobileFlowFeedback(noResubmitTargetMessage);
    return;
  }
  const latest = resubmitCandidates[0];
  setSelectedResubmitCandidateKey(latest.key);
  applyResubmitCandidateToDraft(latest);
}

interface ClearResubmitSelectionActionInput {
  setSelectedResubmitCandidateKey: Dispatch<SetStateAction<string>>;
  setLastAppliedResubmitCandidateKey: Dispatch<SetStateAction<string>>;
  resetResubmitSelectionMessage: string;
  pushMobileFlowFeedback: (message: string) => void;
}

export function clearResubmitSelectionAction(input: ClearResubmitSelectionActionInput) {
  const {
    setSelectedResubmitCandidateKey,
    setLastAppliedResubmitCandidateKey,
    resetResubmitSelectionMessage,
    pushMobileFlowFeedback
  } = input;
  setSelectedResubmitCandidateKey("");
  setLastAppliedResubmitCandidateKey("");
  pushMobileFlowFeedback(resetResubmitSelectionMessage);
}

interface CopyFailureCauseActionInput {
  message: string | null;
  noFailureCauseToCopyMessage: string;
  clipboardUnavailableMessage: string;
  copiedLatestFailureCauseMessage: string;
  copyFailureCauseFailedMessage: string;
  pushMobileFlowFeedback: (message: string) => void;
}

export async function copyFailureCauseAction(input: CopyFailureCauseActionInput) {
  const {
    message,
    noFailureCauseToCopyMessage,
    clipboardUnavailableMessage,
    copiedLatestFailureCauseMessage,
    copyFailureCauseFailedMessage,
    pushMobileFlowFeedback
  } = input;
  if (!message) {
    pushMobileFlowFeedback(noFailureCauseToCopyMessage);
    return;
  }
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    pushMobileFlowFeedback(clipboardUnavailableMessage);
    return;
  }
  try {
    await navigator.clipboard.writeText(message);
    pushMobileFlowFeedback(copiedLatestFailureCauseMessage);
  } catch {
    pushMobileFlowFeedback(copyFailureCauseFailedMessage);
  }
}

export function applySelectedCorrectionRecordAction(
  selectedCorrectionRecord: AttendanceRecordDto | null,
  applyAttendanceRecordToCorrectionForm: (record: AttendanceRecordDto) => void
) {
  if (!selectedCorrectionRecord) {
    return;
  }
  applyAttendanceRecordToCorrectionForm(selectedCorrectionRecord);
}

export function applyLatestAttendanceToCorrectionFormAction(
  latestAttendance: AttendanceRecordDto | null,
  applyAttendanceRecordToCorrectionForm: (record: AttendanceRecordDto) => void
) {
  if (!latestAttendance) {
    return;
  }
  applyAttendanceRecordToCorrectionForm(latestAttendance);
}

export function selectCorrectionTargetAction(
  recordId: string,
  setSelectedCorrectionRecordId: Dispatch<SetStateAction<string>>,
  setLastAttendanceId: Dispatch<SetStateAction<string>>
) {
  setSelectedCorrectionRecordId(recordId);
  setLastAttendanceId(recordId);
}

type EmployeeDefaultsCopy = {
  resubmitCorrectionNote: string;
};

type EmployeeFeedbackCopy = {
  attendanceResubmitDraftApplied: string;
  clipboardUnavailable: string;
  copiedLatestFailureCause: string;
  copyFailureCauseFailed: string;
  leaveResubmitDraftApplied: string;
  noFailureCauseToCopy: string;
  noResubmitTarget: string;
  pendingRequestFilterApplied: string;
  resetResubmitSelection: string;
  selectResubmitCandidateFirst: string;
  selectedAttendanceResubmitMissing: string;
  selectedLeaveResubmitMissing: string;
};

interface BuildEmployeeInteractionHandlersInput {
  attendance: AttendanceRecordDto[];
  correctionRequestNote: string;
  defaultsCopy: EmployeeDefaultsCopy;
  feedbackCopy: EmployeeFeedbackCopy;
  isKoLocale: boolean;
  latestAttendance: AttendanceRecordDto | null;
  leaveRequests: LeaveRequestDto[];
  periodStart: string;
  refreshEmployeeSnapshot: (input: { fromIso: string; toIso: string }) => Promise<void>;
  resubmitCandidates: ResubmitCandidate[];
  selectedCorrectionRecord: AttendanceRecordDto | null;
  selectedResubmitCandidate: ResubmitCandidate | null;
  setAttendanceNotes: Dispatch<SetStateAction<string>>;
  setBreakMinutes: Dispatch<SetStateAction<string>>;
  setCheckInAt: Dispatch<SetStateAction<string>>;
  setCheckOutAt: Dispatch<SetStateAction<string>>;
  setIsHoliday: Dispatch<SetStateAction<boolean>>;
  setLastAppliedResubmitCandidateKey: Dispatch<SetStateAction<string>>;
  setLastAttendanceId: Dispatch<SetStateAction<string>>;
  setLastLeaveRequestId: Dispatch<SetStateAction<string>>;
  setLeaveEndDate: Dispatch<SetStateAction<string>>;
  setLeaveHours: Dispatch<SetStateAction<string>>;
  setLeaveReason: Dispatch<SetStateAction<string>>;
  setLeaveStartDate: Dispatch<SetStateAction<string>>;
  setLeaveType: Dispatch<SetStateAction<"ANNUAL" | "SICK" | "UNPAID">>;
  setLeaveUnit: Dispatch<SetStateAction<"FULL_DAY" | "HALF_DAY" | "HOUR">>;
  setMobileFlowFeedback: Dispatch<SetStateAction<string>>;
  setPeriodEnd: Dispatch<SetStateAction<string>>;
  setPeriodStart: Dispatch<SetStateAction<string>>;
  setRequestSearchQuery: Dispatch<SetStateAction<string>>;
  setRequestSearchScope: Dispatch<SetStateAction<RequestSearchScope>>;
  setRequestSortOption: Dispatch<SetStateAction<RequestSortOption>>;
  setSelectedCorrectionRecordId: Dispatch<SetStateAction<string>>;
  setSelectedResubmitCandidateKey: Dispatch<SetStateAction<string>>;
}

export function buildEmployeeInteractionHandlers(input: BuildEmployeeInteractionHandlersInput) {
  const pushMobileFlowFeedback = (message: string) => {
    pushMobileFlowFeedbackAction(message, input.setMobileFlowFeedback);
  };
  const jumpToSection = (sectionId: string) => {
    jumpToSectionAction(sectionId);
  };

  const applyLeaveQuickPreset = (preset: "today-half" | "tomorrow-full" | "next-week-full") => {
    applyLeaveQuickPresetAction({
      preset,
      setLeaveType: input.setLeaveType,
      setLeaveUnit: input.setLeaveUnit,
      setLeaveStartDate: input.setLeaveStartDate,
      setLeaveEndDate: input.setLeaveEndDate
    });
  };

  const prefillLeaveFormFromCalendarDate = (dateKey: string) => {
    prefillLeaveFormFromCalendarDateAction({
      dateKey,
      isKoLocale: input.isKoLocale,
      setLeaveType: input.setLeaveType,
      setLeaveUnit: input.setLeaveUnit,
      setLeaveStartDate: input.setLeaveStartDate,
      setLeaveEndDate: input.setLeaveEndDate,
      setLeaveReason: input.setLeaveReason,
      jumpToSection,
      pushMobileFlowFeedback
    });
  };

  const setCalendarMonthFromAnchor = async (anchor: Date, monthOffset: number) => {
    await setCalendarMonthFromAnchorAction({
      anchor,
      monthOffset,
      setPeriodStart: input.setPeriodStart,
      setPeriodEnd: input.setPeriodEnd,
      refreshEmployeeSnapshot: input.refreshEmployeeSnapshot
    });
  };

  const moveCalendarMonth = async (monthOffset: number) => {
    await moveCalendarMonthAction({
      monthOffset,
      periodStart: input.periodStart,
      setCalendarMonthFromAnchor
    });
  };

  const resetCalendarToCurrentMonth = async () => {
    await resetCalendarToCurrentMonthAction(setCalendarMonthFromAnchor);
  };

  const openPendingRequestSearch = () => {
    applyRequestSearchPresetAction({
      preset: {
        scope: "status",
        query: "pending",
        sortOption: "pending_first",
        targetSectionId: "request-search-sort",
        feedback: input.feedbackCopy.pendingRequestFilterApplied
      },
      setRequestSearchScope: input.setRequestSearchScope,
      setRequestSearchQuery: input.setRequestSearchQuery,
      setRequestSortOption: input.setRequestSortOption,
      jumpToSection,
      pushMobileFlowFeedback
    });
  };

  const applyLeaveRequestToResubmitDraft = (request: LeaveRequestDto) => {
    applyLeaveRequestToResubmitDraftAction({
      request,
      setLeaveType: input.setLeaveType,
      setLeaveUnit: input.setLeaveUnit,
      setLeaveStartDate: input.setLeaveStartDate,
      setLeaveEndDate: input.setLeaveEndDate,
      setLeaveHours: input.setLeaveHours,
      setLeaveReason: input.setLeaveReason,
      setLastLeaveRequestId: input.setLastLeaveRequestId
    });
  };

  const applyAttendanceRecordToCorrectionForm = (record: AttendanceRecordDto) => {
    applyAttendanceRecordToCorrectionFormAction({
      record,
      correctionRequestNote: input.correctionRequestNote,
      setSelectedCorrectionRecordId: input.setSelectedCorrectionRecordId,
      setLastAttendanceId: input.setLastAttendanceId,
      setCheckInAt: input.setCheckInAt,
      setCheckOutAt: input.setCheckOutAt,
      setBreakMinutes: input.setBreakMinutes,
      setIsHoliday: input.setIsHoliday,
      setAttendanceNotes: input.setAttendanceNotes
    });
  };

  const applyResubmitCandidateToDraft = (candidate: ResubmitCandidate) => {
    applyResubmitCandidateToDraftAction({
      candidate,
      attendance: input.attendance,
      leaveRequests: input.leaveRequests,
      defaultsCopy: input.defaultsCopy,
      feedbackCopy: {
        selectedAttendanceResubmitMissing: input.feedbackCopy.selectedAttendanceResubmitMissing,
        selectedLeaveResubmitMissing: input.feedbackCopy.selectedLeaveResubmitMissing,
        attendanceResubmitDraftApplied: input.feedbackCopy.attendanceResubmitDraftApplied,
        leaveResubmitDraftApplied: input.feedbackCopy.leaveResubmitDraftApplied
      },
      jumpToSection,
      pushMobileFlowFeedback,
      setAttendanceNotes: input.setAttendanceNotes,
      setLastAppliedResubmitCandidateKey: input.setLastAppliedResubmitCandidateKey,
      applyAttendanceRecordToCorrectionForm,
      applyLeaveRequestToResubmitDraft
    });
  };

  const applySelectedResubmitCandidate = () => {
    applySelectedResubmitCandidateAction({
      selectedResubmitCandidate: input.selectedResubmitCandidate,
      selectResubmitCandidateFirstMessage: input.feedbackCopy.selectResubmitCandidateFirst,
      pushMobileFlowFeedback,
      applyResubmitCandidateToDraft
    });
  };

  const applyLatestResubmitCandidate = () => {
    applyLatestResubmitCandidateAction({
      resubmitCandidates: input.resubmitCandidates,
      noResubmitTargetMessage: input.feedbackCopy.noResubmitTarget,
      setSelectedResubmitCandidateKey: input.setSelectedResubmitCandidateKey,
      applyResubmitCandidateToDraft,
      pushMobileFlowFeedback
    });
  };

  const clearResubmitSelection = () => {
    clearResubmitSelectionAction({
      setSelectedResubmitCandidateKey: input.setSelectedResubmitCandidateKey,
      setLastAppliedResubmitCandidateKey: input.setLastAppliedResubmitCandidateKey,
      resetResubmitSelectionMessage: input.feedbackCopy.resetResubmitSelection,
      pushMobileFlowFeedback
    });
  };

  const copyFailureCause = async (message: string | null) => {
    await copyFailureCauseAction({
      message,
      noFailureCauseToCopyMessage: input.feedbackCopy.noFailureCauseToCopy,
      clipboardUnavailableMessage: input.feedbackCopy.clipboardUnavailable,
      copiedLatestFailureCauseMessage: input.feedbackCopy.copiedLatestFailureCause,
      copyFailureCauseFailedMessage: input.feedbackCopy.copyFailureCauseFailed,
      pushMobileFlowFeedback
    });
  };

  const applySelectedCorrectionRecord = () => {
    applySelectedCorrectionRecordAction(input.selectedCorrectionRecord, applyAttendanceRecordToCorrectionForm);
  };

  const applyLatestAttendanceToCorrectionForm = () => {
    applyLatestAttendanceToCorrectionFormAction(input.latestAttendance, applyAttendanceRecordToCorrectionForm);
  };

  const selectCorrectionTarget = (recordId: string) => {
    selectCorrectionTargetAction(recordId, input.setSelectedCorrectionRecordId, input.setLastAttendanceId);
  };

  return {
    applyAttendanceRecordToCorrectionForm,
    applyLatestAttendanceToCorrectionForm,
    applyLatestResubmitCandidate,
    applyLeaveQuickPreset,
    applyResubmitCandidateToDraft,
    applySelectedCorrectionRecord,
    applySelectedResubmitCandidate,
    clearResubmitSelection,
    copyFailureCause,
    jumpToSection,
    moveCalendarMonth,
    openPendingRequestSearch,
    prefillLeaveFormFromCalendarDate,
    resetCalendarToCurrentMonth,
    selectCorrectionTarget
  };
}
