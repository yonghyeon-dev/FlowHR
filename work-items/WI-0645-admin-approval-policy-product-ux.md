# WI-0645 Admin Approval Policy Product UX

## Summary
- refined `/admin/approval-policy` into a product-facing workspace pattern
- updated top context panel title to `Work conditions`
- moved delegation expiry dry-run controls into collapsible `Advanced options`
- gated request logs behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`
- for non-devtools runtime, replaced logs surface with related-workspace shortcuts:
  - `/admin/approval-executions`
  - `/admin/approval-history`
  - `/admin`
- normalized visible separator rendering in delegation rows and log rows to `/`

## Scope
- admin approval-policy UX refinement only
- no API/schema/contract changes
- no scheduler/ops automation expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0329-admin-approval-policy-locale-dynamic-ui-gap-fix-phase6.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0626-admin-approval-pages-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0645-admin-approval-policy-product-ux.test.ts`
