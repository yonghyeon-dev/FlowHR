# WI-0534: Admin Notices Delivery-Risk Visibility

## Summary
- Goal: surface unread delivery risk directly in `/admin/notices` so admins can immediately identify published notices with zero reads.
- Scope:
  - `src/components/notices/AdminNoticeWorkspaceView.tsx`
  - `src/components/notices/copy.ts`
  - `scripts/tests/e2e-wi0534-admin-notices-delivery-risk-visibility.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `isReadCoverageRisk` rule in admin notices view (`PUBLISHED` + read count `0`).
- Added delivery-risk summary counter in session panel.
- Added per-item risk badge for published notices that still have zero reads.
- Extended notice copy bundle with localized labels for risk summary and risk badge.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0534-admin-notices-delivery-risk-visibility.test.ts`
