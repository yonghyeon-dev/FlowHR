# WI-0632 Admin Leave Calendar/Accrual Session-Context Productization

## Summary
- removed manual context inputs (`organizationId`, `adminActorId`, `accessToken`) from `/admin/leave-calendar` and `/admin/leave-accrual`
- switched both consoles to Supabase-session context (`organizationId`, `actorId`, production bearer token)
- added read-only session metadata display and session-missing guard message
- gated API request logs behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`
- kept workspace navigation available even when devtools logs are hidden
- normalized leave-accrual copy to locale-aware ko/en runtime text

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0632-admin-leave-calendar-accrual-session-context-productization.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
