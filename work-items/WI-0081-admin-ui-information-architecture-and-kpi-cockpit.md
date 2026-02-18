# WI-0081: Admin UI Information Architecture and KPI Cockpit

## Background and Problem

현재 관리자 UI는 기능 호출은 가능하지만 정보 구조가 깊고, 우선순위가 즉시 보이지 않아 운영 속도가 떨어집니다.
FlowHR 목표가 Shift/Flex 상위호환으로 상향되었기 때문에, 관리자 액션 시간을 직접 줄이는 UI 재구성이 필요합니다.

## Scope

### In Scope

- `/admin` 관리자 대시보드 정보 구조 재정렬:
  - 핵심 운영 지표 카드(오늘 출근 지연, 미승인 건수, 급여 확정 대기)
  - 우선순위 액션 큐(즉시 처리 필요한 항목)
  - 최근 실패/경고 이벤트 가시화
- `/ops/*`(운영/검증)와 `/admin`(SaaS UI) 간 네비게이션/노출 분리 정리
  - 데스크톱/모바일 공통 레이아웃 사용성 개선
  - KPI baseline 측정 포인트 추가(관리자 조치 시간 측정용)

### Out of Scope

- 신규 도메인 API 추가
- 모바일 네이티브 앱 UI
- 급여 계산 로직 변경

## User Scenarios

1. 운영자는 로그인 후 10초 내에 "지금 처리할 일" 3가지를 확인할 수 있다.
2. 운영자는 근태 이상 건을 클릭해 상세 화면으로 이동하고 3분 내 조치를 완료한다.
3. 운영자는 급여 확정 전 대기 건수를 메인 화면에서 즉시 확인한다.

## Data Changes (Tables and Migrations)

- 없음

## API/Event Changes

- API 스펙 변경 없음 (기존 list/aggregate API 활용)
- UI telemetry 성격의 audit event 추가 검토:
  - `ui.admin.action.started`
  - `ui.admin.action.completed`

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:integration`
- 관리자 주요 여정 수동 점검(3개 시나리오)

## Observability

- 관리자 액션 시작/완료 타임스탬프를 추적할 수 있어야 함
- KPI: `admin_action_median_seconds` baseline 산출

## Rollback Plan

- WI-0081 UI 커밋 revert
- 기존 단일 콘솔 레이아웃으로 즉시 복귀
