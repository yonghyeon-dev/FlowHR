import Link from "next/link";
import type { CSSProperties } from "react";

import type { resolveEmployeeLocaleLabelBundle } from "@/app/employee/page-locale-helpers";
import type {
  ApiLog,
  AttendanceRecordDto,
  LeaveBalanceDto,
  LeaveCalendarDayCell,
  LeaveRequestDto,
  PreSubmitCheckItem,
  WorkScheduleDto
} from "@/app/employee/page-types";
import { EmployeeAttendanceLeaveFormsPanel } from "@/components/employee-dashboard/EmployeeAttendanceLeaveFormsPanel";
import { EmployeeLeaveCalendarPanel } from "@/components/employee-dashboard/EmployeeLeaveCalendarPanel";

type EmployeeLocaleBundle = ReturnType<typeof resolveEmployeeLocaleLabelBundle>;
type RequestStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
type LeaveTypeValue = "ANNUAL" | "SICK" | "UNPAID";
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
    label: string;
    dateRange: string;
    status: RequestStatusValue;
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
  const {
    sectionTitles,
    scheduleCopy,
    apiLogsCopy,
    listBadgeLabels,
    showDevTools,
    schedules,
    pendingLabel,
    logs,
    stats,
    latestPayload,
    formatDateTime,
    onClearLogs
  } = props;
  return (
    <>
      <EmployeeAttendanceLeaveFormsPanel {...props} />
      <EmployeeLeaveCalendarPanel {...props} />

      <article className="panel" id="schedule">
        <h2>{sectionTitles.schedule}</h2>
        {showDevTools ? (
          <div className="actions">
            <Link className="btn btn-secondary" href="/ops/scheduling-cockpit">
              {scheduleCopy.devSchedulingCockpit}
            </Link>
          </div>
        ) : null}
        <ul className="log-list">
          {schedules.length === 0 ? (
            <li>
              <span className="fail">{listBadgeLabels.empty}</span>
              <span>{scheduleCopy.noSchedules}</span>
              <time>-</time>
            </li>
          ) : (
            schedules.map((schedule) => (
              <li key={schedule.id}>
                <span className="ok">{schedule.isHoliday ? listBadgeLabels.holiday : listBadgeLabels.work}</span>
                <span>
                  {formatDateTime(schedule.startAt)} ~ {formatDateTime(schedule.endAt)} ({scheduleCopy.breakMinutesFormat(schedule.breakMinutes)})
                </span>
                <time>{schedule.id}</time>
              </li>
            ))
          )}
        </ul>
      </article>

      {showDevTools ? (
        <article className="panel panel-log">
          <h2>{sectionTitles.apiLogs}</h2>
          <p className="small">
            {apiLogsCopy.runningNow}: <strong>{pendingLabel ?? apiLogsCopy.none}</strong> / {apiLogsCopy.totalCalls} {stats.total}
            {apiLogsCopy.summary(stats.success, stats.fail)}
          </p>
          <div className="actions">
            <button className="btn btn-secondary" onClick={onClearLogs} disabled={logs.length === 0}>
              {apiLogsCopy.clearLogs}
            </button>
          </div>
          <pre>{latestPayload}</pre>
          <ul className="log-list">
            {logs.map((log) => (
              <li key={log.id}>
                <span className={log.ok ? "ok" : "fail"}>
                  {log.ok ? listBadgeLabels.success : listBadgeLabels.fail} {log.status}
                </span>
                <span>
                  {log.label} ({Math.max(0, Math.round(log.durationMs))}ms)
                </span>
                <time>{log.at}</time>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </>
  );
}
