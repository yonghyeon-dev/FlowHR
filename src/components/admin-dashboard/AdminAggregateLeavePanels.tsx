import type { AttendanceAggregateDto, LeaveBalanceDto } from "@/app/admin/page-types";

type AdminAggregateLeavePanelsProps = {
  aggregateEmployeeId: string;
  aggregates: AttendanceAggregateDto[];
  accrualEmployeeId: string;
  accrualYear: string;
  accrualGrantDays: string;
  accrualCarryCapDays: string;
  leaveAllowHalfDay: boolean;
  leaveAllowHourly: boolean;
  leaveHourlyIncrementMinutes: string;
  leaveMaxHoursPerRequest: string;
  leaveMinNoticeDays: string;
  leaveMaxConsecutiveDays: string;
  accrualResult: LeaveBalanceDto | null;
  organizationId: string;
  updatedAtLabel: string;
  formatDateTime: (value: string) => string;
  minutesToHours: (minutes: number) => string;
  formatDays: (value: number) => string;
  onAggregateEmployeeIdChange: (value: string) => void;
  onListAttendanceAggregates: () => void;
  onListAttendanceAggregatesAll: () => void;
  onApplyAggregateEmployee: (employeeId: string) => void;
  onAccrualEmployeeIdChange: (value: string) => void;
  onAccrualYearChange: (value: string) => void;
  onAccrualGrantDaysChange: (value: string) => void;
  onAccrualCarryCapDaysChange: (value: string) => void;
  onLeaveAllowHalfDayChange: (value: boolean) => void;
  onLeaveAllowHourlyChange: (value: boolean) => void;
  onLeaveHourlyIncrementMinutesChange: (value: string) => void;
  onLeaveMaxHoursPerRequestChange: (value: string) => void;
  onLeaveMinNoticeDaysChange: (value: string) => void;
  onLeaveMaxConsecutiveDaysChange: (value: string) => void;
  onLoadLeavePolicy: () => void;
  onSaveLeavePolicy: () => void;
  onSettleLeaveAccrual: () => void;
};

