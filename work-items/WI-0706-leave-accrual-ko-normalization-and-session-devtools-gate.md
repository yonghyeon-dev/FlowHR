# WI-0706 Leave Accrual KO Normalization and Session Devtools Gate

## Summary
- normalized corrupted Korean runtime copy in `src/components/leave-accrual/LeaveAccrualAutoGrantConsole.tsx`
  to readable product-facing Korean labels/messages.
- gated read-only session identity metadata (`session organization/admin`) in the leave-accrual
  conditions panel behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`.
- kept leave accrual API/auth/request flow unchanged.

## Scope
- UI copy normalization + UI exposure control only
- no API/schema/contract changes
- no ops route changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0706-leave-accrual-ko-normalization-and-session-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0632-admin-leave-calendar-accrual-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0638-session-context-regression-guard-for-core-surfaces.test.ts`
- `npm.cmd run typecheck`
