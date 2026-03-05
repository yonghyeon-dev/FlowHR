# WI-0976: admin/page.tsx size cap compliance

## Background and Problem

`src/app/admin/page.tsx` exceeded the 500-line policy limit (579 lines before this WI).
Approval quick-action state and command logic were embedded in the page, increasing file size and reducing maintainability.

## Scope

### In Scope

- Extract approval quick-action logic from `src/app/admin/page.tsx` to `src/app/admin/page-approval-actions.ts`.
- Keep runtime behavior unchanged for dashboard quick approval actions.
- Reduce `src/app/admin/page.tsx` to 500 lines or less.
- Add static regression coverage for the size cap and hook extraction wiring.

### Out of Scope

- Dashboard feature redesign.
- API/schema/migration changes.

## Test Plan

- `node --experimental-strip-types scripts/tests/e2e-wi0976-admin-page-size-reduce.test.ts`
- `npm run typecheck`

## ADR

- Not required: this is a bounded maintainability refactor with no cross-domain architecture change.