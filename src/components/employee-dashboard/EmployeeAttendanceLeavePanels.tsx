import type { CSSProperties } from "react";

import type { resolveEmployeeLocaleLabelBundle } from "@/app/employee/page-locale-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  LeaveTypeDto,
  LeaveBalanceDto,
  LeaveCalendarDayCell,
  LeaveRequestDto,
  PreSubmitCheckItem,
  WorkScheduleDto
} from "@/app/employee/page-types";
import { EmployeeAttendanceLeaveFormsPanel } from "@/components/employee-dashboard/EmployeeAttendanceLeaveFormsPanel";
import { EmployeeApiLogsPanel } from "@/components/employee-dashboard/EmployeeApiLogsPanel";
import { EmployeeLeaveCalendarPanel } from "@/components/employee-dashboard/EmployeeLeaveCalendarPanel";
import { EmployeeSchedulePanel } from "@/components/employee-dashboard/EmployeeSchedulePanel";

type EmployeeLocaleBundle = ReturnType<typeof resolveEmployeeLocaleLabelBundle>;
type RequestStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
type LeaveTypeValue = LeaveTypeDto;
type LeaveUnitValue = "FULL_DAY" | "HALF_DAY" | "HOUR";
type LeaveQuickPreset = "today-half" | "tomorrow-full" | "next-week-full";

export type EmployeeAttendanceLeavePanelsProps = {
  sectionTitles: EmployeeLocaleBundle["surfaceCopy"]["sectionTitles"];
  attendanceCopy: EmployeeLocaleBundle["surfaceCopy"]["attendance"];
  leaveCopy: EmployeeLocaleBundle["surfaceCopy"]["leave"];
  leaveCalendarCopy: EmployeeLocaleBundle["surfaceCopy"]["leaveCalendar"];
  scheduleCopy: EmployeeLocaleBundle["surfaceCopy"]["schedule"];
  apiLogsCopy: EmployeeLocaleBundle["surfaceCopy"]["apiLogs"];
  callApiLabels: EmployeeLocaleBundle["callApiLabels"];
  listBadgeLabels: EmployeeLocaleBundle["listBadgeLabels"];
  preSubmitStatusLabels: EmployeeLocaleBundle["preSubmitStatusLabels"];
  showDevTools: boolean;
  requiresLoginSession: boolean;
  attendance: AttendanceRecordDto[];
  leaveRequests: LeaveRequestDto[];
  schedules: WorkScheduleDto[];
  leaveBalance: LeaveBalanceDto | null;
  checkInAt: string;
  checkOutAt: string;
  breakMinutes: string;
  isHoliday: boolean;
  attendanceNotes: string;
  lastAttendanceId: string;
  selectedCorrectionRecordId: string;
  hasSelectedCorrectionRecord: boolean;
  correctionDeltaLabel: string;
  attendancePreSubmitChecks: PreSubmitCheckItem[];
  attendancePreSubmitValid: boolean;
  correctionValidationMessage: string | null;
  correctionValidationIsValid: boolean;
  latestAttendance: AttendanceRecordDto | null;
  attendanceNotePresets: readonly string[];
  leaveType: LeaveTypeValue;
  leaveUnit: LeaveUnitValue;
  leaveHours: string;
  leaveStartDate: string;
  leaveEndDate: string;
  leaveReason: string;
  cancelReason: string;
  lastLeaveRequestId: string;
  leaveBalanceSummary: string;
  leavePreSubmitChecks: PreSubmitCheckItem[];
  leavePreSubmitValid: boolean;
  leaveUsageRatePercent: number;
  leaveUsageRingStyle: CSSProperties;
  leaveBalanceCards: Array<{
    key: string;
    label: string;
    value: string;
    tone: string;
  }>;
  leaveUsageProjectionLabel: string;
  leaveCalendarMonthLabel: string;
  leaveCalendarWeekdays: readonly string[];
  leaveCalendarCells: LeaveCalendarDayCell[];
  leaveCalendarRows: Array<{
    id: string;
    employeeName: string | null;
    isMine: boolean;
    label: string;
    dateRange: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  }>;
  pendingLabel: string | null;
  logs: ApiLog[];
  stats: { total: number; success: number; fail: number };
  latestPayload: string;
  formatDateTime: (value: string | null) => string;
  formatDays: (value: number) => string;
  toLeaveTypeLabel: (leaveType: string) => string;
  toRequestStatusLabel: (status: RequestStatusValue) => string;
  onCheckInAtChange: (value: string) => void;
  onCheckOutAtChange: (value: string) => void;
  onBreakMinutesChange: (value: string) => void;
  onIsHolidayChange: (value: boolean) => void;
  onAttendanceNotesChange: (value: string) => void;
  onLastAttendanceIdChange: (value: string) => void;
  onSelectCorrectionTarget: (recordId: string) => void;
  onCreateAttendance: () => void;
  onCheckOutNow: () => void;
  onRequestAttendanceCorrection: () => void;
  onApplySelectedCorrectionRecord: () => void;
  onApplyLatestAttendanceToCorrectionForm: () => void;
  onApplyAttendanceRecordToCorrectionForm: (record: AttendanceRecordDto) => void;
  onLeaveTypeChange: (value: LeaveTypeValue) => void;
  onLeaveUnitChange: (value: LeaveUnitValue) => void;
  onLeaveHoursChange: (value: string) => void;
  onLeaveStartDateChange: (value: string) => void;
  onLeaveEndDateChange: (value: string) => void;
  onCancelReasonChange: (value: string) => void;
  onLeaveReasonChange: (value: string) => void;
  onLastLeaveRequestIdChange: (value: string) => void;
  onApplyLeaveQuickPreset: (preset: LeaveQuickPreset) => void;
  onCreateLeave: () => void;
  onCancelLeave: () => void;
  onPrefillLeaveFromCalendarDate: (dateKey: string) => void;
  onMoveCalendarMonth: (delta: number) => void;
  onResetCalendarToCurrentMonth: () => void;
  onClearLogs: () => void;
};

export function EmployeeAttendanceLeavePanels(props: EmployeeAttendanceLeavePanelsProps) {
  const { showDevTools } = props;
  return (
    <>
      <EmployeeAttendanceLeaveFormsPanel {...props} />
      <EmployeeLeaveCalendarPanel {...props} />
      <EmployeeSchedulePanel {...props} />
      {showDevTools ? <EmployeeApiLogsPanel {...props} /> : null}
    </>
  );
}
