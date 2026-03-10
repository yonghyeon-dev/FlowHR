# WI-1109: 관리자 컨트롤 타워 진입 모델 정렬

## 배경

- `WI-1108`에서 admin 셸 자체는 grouped navigation으로 재편됐다.
- 하지만 admin 대시보드의 핵심 진입 버튼과 focus card는 아직 셸과 별도로 정의돼 있어, 다시 drift가 생길 여지가 남아 있다.
- 이번 단계에서는 admin 셸과 대시보드가 같은 navigation source를 보도록 묶어서 `control tower -> workspace entry` 모델을 고정한다.

## 범위

- admin 셸 section 정의를 공통 source로 분리한다.
- admin layout은 이 공통 source를 사용해 grouped navigation을 렌더링한다.
- admin dashboard는 이 공통 source에서 대시보드용 핵심 진입 링크를 받아 렌더링한다.
- payroll focus card를 연말정산 단일 진입 대신 primary payroll workspace로 정렬한다.
- 회귀 가드를 추가해 셸과 대시보드가 다시 분리되지 않도록 고정한다.

## 완료 기준

1. admin 셸과 dashboard quick entry가 같은 navigation source를 사용한다.
2. dashboard quick entry는 하드코딩된 3개 버튼이 아니라 grouped shell 기준의 핵심 진입 모델을 따른다.
3. payroll focus card는 `/admin/payroll-close`로 정렬된다.
4. 전용 회귀 가드가 `test:integration`에 연결된다.

## 검증

- `npm run typecheck`
- `npx tsx scripts/tests/e2e-wi1109-admin-control-tower-entry-alignment.test.ts`
- `npx tsx scripts/tests/e2e-wi1108-admin-shell-grouped-navigation.test.ts`
