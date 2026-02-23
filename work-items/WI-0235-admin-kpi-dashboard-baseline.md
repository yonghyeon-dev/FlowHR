# WI-0235: Admin KPI Dashboard Baseline

## Background

FlowHR 목표 관점(Shiftee/Flex 상위호환)에서 관리자 운영 화면은 `/admin` 단일 페이지 중심이라 핵심 지표를
빠르게 비교하기 어렵습니다. Part 2 Phase 6의 WI-O(관리자 KPI 대시보드) 착수를 위해 별도 라우트 기반
KPI baseline을 먼저 고정합니다.

## Scope

### In Scope

- 신규 관리자 KPI 라우트 추가: `/admin/kpi`
- 사이드 네비게이션에 KPI 대시보드 링크 추가(`admin.nav.kpi`)
- 핵심 KPI 집계/비교 UI baseline
  - 결재: 대기 건수, 24h+ 정체 건수
  - 근태: 승인률
  - 휴가: 승인 일수
  - 급여: 확정률
- 현재 기간 vs 이전 동일 기간 delta 비교 테이블
- API 호출 로그 패널 및 기간/컨텍스트 입력 패널
- locale-aware copy 적용(ko/en)
- anti-bloat 리팩터링
  - `AdminKpiDashboard.tsx`를 300줄 이하로 유지
  - 섹션 컴포넌트 분리

### Out of Scope

- 신규 API/DB 스키마 변경
- 스케줄러/cron/GitHub Actions 추가
- ops 채널(webhook/email) 확장
- KPI 예측/추천/phase-style 고도화

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0235-admin-kpi-dashboard-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0200-browser-locale-dynamic-ui-language-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
