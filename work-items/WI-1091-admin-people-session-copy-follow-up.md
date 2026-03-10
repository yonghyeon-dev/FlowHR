# WI-1091: 관리자 인사 필터 세션 문구 후속 정리

## 배경

관리자 인사 디렉터리 필터 패널은 세션 연결 상태를 노출할 때 이미 연결 상태 헬퍼를 사용하고 있지만, 라벨은 여전히 `Session organization`, `Session actor` 같은 세션 중심 개발 용어를 유지하고 있다.

다른 관리자 운영 표면은 동일한 devtools 문맥을 `작업 공간 상태`, `관리자 세션 상태`로 정리했으므로, 인사 필터 패널도 같은 제품 용어로 맞춰야 한다.

## 목표

관리자 인사 디렉터리 필터 패널의 devtools 라벨을 `작업 공간 상태`, `관리자 세션 상태`로 통일한다.

## 범위

- `src/app/admin/people/page-view-directory-filters-panel.tsx`
- `scripts/tests/e2e-wi0307-admin-pages-locale-dynamic-ui-gap-fix-phase4.test.ts`
- `scripts/tests/e2e-wi0618-admin-dashboard-productization-and-session-context.test.ts`
- `scripts/tests/e2e-wi0704-admin-session-identity-devtools-gate-expansion.test.ts`
- `scripts/tests/e2e-wi1091-admin-people-session-copy-follow-up.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 관리자 인사 디렉터리 필터 패널에서 `Session organization`, `Session actor`, `세션 조직`, `세션 액터` 문구가 남아 있지 않다.
2. 패널은 `작업 공간 상태`, `관리자 세션 상태` 또는 대응 영문 제품 용어만 사용한다.
3. 신규 가드와 기존 관련 가드가 모두 통과한다.
