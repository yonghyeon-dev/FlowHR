# WI-0083: UI Journey E2E and Regression Gate

## Background and Problem

UI 영역이 확장되어도 자동 회귀 검증이 없으면 릴리즈 속도와 안정성을 동시에 유지할 수 없습니다.
상위호환 목표를 유지하려면 "빠른 UI 개선 + 회귀 차단"을 동시에 강제해야 합니다.

## Scope

### In Scope

- 관리자 핵심 여정 E2E:
  - 우선순위 큐 확인
  - 근태 이슈 조치
  - 급여 확정 전 점검
- 직원 핵심 여정 E2E:
  - 휴가 신청
  - 출퇴근 정정 요청
- CI에 UI 회귀 게이트 추가(실패 시 병합 차단)
- KPI baseline 리포트 자동 출력(테스트 결과 artifact)

### Out of Scope

- 비핵심 페이지 전체 시각 회귀 테스트
- 모바일 앱 E2E
- 성능 부하 테스트

## User Scenarios

1. PR에서 UI 변경이 있을 때 핵심 여정 E2E가 자동 실행된다.
2. 여정 중 하나라도 실패하면 병합이 차단된다.
3. 운영자는 테스트 artifact에서 여정별 소요 시간을 확인한다.

## Data Changes (Tables and Migrations)

- 없음

## API/Event Changes

- 없음 (테스트는 기존 API를 소비)

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:integration`
- `npm run test:e2e` (또는 Playwright 기반 명령)

## Observability

- artifact: `ui-journey-baseline.json`
- KPI:
  - `admin_journey_median_seconds`
  - `employee_journey_median_seconds`

## Rollback Plan

- WI-0083 CI 변경 revert
- 임시로 수동 QA 절차(`qa/gate.checklist.md`)만 유지
