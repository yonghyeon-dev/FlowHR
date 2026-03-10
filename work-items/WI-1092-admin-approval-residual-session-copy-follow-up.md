# WI-1092: 관리자 승인 잔여 세션 문구 후속 정리

## 배경

승인 정책, 승인 이력, 승인 템플릿, 승인 실행 조건 표면에는 여전히 `조직`, `세션 액터`, `Session actor` 같은 낡은 세션 문구가 남아 있다.

동일한 관리자 세션 문맥은 이미 다른 운영 표면에서 `작업 공간 상태`, `관리자 세션 상태`로 정리되었으므로, 승인 계열도 같은 제품 언어로 통일해야 한다.

## 목표

관리자 승인 계열의 세션 상태 라벨을 `작업 공간 상태`, `관리자 세션 상태`로 통일한다.

## 범위

- `src/app/admin/approval-policy/page-locale-helpers.ts`
- `src/app/admin/approval-history/page-locale-helpers.ts`
- `src/app/admin/approval-templates/page-locale-helpers.ts`
- `src/app/admin/approval-executions/page-sections-work-conditions.tsx`
- `scripts/tests/e2e-wi0704-admin-session-identity-devtools-gate-expansion.test.ts`
- `scripts/tests/e2e-wi1083-admin-approval-session-context-humanization.test.ts`
- `scripts/tests/e2e-wi1092-admin-approval-residual-session-copy-follow-up.test.ts`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`
- `package.json`

## 완료 조건

1. 승인 정책, 승인 이력, 승인 템플릿, 승인 실행 조건 표면에서 `Session actor`, `세션 액터` 문구가 남아 있지 않다.
2. 해당 표면은 `작업 공간 상태`, `관리자 세션 상태` 또는 대응 영문 제품 용어만 사용한다.
3. 신규 가드와 기존 관련 가드가 모두 통과한다.
