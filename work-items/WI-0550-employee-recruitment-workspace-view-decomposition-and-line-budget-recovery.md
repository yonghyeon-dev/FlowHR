# WI-0550: Employee Recruitment Workspace View Decomposition and Line-Budget Recovery

## Summary
- Goal: recover maintainability by splitting employee recruitment workspace orchestration and rendering.
- Scope:
  - `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
  - `src/components/recruitment/EmployeeRecruitmentWorkspaceView.tsx`
  - `src/components/recruitment/employee-recruitment-helpers.ts`
  - `scripts/tests/e2e-wi0550-employee-recruitment-workspace-view-decomposition-and-line-budget-recovery.test.ts`
  - `ROADMAP.md`

## Delivery
- Split `EmployeeRecruitmentWorkspace` into orchestration + view + helper modules.
- Reduced `EmployeeRecruitmentWorkspace.tsx` to line-budget-safe size(<=300).
- Kept existing referral submit/withdraw and filter/search behavior intact.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0550-employee-recruitment-workspace-view-decomposition-and-line-budget-recovery.test.ts`
