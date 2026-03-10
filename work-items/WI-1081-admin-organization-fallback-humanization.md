# WI-1081: 관리자 조직 fallback 표면 정리

## 배경

- 관리자 온보딩과 인사 비교 화면은 조직, 부서, 직급 이름 매핑이 비어 있을 때 raw ID로 fallback 된다.
- 운영 표면에서는 매핑 누락 자체를 안내해야지 내부 식별자를 그대로 보여주면 안 된다.

## 목표

- 관리자 온보딩과 인사 관련 표면에서 조직, 부서, 직급 이름이 비어 있어도 raw ID 대신 제품 언어 fallback을 사용한다.

## 범위

- `src/lib/product-language.ts`
- `src/components/admin-dashboard/AdminOnboardingAccountPanels.tsx`
- `src/app/admin/people/page-helpers.ts`
- `scripts/tests/e2e-wi1081-admin-organization-fallback-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 온보딩의 현재 선택 조직 표기가 raw 조직 ID로 fallback 되지 않는다.
2. 인사 비교/트리/프로필 값 포맷이 조직, 부서, 직급 이름 매핑 누락 시 raw ID 대신 사용자용 fallback 라벨을 사용한다.
3. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`, `npm run build`가 통과한다.
