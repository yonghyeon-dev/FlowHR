# WI-0476: Admin Non-Payroll Workspace Line-Budget Guard

## Summary
- Goal: prevent bloat recurrence in admin non-payroll core workspaces.
- Scope:
  - notices/benefits/recruitment admin workspaces line-budget guard

## Delivery
- Added regression guard test:
  - `scripts/tests/e2e-wi0476-admin-non-payroll-workspace-line-budget-guard.test.ts`
- Guarded line budgets:
  - `src/components/notices/AdminNoticeWorkspace.tsx` <= 300
  - `src/components/benefits/AdminBenefitsWorkspace.tsx` <= 300
  - `src/components/recruitment/AdminRecruitmentWorkspace.tsx` <= 300
- Added forbidden preset-stack pattern checks to block phase-loop style reintroduction.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0476-admin-non-payroll-workspace-line-budget-guard.test.ts`
