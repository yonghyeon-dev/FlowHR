# WI-0042: Scheduling Update API (WorkSchedule PATCH)

## Background and Problem

`WorkSchedule` baseline 생성(할당)만 가능하면 운영 중 정정/변경이 불가능해 실제 사용이 어렵습니다.
또한 WI-0041에서 추가한 "중복/겹침 방지" 규칙을 수정 경로에도 동일하게 적용해야 데이터 무결성이 유지됩니다.

## Scope

### In Scope

- `PATCH /scheduling/schedules/{scheduleId}` 추가:
  - 일정의 `startAt/endAt/breakMinutes/isHoliday/notes` 부분 수정 지원
  - 동일 직원(`employeeId`) 내 시간 겹침(Overlap) 방지 규칙을 업데이트에도 적용 (409)
- 감사로그/도메인 이벤트 추가:
  - audit: `scheduling.schedule.updated`
  - event: `scheduling.schedule.updated.v1`
- 스펙/계약/테스트케이스 및 e2e 회귀 테스트 추가.

### Out of Scope

- 일정 삭제/취소 API
- 반복/템플릿/로테이션 스케줄
- 스케줄 기반 근태 이상 탐지/대시보드

## User Scenarios

1. 매니저가 직원의 일정(09:00~18:00)을 10:00~19:00으로 수정한다.
2. 매니저가 일정 수정으로 인해 다른 일정과 시간이 겹치면 409로 거절된다.
3. 테넌트가 다른 직원의 일정 수정은 404로 처리되어 존재 여부가 노출되지 않는다.

## Payroll Accuracy and Calculation Rules

- N/A (스케줄은 MVP에서 급여 산정에 직접 영향 없음)

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Patch schedule | Allow | Allow | Deny | N/A |
| Patch schedule across tenant | Allow | Deny(404) | Deny | N/A |
| Patch schedule causing overlap | Allow(409) | Allow(409) | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables: none (behavior/API only)
- Migration IDs: none
- Backward compatibility plan: additive endpoint + new event

## API and Event Changes

- Endpoints:
  - `PATCH /scheduling/schedules/{scheduleId}` (new)
- Events published:
  - `scheduling.schedule.updated.v1` (new)
- Events consumed:
  - none

## Test Plan

- Unit:
  - update payload validation boundaries
  - overlap detection on update (exclude self; adjacent allowed)
- Integration:
  - manager can patch within tenant, employee cannot
- Regression:
  - e2e WI-0042 covers update + overlap rejection + cross-tenant 404
- Authorization:
  - tenant + permission boundaries for patch
- Payroll accuracy:
  - N/A

## Observability and Audit Logging

- Audit events:
  - `scheduling.schedule.updated`
- Metrics:
  - optional: schedule_update_count (future)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior: N/A
- DB rollback method: N/A
- Recovery target time: < 30m (revert endpoint + event addition)

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

