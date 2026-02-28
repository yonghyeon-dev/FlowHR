# WI-0633 Admin Payroll-Insurance Session-Context Productization

## Summary
- removed manual admin context inputs (`organizationId`, `adminActorId`, `accessToken`) from `/admin/payroll-insurance`
- switched to Supabase-session context for organization/actor/token resolution
- preserved employee-target input and insurance policy controls while adding session metadata display
- added session-missing guard for preview action
- gated `PayrollInsuranceLogsPanel` behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` and kept a fallback workspace shortcut panel

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0633-admin-payroll-insurance-session-context-productization.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
