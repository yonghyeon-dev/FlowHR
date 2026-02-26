# WI-0548: Employee Recruitment Opening Filter and Stalled Days Visibility

## Summary
- Goal: improve referral triage by allowing employees to scope referrals per opening and see stalled-day progress.
- Scope:
  - `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
  - `src/components/recruitment/EmployeeRecruitmentWorkspaceView.tsx`
  - `src/components/recruitment/employee-recruitment-helpers.ts`
  - `src/components/recruitment/copy.ts`
  - `scripts/tests/e2e-wi0548-employee-recruitment-opening-filter-and-stalled-days-visibility.test.ts`
  - `ROADMAP.md`

## Delivery
- Added opening-level filter(`all` + opening id) on employee referral history.
- Added opening-scoped visible count summary and stalled-day(`D+N`) display per referral.
- Extended recruitment copy with ko/en opening-filter and stalled-day labels.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0548-employee-recruitment-opening-filter-and-stalled-days-visibility.test.ts`
