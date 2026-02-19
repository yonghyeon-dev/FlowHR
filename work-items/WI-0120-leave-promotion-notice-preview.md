# WI-0120: Leave Promotion Notice Preview Baseline

## Background and Problem

휴가 정책은 신청/정산 제약까지는 관리되지만, 연차촉진 대상자 식별과 사내 공지 초안 생성은 수동 작업에 의존하고 있습니다. 운영자는 연말 공지 윈도우 기준으로 대상자를 빠르게 선별하고 공지 문안을 즉시 확인할 수 있어야 합니다.

## Scope

### In Scope

- `LeavePolicy`에 연차촉진 정책 필드 추가 (`enabled`, `thresholdDays`, `leadDays`, `messageTemplate`).
- `GET /leave/policy/promotion-preview` API 추가.
- 연차촉진 프리뷰 관리자 UI(`/admin/leave-promotion`) 추가.
- 연차촉진 프리뷰 e2e 회귀 테스트 추가.

### Out of Scope

- 자동 발송(이메일/SMS/메신저) 엔진.
- 법률 해석 기반 강제 통지 워크플로 자동 집행.
- 모바일 전용 UX.

## User Scenarios

1. 관리자가 기준 시각과 옵션(`includeUpcoming`)을 지정해 연차촉진 대상자 프리뷰를 조회한다.
2. 공지 윈도우가 닫힌 경우 예정 대상만 확인하고, 윈도우가 열린 경우 즉시 공지 대상을 확인한다.
3. 관리자가 생성된 공지 초안을 복사해 사내 채널에 게시한다.

## Payroll Accuracy and Calculation Rules

- 연차촉진 프리뷰는 휴가 잔여일(`remainingDays`) 읽기 모델만 참조한다.
- 급여 계산식/공제 산식에는 영향이 없다.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| Read promotion preview | Allow | Allow | Allow | Deny | Allow |
| Update promotion policy fields | Allow | Deny | Allow | Deny | Allow |

## Data Changes

- Tables: `LeavePolicy`
- Migration IDs: `202602190007_leave_policy_annual_promotion`
- Backward compatibility: additive columns only (non-breaking defaults).

## API and Event Changes

- Endpoints:
  - `GET /leave/policy/promotion-preview`
  - `GET /leave/policy` (promotion fields returned)
  - `PUT /leave/policy` (promotion fields accepted)
- Events published:
  - `leave.policy.updated.v1` (payload extended with promotion fields)
- Events consumed: none

## Test Plan

- Unit:
  - promotion message template placeholder rendering
  - Seoul year-end window boundary calculation
- Integration:
  - promotion preview target filtering by threshold
  - includeUpcoming on/off behavior in closed window
  - open-window eligible target behavior
- Regression:
  - promotion disabled mode returns empty target list
  - existing leave request/accrual flows remain unchanged
- Authorization:
  - preview read requires leave policy/balance read permissions

## Observability and Audit Logging

- Audit events:
  - `leave.promotion_preview_read`
  - `leave.policy_updated`
- Metrics:
  - `leave_promotion_target_count`
  - `leave_request_rejection_rate`

## Rollback Plan

- `annualLeavePromotionEnabled=false`로 즉시 비활성화.
- 필요 시 migration rollback 대신 기능 플래그/정책 필드로 운영 차단.
- Recovery target: 30m.

## Definition of Ready (DoR)

- [x] 연차촉진 정책 필드 정의 및 API 입력/출력 합의.
- [x] DB 변경이 additive인지 검토 완료.
- [x] QA 시나리오(닫힌 윈도우/열린 윈도우/비활성) 정의 완료.

## Definition of Done (DoD)

- [x] LeavePolicy/Service/API가 연차촉진 정책 필드를 지원한다.
- [x] `/leave/policy/promotion-preview`와 `/admin/leave-promotion`이 연결된다.
- [x] WI-0120 e2e 회귀 테스트가 추가된다.
- [x] specs/roadmap/work-item 문서와 버전이 동기화된다.
