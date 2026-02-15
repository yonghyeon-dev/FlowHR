# WI-0041: Scheduling Overlap Guard (WorkSchedule)

## Background and Problem

현재 `WorkSchedule`는 같은 직원에게 겹치는 시간대의 일정이 중복 생성될 수 있습니다.
이는 이후 Phase 2~3에서 스케줄 대비 출퇴근 이상 탐지/근태 집계 고도화를 진행할 때, 기준 데이터(스케줄)가 오염되어 판단을 어렵게 만듭니다.

## Scope

### In Scope

- 같은 `employeeId`에 대해 시간 구간이 겹치는 `WorkSchedule` 생성 요청을 차단(HTTP 409).
- 경계값: 종료시각이 다음 일정의 시작시각과 정확히 같으면(Back-to-back) 허용.
- 스펙/계약/테스트케이스 업데이트 및 e2e 회귀 테스트 추가.

### Out of Scope

- 반복/템플릿/로테이션 스케줄
- 스케줄 수정/삭제 API
- 스케줄 기반 근태 이상 탐지

## User Scenarios

1. 매니저가 직원에게 09:00~18:00 일정이 이미 있을 때, 17:00~20:00 일정을 추가로 생성하면 409로 거절된다.
2. 매니저가 09:00~18:00 일정이 있을 때, 18:00~22:00 일정(경계만 맞닿음)은 정상 생성된다.

## Payroll Accuracy and Calculation Rules

- N/A (스케줄은 MVP에서 급여 산정에 직접 영향 없음)

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Create schedule | Allow | Allow | Deny | N/A |
| Create overlapping schedule | Allow(409) | Allow(409) | Deny | N/A |
| List schedules | Allow | Allow(employeeId required) | Allow(own only) | N/A |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: behavior-only validation (no DB change)

## API and Event Changes

- Endpoints:
  - `POST /scheduling/schedules` -> add `409 Conflict` when overlapping schedule exists
- Events published:
  - none (existing `scheduling.schedule.assigned.v1` only on successful create)
- Events consumed:
  - none

## Test Plan

- Unit:
  - overlap detection boundary conditions (adjacent vs overlapping)
- Integration:
  - manager overlap create returns 409 and does not emit audit/event
- Regression:
  - e2e WI-0040 scheduling path updated to cover overlap/adjacent cases
- Authorization:
  - unchanged
- Payroll accuracy:
  - N/A

## Observability and Audit Logging

- Audit events:
  - unchanged (`scheduling.schedule.assigned` on success only)
- Metrics:
  - optional: overlap_rejected_count (future)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior: N/A
- DB rollback method: N/A
- Recovery target time: < 30m (revert validation change)

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Implementation matches approved contract.
- [ ] Required tests pass and coverage is updated.
- [ ] Audit logs are emitted for sensitive actions.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked when architecture/compatibility changed.

