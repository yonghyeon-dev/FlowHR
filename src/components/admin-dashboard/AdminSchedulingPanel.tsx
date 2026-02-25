import type { WorkScheduleDto } from "@/app/admin/page-types";

type WorkTypeLabels = {
  holiday: string;
  work: string;
};

type AdminSchedulingPanelProps = {
  scheduleEmployeeId: string;
  scheduleIsHoliday: boolean;
  scheduleStartAt: string;
  scheduleEndAt: string;
  scheduleBreakMinutes: string;
  scheduleNotes: string;
  periodStart: string;
  periodEnd: string;
  schedules: WorkScheduleDto[];
  workTypeLabels: WorkTypeLabels;
  formatDateTime: (value: string) => string;
  onScheduleEmployeeIdChange: (value: string) => void;
  onScheduleIsHolidayChange: (value: boolean) => void;
  onScheduleStartAtChange: (value: string) => void;
  onScheduleEndAtChange: (value: string) => void;
  onScheduleBreakMinutesChange: (value: string) => void;
  onScheduleNotesChange: (value: string) => void;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onCreateSchedule: () => void;
  onListSchedules: () => void;
  onDeleteSchedule: (scheduleId: string) => void;
};

export function AdminSchedulingPanel({
  scheduleEmployeeId,
  scheduleIsHoliday,
  scheduleStartAt,
  scheduleEndAt,
  scheduleBreakMinutes,
  scheduleNotes,
  periodStart,
  periodEnd,
  schedules,
  workTypeLabels,
  formatDateTime,
  onScheduleEmployeeIdChange,
  onScheduleIsHolidayChange,
  onScheduleStartAtChange,
  onScheduleEndAtChange,
  onScheduleBreakMinutesChange,
  onScheduleNotesChange,
  onPeriodStartChange,
  onPeriodEndChange,
  onCreateSchedule,
  onListSchedules,
  onDeleteSchedule
}: AdminSchedulingPanelProps) {
  return (
    <article className="panel" id="scheduling">
      <h2>근무 일정</h2>
      <p className="small">직원별 근무 일정을 생성/조회/삭제합니다. 기간 필터(시작/종료)는 아래 기능들과 동일하게 공유됩니다.</p>
      <div className="input-grid">
        <label>
          직원 번호
          <input
            value={scheduleEmployeeId}
            onChange={(event) => onScheduleEmployeeIdChange(event.target.value)}
            placeholder="예: EMP-1001"
          />
        </label>
        <label>
          기간 시작 (조회)
          <input type="datetime-local" value={periodStart} onChange={(event) => onPeriodStartChange(event.target.value)} />
        </label>
        <label>
          기간 종료 (조회)
          <input type="datetime-local" value={periodEnd} onChange={(event) => onPeriodEndChange(event.target.value)} />
        </label>
        <label>
          휴일 근무
          <select value={scheduleIsHoliday ? "yes" : "no"} onChange={(event) => onScheduleIsHolidayChange(event.target.value === "yes")}>
            <option value="no">아니오</option>
            <option value="yes">예</option>
          </select>
        </label>
        <label>
          시작 시각
          <input type="datetime-local" value={scheduleStartAt} onChange={(event) => onScheduleStartAtChange(event.target.value)} />
        </label>
        <label>
          종료 시각
          <input type="datetime-local" value={scheduleEndAt} onChange={(event) => onScheduleEndAtChange(event.target.value)} />
        </label>
        <label>
          휴게 분
          <input type="number" min={0} value={scheduleBreakMinutes} onChange={(event) => onScheduleBreakMinutesChange(event.target.value)} />
        </label>
        <label>
          메모 (선택)
          <input value={scheduleNotes} onChange={(event) => onScheduleNotesChange(event.target.value)} />
        </label>
      </div>
      <div className="actions">
        <button className="btn btn-primary" onClick={onCreateSchedule} disabled={!scheduleEmployeeId.trim()}>
          일정 생성
        </button>
        <button className="btn btn-secondary" onClick={onListSchedules}>
          일정 조회
        </button>
      </div>
      {schedules.length === 0 ? (
        <p className="small muted">근무 일정이 없습니다.</p>
      ) : (
        <ul className="simple-list" aria-label="근무 일정 목록">
          {schedules.map((schedule) => (
            <li key={schedule.id}>
              <span>
                <span className="ok">{schedule.isHoliday ? workTypeLabels.holiday : workTypeLabels.work}</span>{" "}
                <strong>{schedule.employeeId}</strong>{" "}
                <span className="muted">
                  {formatDateTime(schedule.startAt)} ~ {formatDateTime(schedule.endAt)} (휴게 {schedule.breakMinutes}분)
                  {schedule.notes ? ` / ${schedule.notes}` : ""}
                </span>{" "}
                <time className="muted">{schedule.id}</time>
              </span>
              <div className="queue-actions">
                <button type="button" className="btn btn-danger btn-small" onClick={() => onDeleteSchedule(schedule.id)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
