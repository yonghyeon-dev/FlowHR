# WI-0634 Employee Root Session-Context Productization

## Summary
- removed manual runtime context state (`accessToken`, sticky `organizationId`, sticky `employeeId`) from `/employee` root page
- simplified `useEmployeeRuntimeSession` to derive organization/employee/token context directly from Supabase session
- removed employee account panel manual context inputs (organization, employee, token override)
- kept period filter controls and read-only session metadata visibility in the account overview panel

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0634-employee-root-session-context-productization.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
