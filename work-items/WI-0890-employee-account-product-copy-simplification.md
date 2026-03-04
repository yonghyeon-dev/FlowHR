# WI-0890 Employee Account Product Copy Simplification

## Summary
- Removed developer-centric role/organization/bearer diagnostics from default employee account panel copy.
- Kept production account summary focused on sign-in state with `/login` guidance when signed out.
- Preserved detailed session/query diagnostics under devtools-only disclosure.

## Scope
- `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- `scripts/tests/e2e-wi0890-employee-account-product-copy-simplification.test.ts` (new)

## Acceptance
1. Non-dev product mode account summary no longer exposes `role=` and `org=` diagnostics.
2. Signed-out production sessions show explicit `/login` entry guidance.
3. Devtools-only session/query diagnostic detail remains available.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0705-employee-guide-account-session-identity-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0890-employee-account-product-copy-simplification.test.ts`
- `npm.cmd run build`

