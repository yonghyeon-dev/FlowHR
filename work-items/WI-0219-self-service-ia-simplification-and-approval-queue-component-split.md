# WI-0219: Self-Service IA Simplification and Approval Queue Component Split

## Background

`docs/codex-guide.md` Part 3 requires anti-bloat implementation:

- avoid appending more phase-style sections into large route files
- split oversized page UI into bounded components
- continue roadmap progress on core SaaS journeys

After WI-0218, `src/app/admin/page.tsx` still contained an inlined approval queue panel and dead bulk-selection handlers that increased page complexity. `src/app/employee/page.tsx` also needed clearer information architecture entry points without adding more stacked sections.

## Scope

### In Scope

- Extract approval queue rendering from `src/app/admin/page.tsx` into dedicated components:
  - `src/components/admin-approval/ApprovalQueuePanel.tsx`
  - `src/components/admin-approval/ApprovalQueueSearchSortPanel.tsx`
  - `src/components/admin-approval/approval-queue-types.ts`
  - `src/components/admin-approval/approval-queue-helpers.ts`
- Remove dead/unused approval bulk-selection branch logic from admin page.
- Add employee IA shortcut component:
  - `src/components/employee-self-service/EmployeeJourneyShortcutPanel.tsx`
  - integrated into `src/app/employee/page.tsx`
- Update regression tests and e2e chains for the split.
- Keep existing route behavior and anchor contracts intact.

### Out of Scope

- New API/DB contract changes
- New scheduler/ops flow expansion
- Phase-style feature layering

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0128-admin-approval-queue-ux-upgrade.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0219-self-service-ia-and-approval-queue-split.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0177-admin-dashboard-bloat-section-removal.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0176-employee-self-service-bloat-section-removal.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0126-ops-isolation-and-employee-self-service-upgrade.test.ts`
- `npm.cmd exec tsx scripts/tests/page-composition-guard.test.ts`
- `npm.cmd run build`

