import type { EmployeeAttendanceLeavePanelsProps } from "@/components/employee-dashboard/EmployeeAttendanceLeavePanels";

export function EmployeeLeaveCalendarPanel({
  sectionTitles,
  leaveCalendarCopy,
  leaveBalance,
  leaveUsageRatePercent,
  leaveUsageRingStyle,
  leaveBalanceCards,
  leaveUsageProjectionLabel,
  leaveCalendarMonthLabel,
  leaveCalendarWeekdays,
  leaveCalendarCells,
  leaveCalendarRows,
  formatDays,
  toRequestStatusLabel,
  onPrefillLeaveFromCalendarDate,
  onMoveCalendarMonth,
  onResetCalendarToCurrentMonth
}: EmployeeAttendanceLeavePanelsProps) {
  return (
    <article className="panel" id="leave-calendar">
      <h2>{sectionTitles.leaveCalendar}</h2>
      <p className="small">
        {leaveCalendarCopy.usageRateLabel} {leaveUsageRatePercent}% ({leaveCalendarCopy.usedLabel}{" "}
        {formatDays(leaveBalance?.usedDays ?? 0)} / {leaveCalendarCopy.grantedLabel}{" "}
        {formatDays(leaveBalance?.grantedDays ?? 0)})
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
      <p className="small muted">{leaveCalendarCopy.clickToPrefill}</p>
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
              "is-clickable",
              cell.inCurrentMonth ? "in-month" : "out-month",
              cell.isToday ? "today" : ""
            ]
              .join(" ")
              .trim()}
            role="button"
            tabIndex={0}
            aria-label={`${cell.dateKey} ${leaveCalendarCopy.clickToPrefill}`}
            onClick={() => onPrefillLeaveFromCalendarDate(cell.dateKey)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onPrefillLeaveFromCalendarDate(cell.dateKey);
              }
            }}
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
  );
}
