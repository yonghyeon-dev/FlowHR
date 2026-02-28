# WI-0635 Employee Guide Session-Context Productization

## Summary
- removed manual context controls from `/employee/guide` (organization/employee/access token inputs)
- switched guide data hook to Supabase-session derived context (`organizationId`, `employeeId`, bearer token)
- kept guide refresh flow and checklist logic while simplifying profile-ready guard
- gated guide API logs panel behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0635-employee-guide-session-context-productization.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
