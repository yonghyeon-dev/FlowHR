# WI-0709 Admin Approval Session Context Devtools Gate

## Summary
- hid approval session identifiers (`organizationId`, `adminActorId`) in product mode
  for:
  - `src/app/admin/approval-policy/page.tsx`
  - `src/app/admin/approval-history/page.tsx`
  - `src/app/admin/approval-templates/page.tsx`
- session context is now rendered only when `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` is enabled.
- no API/schema/contract behavior changed.

## Scope
- admin approval UI productization only
- no backend contract change
- no ops workflow expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0709-admin-approval-session-context-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0644-admin-approval-history-product-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0645-admin-approval-policy-product-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0646-admin-approval-templates-product-ux.test.ts`
- `npm.cmd run typecheck`
