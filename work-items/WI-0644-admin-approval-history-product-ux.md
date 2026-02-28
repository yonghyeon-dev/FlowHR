# WI-0644 Admin Approval History Product UX

## Summary
- refined `/admin/approval-history` as a product-facing workspace instead of a dev-first console
- updated filter panel heading to `Work conditions`
- kept core filters visible (`domain`, `allowed`) and moved advanced controls into collapsible `Advanced options`:
  - target entity type/id
  - resolution
  - limit
- gated request logs behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`
- when devtools are disabled, render only product-facing related workspace navigation instead of log telemetry

## Scope
- admin approvals UX refinement only
- no API/schema/contract changes
- no scheduler or ops automation expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0328-admin-approval-history-locale-dynamic-ui-gap-fix-phase5.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0644-admin-approval-history-product-ux.test.ts`
