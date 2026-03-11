# WI-1136: 관리자 레거시 대시보드 scaffolding 제거

## 배경

- 관리자 홈은 이미 grouped shell + route-first 허브 기준으로 재편되었다.
- 하지만 예전 임베디드 대시보드 패널 묶음과 상태/액션 scaffolding이 저장소에 남아 있다.
- 이 고아 코드는 현재 제품 경로에서 사용되지 않지만, 오래된 decomposition 가드가 계속 붙잡고 있어 구조 리팩토링 신호를 흐린다.

## 목표

- 관리자 홈에서 더 이상 사용되지 않는 레거시 대시보드 scaffolding을 제거한다.
- route-first 구조를 기준으로 stale decomposition 가드를 다시 쓴다.
- admin 급여/인사/스케줄/집계 작업은 전용 route/workspace 기준으로 존재한다는 현재 제품 모델을 테스트에 고정한다.

## 범위

1. 아래 고아 파일 제거 또는 은퇴 처리
   - `src/app/admin/page-panels.tsx`
   - `src/app/admin/page-compensation-panels.tsx`
   - `src/app/admin/page-state.ts`
   - `src/app/admin/page-dashboard-actions.ts`
   - `src/app/admin/page-directory-actions.ts`
   - `src/components/admin-dashboard/AdminPeopleInvitePanels.tsx`
   - `src/components/admin-dashboard/AdminSchedulingPanel.tsx`
   - `src/components/admin-dashboard/AdminAggregateLeavePanels.tsx`
   - `src/components/admin-dashboard/AdminPayrollWorkspaceCard.tsx`
   - `src/components/admin-dashboard/AdminDashboardChrome.tsx`

2. route-first 기준으로 stale 가드 갱신
   - 더 이상 `page-panels`, `page-state`, `page-dashboard-actions` 존재를 강제하지 않음
   - 대신 관리자 홈이 dedicated route 허브만 노출하는지 검증
   - invite/scheduling/leave-accrual/payroll preview가 전용 route에서 유지되는지 검증

3. 진행 문서 갱신
   - `docs/production-operating-progress.md`

## 완료 기준

1. 관리자 홈 레거시 scaffolding 파일이 더 이상 제품 코드에서 의미 있는 역할을 하지 않는다.
2. route-first 현재 구조를 기준으로 stale decomposition test가 green이다.
3. `main` 머지 후 `ci`와 `vercel-production-deploy`가 green이다.
