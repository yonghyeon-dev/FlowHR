# WI-1138: 관리자 허브 source context 정리

## 배경

- `WI-1136`, `WI-1137`로 legacy admin dashboard scaffold와 fragment를 정리했지만, 현재 살아 있는 관리자 진입 링크와 배너 문구는 여전히 `admin-dashboard`와 `관리자 대시보드` 기준에 묶여 있다.
- 실제 `/admin` 표면은 grouped shell + workspace hub 구조로 이미 재편됐으므로, source context도 현재 제품 언어인 `admin hub` 기준으로 맞춰야 한다.
- 다만 기존 deep-link와 query entry를 한 번에 깨지 않도록 수신부에서는 `admin-dashboard` 호환을 유지해야 한다.

## 목표

- active admin hub 진입 링크의 `source` query를 `admin-hub`로 전환한다.
- destination surface에서는 `admin-hub`와 `admin-dashboard`를 모두 허용하되, 사용자에게 보여주는 배너와 복귀 라벨은 `관리자 허브` 기준으로 통일한다.
- stale source-context regression guard를 현재 hub 기준으로 다시 고정한다.

## 범위

- `src/app/admin/page.tsx`
- `src/app/admin/page-queue-badges.ts`
- `src/app/admin/page-workspace-hubs.ts`
- `src/app/admin/approval-executions/*`
- `src/app/admin/people/*`
- `src/components/contracts/*`
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `src/components/notices/AdminNoticeWorkspace.tsx`
- `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
- `src/components/leave-calendar/LeaveCalendarConsole.tsx`
- `src/components/admin-attendance-live/AdminAttendanceLiveDashboard.tsx`
- `src/components/payroll-close/*`
- `src/components/payroll-payslip-delivery/*`
- 관련 regression guard
- `docs/production-operating-progress.md`

## 비범위

- top-level 홈 명칭 자체를 `/admin dashboard`에서 다른 route로 바꾸는 대규모 IA 변경
- employee source context 정리
- analytics source context 변경

## 완료 기준

1. active admin hub 진입 링크가 `source=admin-hub`를 사용한다.
2. destination surface가 `admin-dashboard` legacy query를 계속 허용한다.
3. 사용자 표면 배너/복귀 라벨이 `관리자 허브` / `Admin hub` 기준으로 통일된다.
4. `npm test`, `npm run typecheck`, `npm run test:integration`이 통과한다.
5. PR CI, `main` CI, `vercel-production-deploy`까지 green으로 닫힌다.
