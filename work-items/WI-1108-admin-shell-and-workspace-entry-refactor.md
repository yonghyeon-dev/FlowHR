# WI-1108: 관리자 셸과 워크스페이스 진입 구조 재편

## 배경

- `WI-1107`에서 employee 셸을 `Today / Requests / Documents / Notices & Alerts / Account` 구조로 다시 묶었다.
- 다음 단계에서는 admin 셸도 카드 나열과 ad-hoc focus 링크가 아니라 `control tower + stable workspace entry` 기준으로 정리해야 한다.
- admin은 employee보다 밀도가 높아도 되지만, 같은 제품 안의 역할 뷰라는 규칙을 유지해야 한다.

## 범위

- admin 상위 내비게이션을 `Control Tower / People & Policy / Operations / Payroll & Filing / Settings & Reporting` 기준으로 다시 묶는다.
- `?focus=` 기반 진입 링크와 leaf-level shortcut을 셸 1차 진입점에서 제거한다.
- 모바일 메뉴도 같은 그룹 구조를 따르도록 맞춘다.
- 새 구조를 강제하는 회귀 가드를 추가한다.

## 완료 기준

1. admin 셸이 그룹형 navigation을 사용한다.
2. admin 셸에서 `attendance-live?focus=aggregate`, `payroll-close?focus=all` 같은 hidden subpage 진입이 사라진다.
3. desktop/mobile 모두 같은 상위 그룹 구조를 사용한다.
4. 회귀 가드가 `test:integration`에 연결된다.

## 검증

- `npm run typecheck`
- `npx tsx scripts/tests/e2e-wi1108-admin-shell-grouped-navigation.test.ts`
- `npx tsx scripts/tests/e2e-wi1107-employee-shell-grouped-navigation.test.ts`
- `npx tsx scripts/tests/e2e-wi0219-self-service-ia-and-approval-queue-split.test.ts`