export function AdminAggregateLeavePanels({
  aggregateEmployeeId,
  aggregates,
  accrualEmployeeId,
  accrualYear,
  accrualGrantDays,
  accrualCarryCapDays,
  leaveAllowHalfDay,
  leaveAllowHourly,
  leaveHourlyIncrementMinutes,
  leaveMaxHoursPerRequest,
  leaveMinNoticeDays,
  leaveMaxConsecutiveDays,
  accrualResult,
  organizationId,
  updatedAtLabel,
  formatDateTime,
  minutesToHours,
  formatDays,
  onAggregateEmployeeIdChange,
  onListAttendanceAggregates,
  onListAttendanceAggregatesAll,
  onApplyAggregateEmployee,
  onAccrualEmployeeIdChange,
  onAccrualYearChange,
  onAccrualGrantDaysChange,
  onAccrualCarryCapDaysChange,
  onLeaveAllowHalfDayChange,
  onLeaveAllowHourlyChange,
  onLeaveHourlyIncrementMinutesChange,
  onLeaveMaxHoursPerRequestChange,
  onLeaveMinNoticeDaysChange,
  onLeaveMaxConsecutiveDaysChange,
  onLoadLeavePolicy,
  onSaveLeavePolicy,
  onSettleLeaveAccrual
}: AdminAggregateLeavePanelsProps) {
  return (
    <>
      <article className="panel" id="aggregates">
        <h2>근태 집계</h2>
        <div className="input-grid">
          <label>
            직원 ID (선택)
            <input
              value={aggregateEmployeeId}
              onChange={(event) => onAggregateEmployeeIdChange(event.target.value)}
              placeholder="비우면 전체"
            />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={onListAttendanceAggregates}>
            집계 조회
          </button>
          <button className="btn btn-secondary" onClick={onListAttendanceAggregatesAll}>
            전체 집계
          </button>
        </div>
        {aggregates.length > 0 ? (
          <ul className="simple-list" aria-label="근태 집계 결과">
            {aggregates.map((aggregate) => (
              <li key={aggregate.employeeId}>
                <span>
                  <strong>{aggregate.employeeId}</strong>{" "}
                  <span className="muted">
                    승인 {aggregate.counts.approved} / 대기 {aggregate.counts.pending} / 반려 {aggregate.counts.rejected} / 급여반영 {aggregate.counts.payable}
                    {" · "}정규 {minutesToHours(aggregate.totals.regular)} / 연장 {minutesToHours(aggregate.totals.overtime)} / 야간 {minutesToHours(aggregate.totals.night)} / 휴일 {minutesToHours(aggregate.totals.holiday)}
                  </span>
                </span>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => onApplyAggregateEmployee(aggregate.employeeId)}>
                  이 직원으로 적용
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small muted">집계 데이터가 없습니다.</p>
        )}
      </article>

      <article className="panel" id="leave-policy">
        <h2>휴가 정책/정산 (연차 부여/이월)</h2>
        <p className="small">조직 단위 휴가 정책(연간 부여/이월 상한)을 저장하고, 정산 시 부여/이월 값을 비워두면 정책 기본값이 적용됩니다.</p>
        <div className="input-grid">
          <label>
            직원 ID
            <input value={accrualEmployeeId} onChange={(event) => onAccrualEmployeeIdChange(event.target.value)} />
          </label>
          <label>
            연도
            <input value={accrualYear} onChange={(event) => onAccrualYearChange(event.target.value)} />
          </label>
          <label>
            연차 부여일
            <input value={accrualGrantDays} onChange={(event) => onAccrualGrantDaysChange(event.target.value)} />
          </label>
          <label>
            이월 상한일
            <input value={accrualCarryCapDays} onChange={(event) => onAccrualCarryCapDaysChange(event.target.value)} />
          </label>
          <label>
            반차 허용
            <select value={leaveAllowHalfDay ? "true" : "false"} onChange={(event) => onLeaveAllowHalfDayChange(event.target.value === "true")}>
              <option value="true">허용</option>
              <option value="false">비허용</option>
            </select>
          </label>
          <label>
            시간단위 허용
            <select value={leaveAllowHourly ? "true" : "false"} onChange={(event) => onLeaveAllowHourlyChange(event.target.value === "true")}>
              <option value="true">허용</option>
              <option value="false">비허용</option>
            </select>
          </label>
          <label>
            시간 단위(분)
            <input value={leaveHourlyIncrementMinutes} onChange={(event) => onLeaveHourlyIncrementMinutesChange(event.target.value)} />
          </label>
          <label>
            1회 최대 시간
            <input value={leaveMaxHoursPerRequest} onChange={(event) => onLeaveMaxHoursPerRequestChange(event.target.value)} />
          </label>
          <label>
            사전 신청 최소 일수
            <input type="number" min={0} value={leaveMinNoticeDays} onChange={(event) => onLeaveMinNoticeDaysChange(event.target.value)} />
          </label>
          <label>
            연속 사용 상한(일, 비우면 무제한)
            <input
              type="number"
              min={0.5}
              step="0.5"
              value={leaveMaxConsecutiveDays}
              onChange={(event) => onLeaveMaxConsecutiveDaysChange(event.target.value)}
            />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={onLoadLeavePolicy} disabled={!organizationId.trim()}>
            정책 불러오기
          </button>
          <button className="btn btn-secondary" onClick={onSaveLeavePolicy} disabled={!organizationId.trim()}>
            정책 저장
          </button>
          <button className="btn btn-primary" onClick={onSettleLeaveAccrual}>
            정산 실행
          </button>
        </div>
        {accrualResult ? (
          <p className="small">
            결과: 잔여 {formatDays(accrualResult.remainingDays)}일 (부여 {formatDays(accrualResult.grantedDays)}일, 사용 {formatDays(accrualResult.usedDays)}일, 이월 {formatDays(accrualResult.carryOverDays)}일) / {updatedAtLabel} {formatDateTime(accrualResult.updatedAt)}
          </p>
        ) : (
          <p className="small muted">정산 결과가 아직 없습니다.</p>
        )}
      </article>
    </>
  );
}
