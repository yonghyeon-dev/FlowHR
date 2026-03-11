# WI-1141: 직원 홈 시각 셸 베이스라인

## 배경

- `WI-1117`부터 `WI-1131`까지로 employee self-service는 route-first 구조와 grouped navigation 기준으로 정리됐다.
- `WI-1140`에서 관리자 허브는 첫 visual shell 베이스라인을 얻었지만, 직원 홈은 여전히 공용 shell/panel 스타일에 크게 의존하고 있다.
- 현재 구조 개편 단계 다음에는 employee가 `개인 업무 홈`처럼 느껴지도록 첫 시각 언어를 고정해야 한다.

## 목표

- 직원 홈에 전용 hero, 상태 chip, 홈 전용 panel hierarchy를 도입한다.
- employee sidebar와 employee root만의 시각 언어를 추가해 admin과 다른 밀도와 리듬을 갖도록 만든다.
- 구조와 route semantics는 바꾸지 않고, grouped shell 위에 얹는 첫 visual baseline만 만든다.

## 범위

- `src/app/employee/layout.tsx`
- `src/app/employee/page.tsx`
- `src/components/employee-dashboard/EmployeeDashboardChrome.tsx`
- `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- `src/app/globals.css`
- `scripts/tests/e2e-wi1141-employee-shell-visual-baseline.test.ts`
- `package.json`
- `docs/production-operating-progress.md`

## 비범위

- employee requests / attendance / leave 개별 workspace 리디자인
- admin shell 추가 시각 파동
- 데이터 모델/권한 정책 변경
- 모바일 전용 레이아웃 재설계

## 완료 기준

1. `/employee` 홈 루트가 전용 hero, 상태 chip, 홈 전용 panel hierarchy를 가진다.
2. employee sidebar와 root가 공용 기본 셸과 다른 전용 class baseline을 가진다.
3. 새 회귀 가드가 추가되고 `npm test`, `npm run typecheck`, `npm run test:integration`을 통과한다.
4. PR CI, `main` CI, `vercel-production-deploy`까지 green으로 닫힌다.
