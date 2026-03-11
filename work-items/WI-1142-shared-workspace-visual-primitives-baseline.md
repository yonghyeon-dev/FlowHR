# WI-1142: 공통 워크스페이스 시각 프리미티브 베이스라인

## 배경

- `WI-1140`, `WI-1141`로 관리자 허브와 직원 홈의 첫 visual shell baseline은 도입됐다.
- 하지만 실제 route-first 작업면은 여전히 공용 panel, hero, section-card 조합에 크게 의존하고 있어, shell 다음 단계의 공통 시각 리듬이 아직 없다.
- 구조 수렴을 계속하려면 대표 admin workspace와 employee workspace에 공통 hero, summary, section-card 프리미티브를 먼저 고정해야 한다.

## 목표

- shared workspace hero, summary strip, section-card, side-panel baseline을 도입한다.
- admin payroll preview workspace와 employee requests workspace에 같은 계열의 작업면 시각 리듬을 적용한다.
- route semantics와 도메인 동작은 바꾸지 않고, 공통 작업면 시각 프리미티브만 만든다.

## 범위

- `src/app/admin/payroll-close/preview-builder/page-client.tsx`
- `src/app/employee/requests/workspace-content.tsx`
- `src/components/employee-dashboard/EmployeeWorkspaceHero.tsx`
- `src/components/admin-dashboard/AdminPayrollPanel.tsx`
- `src/components/admin-dashboard/AdminDebugLogsPanel.tsx`
- `src/app/globals.css`
- `scripts/tests/e2e-wi1142-shared-workspace-visual-primitives-baseline.test.ts`
- `package.json`
- `docs/production-operating-progress.md`

## 비범위

- notices, benefits, recruitment, contracts 전체 workspace 리디자인
- 관리자 허브/직원 홈의 추가 시각 파동
- 모바일 전용 workspace 레이아웃 재설계
- 공통 컴포넌트 API 대규모 재구성

## 완료 기준

1. admin payroll preview workspace와 employee requests workspace가 공통 hero, summary, section-card 프리미티브를 사용한다.
2. 공통 workspace 프리미티브 class baseline이 `globals.css`에 추가된다.
3. 새 회귀 가드가 추가되고 `npm test`, `npm run typecheck`, `npm run test:integration`을 통과한다.
4. PR CI, `main` CI, `vercel-production-deploy`까지 green으로 닫힌다.
