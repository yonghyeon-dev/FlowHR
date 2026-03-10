import Link from "next/link";

import type { WorkScheduleDto } from "@/app/employee/page-types";

type EmployeeScheduleSummaryPanelProps = {
  isKoLocale: boolean;
  schedules: WorkScheduleDto[];
  formatDateTime: (value: string | null) => string;
};

function resolveNextSchedule(schedules: WorkScheduleDto[]) {
  const nowMs = Date.now();
  return schedules.find((schedule) => {
    const endAtMs = new Date(schedule.endAt).getTime();
    return Number.isFinite(endAtMs) && endAtMs >= nowMs;
  }) ?? schedules[0] ?? null;
}

export function EmployeeScheduleSummaryPanel({
  isKoLocale,
  schedules,
  formatDateTime
}: EmployeeScheduleSummaryPanelProps) {
  const nextSchedule = resolveNextSchedule(schedules);
  const scheduleWorkspaceHref = "/employee/schedule?source=employee-dashboard";

  return (
    <article className="panel" id="schedule-summary">
      <h2>{isKoLocale ? "이번 근무 일정" : "Upcoming schedule"}</h2>
      <p className="small">
        {isKoLocale
          ? "Today 홈에서는 일정 요약만 확인하고, 상세 확인과 기간별 작업은 전용 일정 워크스페이스에서 이어갑니다."
          : "Keep the Today home focused on summary, then continue detailed schedule work from the dedicated schedule workspace."}
      </p>
      {nextSchedule ? (
        <ul className="simple-list">
          <li>
            <span>{isKoLocale ? "다음 일정" : "Next shift"}</span>
            <strong>
              {formatDateTime(nextSchedule.startAt)} ~ {formatDateTime(nextSchedule.endAt)}
            </strong>
          </li>
          <li>
            <span>{isKoLocale ? "휴일 여부" : "Holiday"}</span>
            <strong>{nextSchedule.isHoliday ? (isKoLocale ? "휴일 근무" : "Holiday shift") : isKoLocale ? "일반 근무" : "Workday shift"}</strong>
          </li>
          <li>
            <span>{isKoLocale ? "휴게 시간" : "Break"}</span>
            <strong>
              {nextSchedule.breakMinutes}
              {isKoLocale ? "분" : "m"}
            </strong>
          </li>
        </ul>
      ) : (
        <p className="small muted">
          {isKoLocale
            ? "표시할 일정이 없습니다. 전용 일정 워크스페이스에서 기간을 바꿔 다시 확인해 주세요."
            : "No schedules are visible yet. Open the dedicated schedule workspace and refresh the range."}
        </p>
      )}
      <div className="actions">
        <Link className="btn btn-primary" href={scheduleWorkspaceHref}>
          {isKoLocale ? "일정 워크스페이스 열기" : "Open schedule workspace"}
        </Link>
        <Link className="btn btn-secondary" href="/employee/attendance">
          {isKoLocale ? "근태 작업 열기" : "Open attendance workspace"}
        </Link>
      </div>
    </article>
  );
}
