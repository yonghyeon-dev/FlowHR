# WI-0044: Scheduling Template + Recurring Assignment Baseline

## Background and Problem

현재 Scheduling은 개별 일정 CRUD만 가능하여 반복되는 근무 패턴(예: 평일 09:00~18:00)을 매번 수동 입력해야 합니다.
Phase 2 핵심 목표(근무일정 고도화)를 위해 템플릿을 기반으로 일정 생성을 자동화하는 베이스라인이 필요합니다.

## Scope

### In Scope

- `WorkScheduleTemplate` 도메인/테이블 추가
- 템플릿 생성/조회 API:
  - `POST /api/scheduling/templates`
  - `GET /api/scheduling/templates`
- 템플릿 기반 일정 생성 API:
  - `POST /api/scheduling/templates/{templateId}/assign`
- 템플릿 요일 제약 + 기존 일정 overlap 방지 규칙 연동

### Out of Scope

- 템플릿 수정/삭제 UI
- 다일자 일괄 배치 생성
- 로테이션 자동 생성(예: 2교대/3교대 순환)

## User Scenarios

1. 매니저가 평일용 템플릿(월~금, 09:00~18:00)을 생성한다.
2. 매니저가 특정 날짜(예: 2026-02-16)에 템플릿을 직원에게 할당해 실제 `WorkSchedule`을 만든다.
3. 템플릿 요일과 요청 날짜 요일이 다르면 409로 거절된다.

## Payroll Accuracy and Calculation Rules

- 템플릿은 근무일정 생성 편의 기능이며 급여 계산 로직 자체는 변경하지 않는다.
- 생성된 `WorkSchedule`은 기존 스케줄과 동일하게 취급된다.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Create/List schedule template | Allow | Allow | Deny | Allow |
| Assign template to employee | Allow | Allow | Deny | Allow |
| Cross-tenant template access | Deny(404) | Deny(404) | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables:
  - `WorkScheduleTemplate`
- Migration IDs:
  - `202602160001_scheduling_template_recurring`
- Backward compatibility plan:
  - additive table/API/event only (non-breaking)

## API and Event Changes

- Endpoints:
  - `GET /api/scheduling/templates`
  - `POST /api/scheduling/templates`
  - `POST /api/scheduling/templates/{templateId}/assign`
- Events published:
  - `scheduling.template.created.v1`
  - `scheduling.template.assigned.v1`
- Events consumed:
  - none

## Test Plan

- Unit:
  - 템플릿 minute/weekday 유효성 검증
  - 템플릿 요일 불일치 409 검증
- Integration:
  - manager/admin 생성/조회/할당 성공
  - employee 권한 거부
- Regression:
  - 템플릿 할당 후 기존 schedule overlap guard 재사용 검증
- Authorization:
  - tenant scope 불일치 시 404
- Payroll accuracy:
  - no-impact 확인

## Observability and Audit Logging

- Audit events:
  - `scheduling.template.created`
  - `scheduling.template.assigned`
  - (기존) `scheduling.schedule.assigned`
- Metrics:
  - `schedule_template_create_count` (optional)
  - `schedule_template_assign_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior:
  - N/A (추가 API 롤백은 코드 revert로 처리)
- DB rollback method:
  - 서비스 롤백 시 템플릿 API 비노출 + 신규 테이블 미사용
- Recovery target time:
  - < 30m

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

