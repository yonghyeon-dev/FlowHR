# WI-1087: 직원 계정·가이드 세션 문구 제품화

## 배경

- `WI-1085`, `WI-1086` 이후에도 직원 홈 대시보드 계정 카드와 employee guide에는 userId fallback 또는 `세션 직원 번호` 같은 개발자 중심 문구가 남아 있다.
- 이 두 화면은 직원이 직접 자주 보는 진입점이라, 내부 세션 용어 대신 제품 문구로 정리해야 운영 완성도가 맞는다.

## 목표

- 직원 홈 대시보드 계정 카드와 employee guide에서 userId fallback 및 세션 중심 문구를 제거하고, 로그인 계정/직원 확인 번호 중심의 제품 문구로 통일한다.

## 범위

- `src/app/employee/page.tsx`
- `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- `src/components/employee-guide/EmployeeGuideSections.tsx`
- `scripts/tests/e2e-wi0634-employee-root-session-context-productization.test.ts`
- `scripts/tests/e2e-wi0635-employee-guide-session-context-productization.test.ts`
- `scripts/tests/e2e-wi0705-employee-guide-account-session-identity-devtools-gate.test.ts`
- `scripts/tests/e2e-wi0891-employee-core-workspaces-production-session-gate-and-devlink-cleanup.test.ts`
- `scripts/tests/e2e-wi1087-employee-account-guide-session-copy-productization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 직원 대시보드 계정 카드가 `supabaseSession.userId`를 직접 노출하지 않고, 이메일이 없을 때도 제품 문구 기반 로그인 계정 표시만 사용한다.
2. employee guide는 `세션 직원 번호 / Session employee number` 대신 제품 문구를 사용하고 raw 내부 식별자 의미를 암시하지 않는다.
3. employee account/guide 관련 기존 source guard와 새 회귀 가드가 현재 제품 문구를 기준으로 통과한다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`, `npm run build`가 통과한다.
