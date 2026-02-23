# WI-0236: Admin Realtime Attendance Status Baseline

## Background

FlowHR roadmap Phase 6(`WI-P`) requires a dedicated admin realtime attendance surface.
Current `/admin` mixes many domains and does not provide an immediate scheduled/present/late/absent snapshot
with department and status drill-down.

## Scope

### In Scope

- 신규 관리자 라우트 `GET /admin/attendance-live` 추가
- 사이드 네비에 실시간 근태 링크 추가
- 기존 API 조합 기반 실시간 근태 스냅샷 baseline
  - `/api/people/employees`
  - `/api/people/departments`
  - `/api/scheduling/schedules`
  - `/api/attendance/records`
- 상태 분류
  - `scheduled`, `present`, `late`, `absent`, `checked_out`
- 경고 배지 분류
  - `normal`, `watch`, `critical`
- 필터 UX
  - 기간, 부서, 상태, 검색, 지각/치명 임계 분
- anti-bloat 구조
  - 계산 로직(`src/features/admin-attendance-live/summary.ts`) 분리
  - 화면 컴포넌트 분리 및 300줄 가드 준수

### Out of Scope

- 신규 API/DB contract 변경
- 스케줄러/cron/ops 자동화
- 모바일 앱/푸시 알림 구현

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0236-admin-realtime-attendance-status-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0200-browser-locale-dynamic-ui-language-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
