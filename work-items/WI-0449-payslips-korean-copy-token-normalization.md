# WI-0449: Payslips Korean Copy Token Normalization

## Summary
- Goal: `/employee/payslips` 한국어 카피에서 사용자 노출 영어 토큰(`RUN`, `ORG`, `x-actor-*`)을 제거한다.
- Scope:
  - 검색 placeholder/조직 placeholder/토큰 안내 문구 한국어화
  - 회귀 테스트 추가

## Delivery
- Updated `src/app/employee/payslips/page-locale-search-sort-copy.ts`
  - `queryPlaceholder` 한국어 예시로 전환 (`실행-2026-01`).
- Updated `src/app/employee/payslips/page-locale-page-copy.ts`
  - `organizationIdPlaceholder`를 `조직-00001`로 전환.
  - `bearerPlaceholder`의 `x-actor-*` 노출 제거.
- Added `scripts/tests/e2e-wi0449-payslips-korean-copy-token-normalization.test.ts`
  - 위 3개 변경의 회귀를 고정.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0449-payslips-korean-copy-token-normalization.test.ts`
