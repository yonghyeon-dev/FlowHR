# WI-0402: Korean Copy Residual Sweep Phase 2

## Summary
- 목적: 한국어 화면에 남아 있던 용어 잔재(`직원 ID`, `조직 ID`, `액터 ID`, `API 로그`)를 일괄 정리하고 용어를 일관화.
- 적용 표준:
  - `내 직원 ID` -> `내 직원 번호`
  - `직원 ID` -> `직원 번호`
  - `조직 ID` -> `조직 식별자`
  - `액터 ID` -> `액터 식별자`
  - `API 로그` -> `요청 로그`
- 범위: 관리자/직원 대시보드, 결재/온보딩, 급여/연말정산/스케줄 copy와 locale helper 전반.
- 회귀 방지: WI-0402 전용 e2e 가드 테스트를 추가해 legacy 용어 재유입 차단.

## Scope
- `src/app/admin/approval-executions/page.tsx`
- `src/app/admin/approval-history/page-locale-helpers.ts`
- `src/app/admin/approval-policy/page-locale-helpers.ts`
- `src/app/admin/approval-templates/page-locale-helpers.ts`
- `src/app/admin/page.tsx`
- `src/app/admin/people/page-view.tsx`
- `src/app/ops/admin-console/page.tsx`
- `src/app/ops/mvp-console/page.tsx`
- `src/components/admin-approval/ApprovalQueuePanel.tsx`
- `src/components/admin-approval/ApprovalQueueSearchSortPanel.tsx`
- `src/components/admin-attendance-live/copy.ts`
- `src/components/admin-dashboard/AdminAggregateLeavePanels.tsx`
- `src/components/admin-dashboard/AdminOnboardingAccountPanels.tsx`
- `src/components/admin-dashboard/AdminPayrollPanel.tsx`
- `src/components/admin-dashboard/AdminPeopleInvitePanels.tsx`
- `src/components/admin-dashboard/AdminSchedulingPanel.tsx`
- `src/components/admin-kpi/copy.ts`
- `src/components/admin-onboarding/copy.ts`
- `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- `src/components/employee-guide/copy.ts`
- `src/components/leave-calendar/copy.ts`
- `src/components/payroll-close/copy.ts`
- `src/components/payroll-insurance/copy.ts`
- `src/components/payroll-payslip-delivery/copy.ts`
- `src/components/payroll-year-end-filing/copy.ts`
- `src/components/payroll-year-end/copy.ts`
- `src/components/payroll-year-end/employee-year-end-input-copy.ts`
- `src/components/scheduling/copy.ts`
- `scripts/tests/e2e-wi0303-admin-employee-locale-dynamic-ui-gap-fix-phase3.test.ts`
- `scripts/tests/e2e-wi0307-admin-pages-locale-dynamic-ui-gap-fix-phase4.test.ts`
- `scripts/tests/e2e-wi0354-admin-onboarding-locale-dynamic-ui-gap-fix.test.ts`
- `scripts/tests/e2e-wi0360-admin-kpi-locale-residual-cleanup.test.ts`
- `scripts/tests/e2e-wi0361-admin-attendance-live-locale-residual-cleanup.test.ts`
- `scripts/tests/e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts`
- `scripts/tests/e2e-wi0402-korean-copy-residual-sweep-phase2.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0303-admin-employee-locale-dynamic-ui-gap-fix-phase3.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0307-admin-pages-locale-dynamic-ui-gap-fix-phase4.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0354-admin-onboarding-locale-dynamic-ui-gap-fix.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0360-admin-kpi-locale-residual-cleanup.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0361-admin-attendance-live-locale-residual-cleanup.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0402-korean-copy-residual-sweep-phase2.test.ts`

