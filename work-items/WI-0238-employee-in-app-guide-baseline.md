# WI-0238: Employee In-App Guide Baseline

## Background

Phase 6 `WI-R` requires employee-facing in-app guidance so first-login users can finish the core
self-service path quickly without relying on external docs.

## Scope

### In Scope

- 신규 직원 라우트 `GET /employee/guide` 추가
- 직원 사이드 네비게이션에 인앱 가이드 링크 추가
- 인앱 가이드 baseline
  - 컨텍스트 입력(조직/직원 ID, 액세스 토큰)
  - 권장 시작 경로(근태/휴가/명세 핵심 단계)
  - 빠른 이동 링크
  - 최근 14일 활동 기반 체크리스트/진척도
    - 근태 기록
    - 휴가 요청
    - 확정 명세
- locale-aware copy(ko/en) 적용
- anti-bloat 구조
  - 체크리스트 로직(`src/features/employee-guide/checklist.ts`) 분리
  - 데이터 로더 훅(`src/components/employee-guide/useEmployeeGuideData.ts`) 분리

### Out of Scope

- 신규 API/DB 계약 변경
- 스케줄러/ops 자동화
- 모바일 앱/푸시 알림 구현

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0238-employee-in-app-guide-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0200-browser-locale-dynamic-ui-language-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
