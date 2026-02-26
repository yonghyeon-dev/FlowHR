# WI-0536: Admin Benefits Pending-Aging Risk Summary

## Summary
- Goal: expose slow-moving approval queue risk in `/admin/benefits` by highlighting submitted requests waiting over 3 days.
- Scope:
  - `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
  - `src/components/benefits/copy.ts`
  - `scripts/tests/e2e-wi0536-admin-benefits-pending-aging-risk-summary.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `isPendingAgingRisk` rule (`SUBMITTED` + `requestedAt` >= 3 days).
- Added pending-aging summary counter alongside existing over-limit risk summary.
- Added per-request aging-risk badge in approval queue rows.
- Extended benefits admin copy bundle with localized pending-aging labels.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0536-admin-benefits-pending-aging-risk-summary.test.ts`
