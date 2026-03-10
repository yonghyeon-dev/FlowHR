# WI-1088: 세션 메뉴 문구 제품화
## 배경

- `SessionMenu`는 admin/employee 공용 진입면인데도 로그인 계정을 `snapshot.email ?? snapshot.userId`로 바로 노출한다.
- 조직 연결 상태도 `Session connected` 성격의 개별 문구로 남아 있어, 최근 employee/account 정리 기준과 언어가 맞지 않는다.
- 공용 셸 표면은 계정 확인 문구와 작업 공간 상태를 같은 제품 언어 규칙으로 통일해야 한다.

## 목표

- `src/components/SessionMenu.tsx`에서 raw `userId` fallback을 제거하고, signed-in account / workspace status 기반의 제품 문구만 노출한다.

## 범위

- `src/components/SessionMenu.tsx`
- `scripts/tests/e2e-wi1088-session-menu-copy-productization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. `SessionMenu`가 `snapshot.userId`를 직접 계정 라벨로 노출하지 않는다.
2. 세션 메뉴의 조직 연결 상태가 `formatWorkspaceConnectionState` 기반 제품 문구를 사용한다.
3. WI-1088 회귀 가드와 전체 필수 검증이 통과한다.
