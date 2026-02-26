# WI-0549: Employee Benefits Workspace View Decomposition and Line-Budget Recovery

## Summary
- Goal: recover maintainability by splitting employee benefits workspace orchestration and rendering.
- Scope:
  - `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
  - `src/components/benefits/EmployeeBenefitsWorkspaceView.tsx`
  - `src/components/benefits/employee-benefits-helpers.ts`
  - `scripts/tests/e2e-wi0549-employee-benefits-workspace-view-decomposition-and-line-budget-recovery.test.ts`
  - `ROADMAP.md`

## Delivery
- Split `EmployeeBenefitsWorkspace` into orchestration + view + helper modules.
- Reduced `EmployeeBenefitsWorkspace.tsx` to line-budget-safe size(<=300).
- Preserved existing employee benefits API flow and UI behaviors.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0549-employee-benefits-workspace-view-decomposition-and-line-budget-recovery.test.ts`
