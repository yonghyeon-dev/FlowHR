# WI-0547: Employee Benefits Pending Aging Risk Filter and Badge

## Summary
- Goal: make long-waiting benefit requests visible to employees with a dedicated risk filter and per-request badge.
- Scope:
  - `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
  - `src/components/benefits/EmployeeBenefitsWorkspaceView.tsx`
  - `src/components/benefits/employee-benefits-helpers.ts`
  - `src/components/benefits/copy.ts`
  - `scripts/tests/e2e-wi0547-employee-benefits-pending-aging-risk-filter-and-badge.test.ts`
  - `ROADMAP.md`

## Delivery
- Added employee benefit request risk filter(`all`/`pending_3d`) with summary count.
- Added pending-aging day(`D+N`) and long-wait badge for submitted requests.
- Extended benefits copy with ko/en risk-filter and pending-aging labels.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0547-employee-benefits-pending-aging-risk-filter-and-badge.test.ts`
