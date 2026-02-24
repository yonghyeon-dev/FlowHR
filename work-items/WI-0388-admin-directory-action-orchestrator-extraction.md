# WI-0388: Admin directory action orchestrator extraction

## Summary
- Extracted admin dashboard directory-domain orchestration logic out of `src/app/admin/page.tsx` into `src/app/admin/page-directory-actions.ts`.
- Moved people/org/schedule action handlers into a dedicated builder:
  - employee list/create
  - invite create
  - schedule list/create/delete
  - organization list/create
- Kept existing low-level API helpers untouched (`page-action-helpers.ts`) and delegated page wiring through `directoryActions`.
- Reduced `src/app/admin/page.tsx` size from 995 lines to 900 lines.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-directory-actions.ts`
- `scripts/tests/e2e-wi0388-admin-directory-action-orchestrator-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0388-admin-directory-action-orchestrator-extraction.test.ts`
- `npm.cmd run -s typecheck`
