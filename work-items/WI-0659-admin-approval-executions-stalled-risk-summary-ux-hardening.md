# WI-0659 Admin Approval Executions Stalled-Risk Summary UX Hardening

## Summary
- improved `/admin/approval-executions` summary UX with stalled-risk tiers:
  - watch queue count (`>= max(stalled threshold, 24h)`)
  - critical queue count (`>= max(stalled threshold, 72h)`)
  - max stalled-hours metric
- extended `ApprovalExecutionSummary` shape with risk counters/threshold metadata.
- repaired corrupted Korean runtime copy in:
  - `src/app/admin/approval-executions/page.tsx`
  - `src/app/admin/approval-executions/page-helpers.ts`
- preserved existing productization/session-context behavior and devtools log gate.
- added WI-0659 regression guard for risk summary fields + KO copy integrity.

## Scope
- admin approval executions UX and copy hardening only
- no API/schema/contract changes
- no scheduler/ops automation additions

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0659-admin-approval-executions-stalled-risk-summary-ux-hardening.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0643-admin-approval-executions-product-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0649-admin-approval-executions-line-budget-decomposition.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0651-admin-approval-executions-section-file-split.test.ts`
- `npm.cmd run typecheck`
