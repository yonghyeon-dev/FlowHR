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

type EmployeeLocaleBundle = ReturnType<typeof resolveEmployeeLocaleLabelBundle>;
type RequestStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
type LeaveTypeValue = "ANNUAL" | "SICK" | "UNPAID";
type LeaveUnitValue = "FULL_DAY" | "HALF_DAY" | "HOUR";
type LeaveQuickPreset = "today-half" | "tomorrow-full" | "next-week-full";

type EmployeeAttendanceLeavePanelsProps = {
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
  onMoveCalendarMonth: (delta: number) => void;
  onResetCalendarToCurrentMonth: () => void;
  onClearLogs: () => void;
};

export function EmployeeAttendanceLeavePanels({
  sectionTitles,
  attendanceCopy,
  leaveCopy,
  leaveCalendarCopy,
  scheduleCopy,
  apiLogsCopy,
  callApiLabels,
  listBadgeLabels,
  preSubmitStatusLabels,
  showDevTools,
  attendance,
  leaveRequests,
  schedules,
  leaveBalance,
  checkInAt,
  checkOutAt,
  breakMinutes,
  isHoliday,
  attendanceNotes,
  lastAttendanceId,
  selectedCorrectionRecordId,
  hasSelectedCorrectionRecord,
  correctionDeltaLabel,
  attendancePreSubmitChecks,
  attendancePreSubmitValid,
  correctionValidationMessage,
  correctionValidationIsValid,
  latestAttendance,
  attendanceNotePresets,
  leaveType,
  leaveUnit,
  leaveHours,
  leaveStartDate,
  leaveEndDate,
  leaveReason,
  cancelReason,
  lastLeaveRequestId,
  leaveBalanceSummary,
  leavePreSubmitChecks,
  leavePreSubmitValid,
  leaveUsageRatePercent,
  leaveUsageRingStyle,
  leaveBalanceCards,
  leaveUsageProjectionLabel,
  leaveCalendarMonthLabel,
  leaveCalendarWeekdays,
  leaveCalendarCells,
  leaveCalendarRows,
  pendingLabel,
  logs,
  stats,
  latestPayload,
  formatDateTime,
  formatDays,
  toLeaveTypeLabel,
  toRequestStatusLabel,
  onCheckInAtChange,
  onCheckOutAtChange,
  onBreakMinutesChange,
  onIsHolidayChange,
  onAttendanceNotesChange,
  onLastAttendanceIdChange,
  onSelectCorrectionTarget,
  onCreateAttendance,
  onCheckOutNow,
  onRequestAttendanceCorrection,
  onApplySelectedCorrectionRecord,
  onApplyLatestAttendanceToCorrectionForm,
  onApplyAttendanceRecordToCorrectionForm,
  onLeaveTypeChange,
  onLeaveUnitChange,
  onLeaveHoursChange,
  onLeaveStartDateChange,
  onLeaveEndDateChange,
  onCancelReasonChange,
  onLeaveReasonChange,
  onLastLeaveRequestIdChange,
  onApplyLeaveQuickPreset,
  onCreateLeave,
  onCancelLeave,
  onMoveCalendarMonth,
  onResetCalendarToCurrentMonth,
  onClearLogs
}: EmployeeAttendanceLeavePanelsProps) {
  return (
    <>
      <article className="panel" id="attendance">
        <h2>{sectionTitles.attendance}</h2>
        <div className="input-grid">
          <label>
            {attendanceCopy.checkInTime}
            <input type="datetime-local" value={checkInAt} onChange={(event) => onCheckInAtChange(event.target.value)} />
          </label>
          <label>
            {attendanceCopy.checkOutTime}
            <input type="datetime-local" value={checkOutAt} onChange={(event) => onCheckOutAtChange(event.target.value)} />
          </label>
          <label>
            {attendanceCopy.breakMinutes}
            <input type="number" min={0} value={breakMinutes} onChange={(event) => onBreakMinutesChange(event.target.value)} />
          </label>
          <label>
            {attendanceCopy.holidayWork}
            <select value={isHoliday ? "yes" : "no"} onChange={(event) => onIsHolidayChange(event.target.value === "yes")}>
              <option value="no">{attendanceCopy.noOption}</option>
              <option value="yes">{attendanceCopy.yesOption}</option>
            </select>
          </label>
          <label className="full">
            {attendanceCopy.correctionNote}
            <input value={attendanceNotes} onChange={(event) => onAttendanceNotesChange(event.target.value)} />
          </label>
          <label className="full">
            {attendanceCopy.recentTargetRecordId}
            <input value={lastAttendanceId} onChange={(event) => onLastAttendanceIdChange(event.target.value)} />
          </label>
          <label className="full">
            {attendanceCopy.selectCorrectionTargetRecord}
            <select value={selectedCorrectionRecordId} onChange={(event) => onSelectCorrectionTarget(event.target.value)}>
              <option value="">{attendanceCopy.selectFromRecentRecords}</option>
              {attendance.map((record) => (
                <option key={record.id} value={record.id}>
                  {formatDateTime(record.checkInAt)} ~ {formatDateTime(record.checkOutAt)} ({toRequestStatusLabel(record.state)})
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          {attendanceCopy.workTimeDelta}: <strong>{correctionDeltaLabel}</strong>
        </p>
        <div className="pre-submit-check-wrap">
          <p className="small" style={{ margin: "8px 0 0" }}>
            {attendanceCopy.preSubmitChecks} (
            {attendancePreSubmitChecks.filter((check) => check.pass).length}/{attendancePreSubmitChecks.length}{" "}
            {attendanceCopy.passed})
          </p>
          <ul className="pre-submit-check-list" aria-label={attendanceCopy.preSubmitChecksAriaLabel}>
            {attendancePreSubmitChecks.map((check) => (
              <li key={check.id} className={check.pass ? "pass" : "fail"}>
                <strong>{check.pass ? preSubmitStatusLabels.pass : preSubmitStatusLabels.fail}</strong>
                <span>{check.label}</span>
                <p>{check.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        {correctionValidationMessage ? (
          <p className="small" style={{ margin: "8px 0 0", color: "var(--danger)" }}>
            {correctionValidationMessage}
          </p>
        ) : null}
        <div className="actions">
          <button className="btn btn-primary" onClick={onCreateAttendance}>
            {callApiLabels.createAttendance}
          </button>
          <button className="btn btn-secondary" onClick={onCheckOutNow} disabled={!lastAttendanceId}>
            {callApiLabels.checkOutNow}
          </button>
          <button
            className="btn btn-secondary"
            onClick={onRequestAttendanceCorrection}
            disabled={!correctionValidationIsValid || !attendancePreSubmitValid}
          >
            {callApiLabels.requestAttendanceCorrection}
          </button>
          <button className="btn btn-secondary" onClick={onApplySelectedCorrectionRecord} disabled={!hasSelectedCorrectionRecord}>
            {attendanceCopy.loadSelectedRecord}
          </button>
          <button className="btn btn-secondary" onClick={onApplyLatestAttendanceToCorrectionForm} disabled={!latestAttendance}>
            {attendanceCopy.loadLatestRecord}
          </button>
          {attendanceNotePresets.map((preset) => (
            <button key={preset} className="btn btn-secondary" onClick={() => onAttendanceNotesChange(preset)}>
              {preset}
            </button>
          ))}
        </div>
        <ul className="log-list">
          {attendance.length === 0 ? (
            <li>
              <span className="fail">{listBadgeLabels.empty}</span>
              <span>{attendanceCopy.noRecords}</span>
              <time>-</time>
            </li>
          ) : (
            attendance.map((record) => (
              <li key={record.id}>
                <span className={record.state === "APPROVED" ? "ok" : record.state === "PENDING" ? "fail" : "fail"}>
                  {toRequestStatusLabel(record.state)}
                </span>
                <span>
                  {formatDateTime(record.checkInAt)} ~ {formatDateTime(record.checkOutAt)}
                </span>
                <button className="btn btn-secondary" onClick={() => onApplyAttendanceRecordToCorrectionForm(record)}>
                  {attendanceCopy.selectAction}
                </button>
                <time>{record.id}</time>
              </li>
            ))
          )}
        </ul>
      </article>

      <article className="panel" id="leave">
        <h2>{sectionTitles.leave}</h2>
        <p className="small">{leaveBalanceSummary}</p>
        <div className="input-grid">
          <label>
            {leaveCopy.leaveType}
            <select value={leaveType} onChange={(event) => onLeaveTypeChange(event.target.value as LeaveTypeValue)}>
              <option value="ANNUAL">{toLeaveTypeLabel("ANNUAL")}</option>
              <option value="SICK">{toLeaveTypeLabel("SICK")}</option>
              <option value="UNPAID">{toLeaveTypeLabel("UNPAID")}</option>
            </select>
          </label>
          <label>
            {leaveCopy.requestUnit}
            <select value={leaveUnit} onChange={(event) => onLeaveUnitChange(event.target.value as LeaveUnitValue)}>
              <option value="FULL_DAY">{leaveCopy.fullDay}</option>
              <option value="HALF_DAY">{leaveCopy.halfDay}</option>
              <option value="HOUR">{leaveCopy.hourly}</option>
            </select>
          </label>
          <label>
            {leaveCopy.startDate}
            <input type="datetime-local" value={leaveStartDate} onChange={(event) => onLeaveStartDateChange(event.target.value)} />
          </label>
          <label>
            {leaveCopy.endDate}
            <input type="datetime-local" value={leaveEndDate} onChange={(event) => onLeaveEndDateChange(event.target.value)} />
          </label>
          {leaveUnit === "HOUR" ? (
            <label>
              {leaveCopy.hours}
              <input value={leaveHours} onChange={(event) => onLeaveHoursChange(event.target.value)} />
            </label>
          ) : null}
          <label>
            {leaveCopy.cancelReason}
            <input value={cancelReason} onChange={(event) => onCancelReasonChange(event.target.value)} />
          </label>
          <label className="full">
            {leaveCopy.requestReasonOptional}
            <input value={leaveReason} onChange={(event) => onLeaveReasonChange(event.target.value)} />
          </label>
          <label className="full">
            {leaveCopy.recentTargetRequestId}
            <input value={lastLeaveRequestId} onChange={(event) => onLastLeaveRequestIdChange(event.target.value)} />
          </label>
        </div>
        <div className="pre-submit-check-wrap">
          <p className="small" style={{ margin: "8px 0 0" }}>
            {leaveCopy.preSubmitChecks} ({leavePreSubmitChecks.filter((check) => check.pass).length}/{leavePreSubmitChecks.length}{" "}
            {leaveCopy.passed})
          </p>
          <ul className="pre-submit-check-list" aria-label={leaveCopy.preSubmitChecksAriaLabel}>
            {leavePreSubmitChecks.map((check) => (
              <li key={check.id} className={check.pass ? "pass" : "fail"}>
                <strong>{check.pass ? preSubmitStatusLabels.pass : preSubmitStatusLabels.fail}</strong>
                <span>{check.label}</span>
                <p>{check.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="leave-quick-actions" role="group" aria-label={leaveCopy.quickPresetsAriaLabel}>
          <button className="btn btn-secondary btn-small" onClick={() => onApplyLeaveQuickPreset("today-half")}>
            {leaveCopy.todayHalfDay}
          </button>
          <button className="btn btn-secondary btn-small" onClick={() => onApplyLeaveQuickPreset("tomorrow-full")}>
            {leaveCopy.tomorrowFullDay}
          </button>
          <button className="btn btn-secondary btn-small" onClick={() => onApplyLeaveQuickPreset("next-week-full")}>
            {leaveCopy.nextMonday}
          </button>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={onCreateLeave} disabled={!leavePreSubmitValid}>
            {callApiLabels.createLeave}
          </button>
          <button className="btn btn-secondary" onClick={onCancelLeave} disabled={!lastLeaveRequestId}>
            {callApiLabels.cancelLeave}
          </button>
        </div>
        <ul className="log-list">
          {leaveRequests.length === 0 ? (
            <li>
              <span className="fail">{listBadgeLabels.empty}</span>
              <span>{leaveCopy.noRequests}</span>
              <time>-</time>
            </li>
          ) : (
            leaveRequests.map((request) => (
              <li key={request.id}>
                <span className={request.state === "APPROVED" ? "ok" : request.state === "PENDING" ? "fail" : "fail"}>
                  {toRequestStatusLabel(request.state)}
                </span>
                <span>
                  {toLeaveTypeLabel(request.leaveType)} / {formatDateTime(request.startDate)} ~ {formatDateTime(request.endDate)} (
                  {`${formatDays(request.days)}${leaveCopy.dayUnitSuffix}`}
                  {request.unit === "HOUR" && request.hours !== null
                    ? ` / ${request.hours.toFixed(2)}${leaveCopy.hourUnitSuffix}`
                    : request.unit === "HALF_DAY"
                      ? ` / ${leaveCopy.halfDaySuffix}`
                      : ""}
                  )
                </span>
                <time>{request.id}</time>
              </li>
            ))
          )}
        </ul>
      </article>

      <article className="panel" id="leave-calendar">
        <h2>{sectionTitles.leaveCalendar}</h2>
        <p className="small">
          {leaveCalendarCopy.usageRateLabel} {leaveUsageRatePercent}% ({leaveCalendarCopy.usedLabel} {formatDays(leaveBalance?.usedDays ?? 0)} /{" "}
          {leaveCalendarCopy.grantedLabel} {formatDays(leaveBalance?.grantedDays ?? 0)})
        </p>
        <div className="leave-balance-visual" aria-label={leaveCalendarCopy.visualizationAriaLabel}>
          <div className="leave-usage-ring" style={leaveUsageRingStyle}>
            <div>
              <strong>{leaveUsageRatePercent}%</strong>
              <span>{leaveCalendarCopy.usageRateShort}</span>
            </div>
          </div>
          <div className="leave-balance-cards">
            {leaveBalanceCards.length === 0 ? (
              <p className="small">{leaveCalendarCopy.visualizationHint}</p>
            ) : (
              leaveBalanceCards.map((card) => (
                <article key={card.key} className={`leave-balance-card tone-${card.tone}`}>
                  <p>{card.label}</p>
                  <strong>{card.value}</strong>
                </article>
              ))
            )}
          </div>
        </div>
        <p className="small leave-projection">{leaveUsageProjectionLabel}</p>
        <div className="leave-calendar-toolbar">
          <strong>
            {leaveCalendarMonthLabel} {leaveCalendarCopy.densityViewLabel}
          </strong>
          <div className="leave-calendar-shortcuts" aria-label={leaveCalendarCopy.quickNavigationAriaLabel}>
            <button className="btn btn-secondary btn-small" onClick={() => onMoveCalendarMonth(-1)}>
              {leaveCalendarCopy.previousMonth}
            </button>
            <button className="btn btn-secondary btn-small" onClick={onResetCalendarToCurrentMonth}>
              {leaveCalendarCopy.currentMonth}
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => onMoveCalendarMonth(1)}>
              {leaveCalendarCopy.nextMonth}
            </button>
          </div>
        </div>
        <div className="leave-calendar-weekdays" aria-hidden="true">
          {leaveCalendarWeekdays.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="leave-calendar-grid">
          {leaveCalendarCells.map((cell) => (
            <article
              key={cell.dateKey}
              className={[
                "leave-calendar-day",
                `density-${cell.density}`,
                `tone-${cell.tone}`,
                cell.inCurrentMonth ? "in-month" : "out-month",
                cell.isToday ? "today" : ""
              ]
                .join(" ")
                .trim()}
              title={
                cell.requestCount === 0
                  ? `${cell.dateKey}: ${leaveCalendarCopy.noScheduleInDateLabel}`
                  : `${cell.dateKey}: ${cell.requestCount}${leaveCalendarCopy.itemSuffix} (${leaveCalendarCopy.approvedLabel} ${cell.approvedCount}, ${leaveCalendarCopy.pendingLabel} ${cell.pendingCount}, ${leaveCalendarCopy.rejectedOrCanceledLabel} ${cell.rejectedCount})`
              }
            >
              <div className="leave-day-head">
                <span>{cell.dayOfMonth}</span>
                {cell.requestCount > 0 ? <strong>{`${cell.requestCount}${leaveCalendarCopy.itemSuffix}`}</strong> : null}
              </div>
              <p>
                {cell.requestCount === 0
                  ? leaveCalendarCopy.noScheduleLabel
                  : `${leaveCalendarCopy.approvedLabel} ${cell.approvedCount} / ${leaveCalendarCopy.pendingLabel} ${cell.pendingCount} / ${leaveCalendarCopy.rejectedLabel} ${cell.rejectedCount}`}
              </p>
            </article>
          ))}
        </div>
        {leaveCalendarRows.length === 0 ? (
          <p className="small" style={{ marginTop: 12 }}>
            {leaveCalendarCopy.noScheduleInRange}
          </p>
        ) : (
          <ul className="simple-list leave-calendar-list" style={{ marginTop: 12 }}>
            {leaveCalendarRows.map((row) => (
              <li key={row.id}>
                <span>
                  <strong>{row.label}</strong>
                  <br />
                  <span className="small">{row.dateRange}</span>
                </span>
                <span className={row.status === "APPROVED" ? "ok" : row.status === "PENDING" ? "muted" : "fail"}>
                  {toRequestStatusLabel(row.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>

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
