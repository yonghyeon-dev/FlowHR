# WI-0702 Year-End Session Identity Devtools Gate

## Summary
- gated read-only session identity metadata behind
  `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` in:
  - `src/components/payroll-year-end/PayrollYearEndConsole.tsx`
  - `src/components/payroll-year-end/PayrollYearEndPreflightConsole.tsx`
- kept year-end/preflight request flow, auth header composition, and logs behavior unchanged.

## Scope
- UI exposure control only for payroll year-end surfaces
- no API/schema/contract changes
- no ops route changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0702-year-end-session-identity-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0629-admin-payroll-year-end-session-context-productization.test.ts`
- `npm.cmd run typecheck`
