# WI-0043: Scheduling Delete API (WorkSchedule DELETE)

## Background and Problem

현재 스케줄은 생성/수정만 가능하고 삭제가 불가능합니다.
운영 중 잘못 등록된 일정을 제거할 수 없으면 이후 근태/이상 탐지 고도화 단계에서 기준 데이터 품질이 떨어집니다.

## Scope

### In Scope

- `DELETE /scheduling/schedules/{scheduleId}` 추가
- 권한/테넌트 범위 검증:
  - manager/admin만 삭제 가능
  - 타 테넌트 일정 삭제 시 404 (존재 여부 비노출)
- 감사로그/도메인 이벤트 추가:
  - audit: `scheduling.schedule.deleted`
  - event: `scheduling.schedule.deleted.v1`
- 스펙/계약/테스트케이스/e2e 업데이트

### Out of Scope

- soft delete/복구 기능
- 일정 대량 삭제
- 반복/템플릿/로테이션

## User Scenarios

1. 매니저가 잘못 생성한 일정을 삭제한다.
2. 이미 삭제되었거나 존재하지 않는 일정 삭제 요청은 404를 반환한다.
3. 다른 테넌트의 일정 삭제 요청은 404로 처리된다.

## Payroll Accuracy and Calculation Rules

- N/A (스케줄은 MVP에서 급여 산정에 직접 영향 없음)

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Delete schedule | Allow | Allow | Deny | N/A |
| Delete cross-tenant schedule | Allow | Deny(404) | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: additive endpoint + event

## API and Event Changes

- Endpoints:
  - `DELETE /scheduling/schedules/{scheduleId}` (new)
- Events published:
  - `scheduling.schedule.deleted.v1` (new)
- Events consumed:
  - none

## Test Plan

- Unit:
  - schedule delete permission and existence checks
- Integration:
  - manager/admin delete success
  - employee delete denied
  - cross-tenant delete 404
- Regression:
  - WI-0043 e2e에서 create -> delete -> list 검증
- Authorization:
  - permission + tenant boundary
- Payroll accuracy:
  - N/A

## Observability and Audit Logging

- Audit events:
  - `scheduling.schedule.deleted`
- Metrics:
  - optional: schedule_delete_count (future)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior: N/A
- DB rollback method: N/A
- Recovery target time: < 30m (route/service revert)

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

