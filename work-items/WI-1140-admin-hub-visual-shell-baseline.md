# WI-1140: 관리자 허브 시각 셸 베이스라인

## 배경

- `WI-1116`부터 `WI-1139`까지로 관리자 허브의 grouped shell, route-first 진입, source context, top-level 용어는 정리됐다.
- 하지만 현재 `/admin` 허브는 여전히 공용 panel/kpi 스타일을 그대로 쓰고 있어, 구조는 바뀌었지만 시각적 위계는 과거 대시보드와 크게 다르지 않다.
- UI/UX를 상위 축으로 재정의한 현재 계획상, 이제 첫 visual shell 파동을 시작해야 한다.

## 목표

- 관리자 허브에 전용 hero, summary chip, metric grid, workspace grid 스타일을 도입한다.
- admin sidebar와 admin root만의 시각 언어를 추가해 customer-admin surface가 employee/ops와 다른 밀도를 갖도록 만든다.
- 구조나 route semantics는 바꾸지 않고, 현재 grouped shell 위에 얹는 visual baseline만 만든다.

## 범위

- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/globals.css`
- `scripts/tests/e2e-wi1140-admin-hub-visual-shell-baseline.test.ts`
- `package.json`
- `docs/production-operating-progress.md`

## 비범위

- employee shell 리디자인
- admin workspace 개별 화면 리디자인
- 라우트 구조 변경
- 데이터 모델/권한 정책 변경

## 완료 기준

1. `/admin` 루트가 전용 hero, summary chip, metric section, workspace grid 시각 구조를 가진다.
2. admin sidebar와 root가 공용 기본 셸과 다른 전용 class baseline을 가진다.
3. 새 회귀 가드가 추가되고 `npm test`, `npm run typecheck`, `npm run test:integration`을 통과한다.
4. PR CI, `main` CI, `vercel-production-deploy`까지 green으로 닫힌다.
