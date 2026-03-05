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
  const toStateClassName = (status: "PENDING" | "APPROVED" | "REJECTED") =>
    status === "APPROVED" ? "approved" : status === "PENDING" ? "pending" : "rejected";
  const toEventName = (input: { employeeName: string | null; isMine: boolean }) =>
    input.isMine ? leaveCalendarCopy.mineShort : input.employeeName?.trim() || leaveCalendarCopy.coworkerFallback;

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
      <p className="small">{leaveCalendarCopy.teamScopeHint}</p>
      <p className="small muted">{leaveCalendarCopy.clickToPrefill}</p>
      <div className="leave-calendar-legend" aria-label={leaveCalendarCopy.legendLabel}>
        <span className="status-pending">
          <i aria-hidden="true" /> {leaveCalendarCopy.pendingLabel}
        </span>
        <span className="status-approved">
          <i aria-hidden="true" /> {leaveCalendarCopy.approvedLabel}
        </span>
        <span className="status-rejected">
          <i aria-hidden="true" /> {leaveCalendarCopy.rejectedLabel}
        </span>
      </div>
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
                : `${cell.dateKey}: ${cell.requestCount}${leaveCalendarCopy.itemSuffix} (${leaveCalendarCopy.approvedLabel} ${cell.approvedCount}, ${leaveCalendarCopy.pendingLabel} ${cell.pendingCount}, ${leaveCalendarCopy.rejectedLabel} ${cell.rejectedCount})`
            }
          >
            <div className="leave-day-head">
              <span>{cell.dayOfMonth}</span>
              {cell.requestCount > 0 ? <strong>{`${cell.requestCount}${leaveCalendarCopy.itemSuffix}`}</strong> : null}
            </div>
            {cell.events.length > 0 ? (
              <div className="leave-day-events">
                {cell.events.slice(0, 2).map((event) => (
                  <span key={event.requestId} className={`leave-day-event state-${toStateClassName(event.state)}`}>
                    {toEventName(event)}
                  </span>
                ))}
                {cell.events.length > 2 ? (
                  <span className="leave-day-event event-more">+{cell.events.length - 2}</span>
                ) : null}
              </div>
            ) : null}
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
                <strong>{`${row.isMine ? leaveCalendarCopy.mineShort : row.employeeName?.trim() || leaveCalendarCopy.coworkerFallback} · ${row.label}`}</strong>
                <br />
                <span className="small">{row.dateRange}</span>
              </span>
              <span className={`leave-calendar-status-badge state-${toStateClassName(row.status)}`}>
                {toRequestStatusLabel(row.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
