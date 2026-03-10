import Link from "next/link";

import type { EmployeeAttendanceLeavePanelsProps } from "@/components/employee-dashboard/EmployeeAttendanceLeavePanels";

export function EmployeeSchedulePanel({
  sectionTitles,
  scheduleCopy,
  listBadgeLabels,
  showDevTools,
  schedules,
  formatDateTime
}: EmployeeAttendanceLeavePanelsProps) {
  return (
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
  );
}
