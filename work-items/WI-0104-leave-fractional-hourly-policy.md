# WI-0104: 휴가 반차/시간단위 정책 고도화

## Background and Problem

기존 휴가 요청은 일 단위만 지원하여 반차/시간단위 운영이 필요한 한국형 HR SaaS 요구를 충족하지 못했습니다.

## Scope

### In Scope

- 휴가 요청 단위 추가: `FULL_DAY`, `HALF_DAY`, `HOUR`
- 휴가 정책 확장:
  - `allowHalfDay`
  - `allowHourly`
  - `hourlyIncrementMinutes`
  - `maxHoursPerRequest`
- 휴가 잔액 소수 정밀도 반영(일수 `Decimal(6,2)`)
- Employee/Admin UI에 반차/시간단위 입력 및 표시 반영
- 반차/시간단위 정책 허용/차단 e2e 회귀 테스트 추가

### Out of Scope

- 연차촉진 자동화
- 국가별 특수휴가 법규 엔진
- 외부 캘린더 연동

## User Scenarios

1. 직원이 반차를 신청하고 승인 시 `0.5`일이 차감된다.
2. 직원이 시간단위(예: 2시간) 휴가를 신청하고 승인 시 `0.25`일이 차감된다.
3. 관리자가 시간단위 휴가를 비활성화하면 시간단위 신청은 `409`로 차단된다.

## Payroll Accuracy and Calculation Rules

- 기준 근무시간: 1일 = 8시간
- `FULL_DAY`: `days = 서울 기준 일자 span`, `hours = days * 8`
- `HALF_DAY`: `days = 0.5`, `hours = 4`
- `HOUR`: `days = round(hours / 8, 2)`, `hours = round(hours, 2)`
- 시간단위는 정책의 `hourlyIncrementMinutes` 배수여야 하며 `maxHoursPerRequest`를 초과할 수 없다.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator | System |
| --- | --- | --- | --- | --- | --- |
| Create/update own leave request | Allow | Allow (any) | Allow (own) | Allow (any) | Allow |
| Approve/reject leave request | Allow | Allow (policy gate) | Deny | Deny | Allow |
| Read leave policy | Allow | Allow | Deny | Allow | Allow |
| Update leave policy | Allow | Deny | Deny | Allow | Allow |

## Data Changes

- Prisma models: `LeaveRequest`, `LeaveBalanceProjection`, `LeavePolicy`
- Migration IDs:
  - `202602180005_leave_fractional_units`
- Backward compatibility:
  - additive fields(unit, hours, policy flags)
  - Int -> Decimal(6,2) widening with cast migration

## API and Event Changes

- API payload 확장:
  - `POST /leave/requests`: `unit`, `hours`
  - `PATCH /leave/requests/{requestId}`: `unit`, `hours`
  - `PUT /leave/policy`: `allowHalfDay`, `allowHourly`, `hourlyIncrementMinutes`, `maxHoursPerRequest`
- 이벤트 payload 확장:
  - `leave.requested.v1`
  - `leave.approved.v1`
  - `leave.policy.updated.v1`

## Test Plan

- Unit:
  - 단위별 일수/시간 계산 (`FULL_DAY`, `HALF_DAY`, `HOUR`)
  - 시간단위 증분/최대시간 정책 검증
- Integration:
  - 휴가 정책 조회/저장 시 신규 필드 반영
  - 승인 후 잔액 소수 차감 반영
- Regression:
  - 기존 일단위 휴가 플로우 회귀
  - 정산 이후 잔액 연속성 회귀
- Authorization:
  - 정책 차단 시 시간단위/반차 요청 `409`

## Observability and Audit Logging

- Audit:
  - `leave.requested` payload에 `unit`, `hours`, `days`
  - `leave.approved` payload에 `unit`, `hours`, `days`
  - `leave.policy_updated` payload에 정책 신규 필드
- Metrics:
  - `leave_hourly_request_count`
  - `leave_halfday_request_count`
  - `leave_policy_denied_count`

## Rollback Plan

- DB rollback: 정기 점검 창에서 migration rollback 수행
- App rollback: 휴가 정책에서 시간단위/반차 비활성화로 즉시 우회
- Recovery target: 30분 이내

## Definition of Ready (DoR)

- [x] 요구사항/계산 규칙이 테스트 가능하게 정의됨
- [x] 계약/스키마 변경 영향이 식별됨
- [x] 권한 및 정책 거부 동작이 정의됨
- [x] 마이그레이션/롤백 전략이 작성됨

## Definition of Done (DoD)

- [x] leave request/policy schema + service 로직 반영
- [x] memory/prisma 저장소 소수 일수 처리 반영
- [x] Employee/Admin UI 단위/정책 입력 반영
- [x] WI-0104 e2e 회귀 테스트 추가
- [x] QA Code Gate 전체 통과(로컬/CI)
