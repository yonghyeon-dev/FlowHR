import type { EmployeeAttendanceLeavePanelsProps } from "@/components/employee-dashboard/EmployeeAttendanceLeavePanels";

export function EmployeeLeaveRequestPanel({
  sectionTitles,
  leaveCopy,
  callApiLabels,
  listBadgeLabels,
  preSubmitStatusLabels,
  requiresLoginSession,
  leaveRequests,
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
  formatDateTime,
  formatDays,
  toLeaveTypeLabel,
  toRequestStatusLabel,
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
  onCancelLeave
}: EmployeeAttendanceLeavePanelsProps) {
  return (
    <article className="panel" id="leave">
      <h2>{sectionTitles.leave}</h2>
      <p className="small">{leaveBalanceSummary}</p>
      <div className="input-grid">
        <label>
          {leaveCopy.leaveType}
          <select value={leaveType} onChange={(event) => onLeaveTypeChange(event.target.value as "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "PATERNITY")}>
            <option value="ANNUAL">{toLeaveTypeLabel("ANNUAL")}</option>
            <option value="SICK">{toLeaveTypeLabel("SICK")}</option>
            <option value="UNPAID">{toLeaveTypeLabel("UNPAID")}</option>
            <option value="MATERNITY">{toLeaveTypeLabel("MATERNITY")}</option>
            <option value="PATERNITY">{toLeaveTypeLabel("PATERNITY")}</option>
          </select>
        </label>
        <label>
          {leaveCopy.requestUnit}
          <select value={leaveUnit} onChange={(event) => onLeaveUnitChange(event.target.value as "FULL_DAY" | "HALF_DAY" | "HOUR")}>
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
        <button
          className="btn btn-primary"
          onClick={onCreateLeave}
          disabled={!leavePreSubmitValid || requiresLoginSession}
        >
          {callApiLabels.createLeave}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancelLeave}
          disabled={!lastLeaveRequestId || requiresLoginSession}
        >
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
  );
}
