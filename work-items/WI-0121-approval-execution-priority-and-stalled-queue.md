# WI-0121: Approval Execution Priority and Stalled Queue UX

## Background and Problem

결재 실행 현황 화면은 현재 조회/로그 확인 중심이라, 실제 운영에서 "어떤 항목을 먼저 처리할지" 판단이 느립니다. 특히 정체된 항목을 빠르게 발견하고 도메인 조치 화면으로 점프하는 기능이 필요합니다.

## Scope

### In Scope

- `GET /approval/executions` 쿼리에 `sort`, `stalledHoursMin`, `asOf` 확장.
- 우선순위 정렬(`priority_desc`) 로직 추가.
- `stalledHoursMin` 기준 정체 항목 필터링(진행중 PENDING 대상).
- 관리자 UI(`/admin/approval-executions`)에 요약 KPI/정체 표시/빠른 점프 추가.
- WI-0121 e2e 회귀 테스트 추가.

### Out of Scope

- 자동 승인/자동 반려 실행.
- Slack/Discord 에스컬레이션 자동 발송.
- 도메인별 상세 조치 화면 자체의 기능 변경.

## User Scenarios

1. 관리자는 `priority_desc` 정렬로 급여/정체 항목을 먼저 확인한다.
2. 관리자는 `stalledHoursMin`과 `asOf`를 지정해 현재 시점 기준 정체 큐만 조회한다.
3. 관리자는 실행 항목에서 도메인 화면(승인 큐/급여)으로 바로 이동해 조치한다.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| List execution queue (priority/stalled filters) | Allow | Allow (permission-based) | Allow (permission-based) | Deny | Allow |

## Data/API Changes

- DB schema 변경 없음.
- Endpoint change:
  - `GET /approval/executions`
    - query: `sort=updated_desc|priority_desc`
    - query: `stalledHoursMin` (int, optional)
    - query: `asOf` (ISO datetime, optional)

## Test Plan

- Integration:
  - `priority_desc` 정렬 시 진행중 + 도메인 우선순위가 반영된다.
  - `stalledHoursMin` 적용 시 진행중(PENDING) 정체 항목만 반환한다.
  - `updated_desc`는 기존 최신순 동작을 유지한다.
- Regression:
  - 기존 `GET /approval/executions` 필터(`domain/state/target/limit`) 호환.
  - `approval.execution.listed` audit 로그가 유지된다.

## Rollback Plan

- UI에서 정체/우선순위 필터를 숨기고 기존 조회 모드로 회귀.
- API는 `sort=updated_desc`만 사용하도록 호출 단순화.
- Recovery target: 30m.

## Definition of Done (DoD)

- [x] API query 확장(`sort`, `stalledHoursMin`, `asOf`) 적용.
- [x] 서비스 우선순위 정렬/정체 필터 구현.
- [x] 관리자 실행 현황 UI에 정체 표시/빠른 점프 추가.
- [x] WI-0121 e2e 테스트 추가 및 스위트 연결.
