# WI-0237: Admin Onboarding Wizard Baseline

## Background

Phase 6 `WI-Q` requires a first-time tenant setup flow for admins.
Existing `/admin` has fragmented controls, but no single guided onboarding path.

## Scope

### In Scope

- 신규 관리자 라우트 `GET /admin/onboarding` 추가
- 사이드 네비게이션에 온보딩 마법사 링크 추가
- 초기 설정 플로우 baseline
  - 조직 컨텍스트 선택
  - 부서 일괄 등록(CODE,Name line input)
  - 직원 일괄 등록(ID,Name,Email,DepartmentCode line input)
  - 휴가 정책 기본값 적용
- 온보딩 체크리스트/진척도 표시
  - organization / departments / employees / leave_policy
- anti-bloat 구조
  - 체크리스트 로직(`src/features/admin-onboarding/checklist.ts`) 분리
  - 파싱 유틸(`src/components/admin-onboarding/helpers.ts`) 분리

### Out of Scope

- 신규 API/DB 계약 변경
- 스케줄러/ops 자동화
- 모바일 앱/푸시 알림

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0237-admin-onboarding-wizard-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0200-browser-locale-dynamic-ui-language-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
