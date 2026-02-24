# WI-0350: Admin approval queue mobile UX enhancement

## Summary
- Refactored admin approval queue panel/search-sort panel to locale-driven copy (`ko`/`en`).
- Added mobile sticky quick-action block for urgent/pending-first/refresh/reset.
- Kept existing queue triage behavior while improving mobile-first action flow.

## Scope
- `src/components/admin-approval/ApprovalQueuePanel.tsx`
- `src/components/admin-approval/ApprovalQueueSearchSortPanel.tsx`
- `scripts/tests/e2e-wi0350-admin-approval-queue-mobile-ux-enhancement.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0350-admin-approval-queue-mobile-ux-enhancement.test.ts`
