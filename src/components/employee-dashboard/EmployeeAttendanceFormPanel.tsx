import type { EmployeeAttendanceLeavePanelsProps } from "@/components/employee-dashboard/EmployeeAttendanceLeavePanels";

export function EmployeeAttendanceFormPanel({
  sectionTitles,
  attendanceCopy,
  callApiLabels,
  listBadgeLabels,
  preSubmitStatusLabels,
  requiresLoginSession,
  attendance,
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
  formatDateTime,
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
  onApplyAttendanceRecordToCorrectionForm
}: EmployeeAttendanceLeavePanelsProps) {
  return (
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
        <button className="btn btn-primary" onClick={onCreateAttendance} disabled={requiresLoginSession}>
          {callApiLabels.createAttendance}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCheckOutNow}
          disabled={!lastAttendanceId || requiresLoginSession}
        >
          {callApiLabels.checkOutNow}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onRequestAttendanceCorrection}
          disabled={!correctionValidationIsValid || !attendancePreSubmitValid || requiresLoginSession}
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
  );
}
