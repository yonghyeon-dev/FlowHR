# WI-0646 Admin Approval Templates Product UX

## Summary
- refined `/admin/approval-templates` to product-facing admin UX pattern
- updated context panel title to `Work conditions`
- moved payroll range template controls into collapsible `Advanced options` (shown for payroll domain only)
- gated logs panel behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`
- for non-devtools runtime, replaced telemetry logs panel with related-workspace navigation:
  - `/admin/approval-executions`
  - `/admin/approval-policy`
  - `/admin`
- normalized logs/preview separator rendering in `page-sections.tsx` to `/`

## Scope
- admin approval-template UX refinement only
- no API/schema/contract changes
- no scheduler/ops automation expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0330-admin-approval-templates-locale-dynamic-ui-gap-fix-phase7.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0626-admin-approval-pages-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0646-admin-approval-templates-product-ux.test.ts`
