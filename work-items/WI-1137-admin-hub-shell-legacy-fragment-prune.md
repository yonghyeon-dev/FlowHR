# WI-1137: 관리자 허브 레거시 fragment 정리

## 배경

- `WI-1136`으로 관리자 대시보드의 상위 scaffolding은 은퇴했지만, `src/components/admin-dashboard` 아래에는 더 이상 import되지 않는 과거 dashboard fragment가 남아 있다.
- 현재 `/admin`은 grouped shell + workspace hub 기반으로 동작하므로, onboarding/people/scheduling/aggregate/payroll 카드용 legacy component는 유지 비용만 남긴다.
- 오래된 decomposition/locale guard 다수가 아직 이 fragment 파일을 활성 컴포넌트처럼 읽고 있어 구조 수렴을 방해한다.

## 목표

- 실제 미사용 admin dashboard fragment를 lightweight retirement stub로 전환한다.
- stale guard를 현재 route-first admin hub 구조 기준으로 다시 고정한다.
- admin hub가 더 이상 hidden panel component 번들에 의존하지 않는다는 사실을 테스트로 고정한다.

## 범위

- `src/components/admin-dashboard/AdminDashboardChrome.tsx`
- `src/components/admin-dashboard/AdminOnboardingAccountPanels.tsx`
- `src/components/admin-dashboard/AdminPeopleInvitePanels.tsx`
- `src/components/admin-dashboard/AdminSchedulingPanel.tsx`
- `src/components/admin-dashboard/AdminAggregateLeavePanels.tsx`
- `src/components/admin-dashboard/AdminPayrollWorkspaceCard.tsx`
- 관련 stale regression guard
- `docs/production-operating-progress.md`

## 비범위

- 현재 사용 중인 `AdminPayrollPanel`, `AdminDebugLogsPanel` 리팩토링
- `/admin` 허브 정보구조 재설계
- onboarding/people/scheduling 전용 workspace 기능 변경

## 완료 기준

1. 위 6개 legacy fragment가 retirement marker만 남는 lightweight stub로 전환된다.
2. 관련 stale guard가 현재 route-first admin hub 기준으로 통과한다.
3. `npm test`와 `npm run test:integration`이 통과한다.
4. PR CI, `main` CI, `vercel-production-deploy`까지 green으로 닫힌다.
