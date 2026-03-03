# WI-0867 Admin People Deeplink Focus Hydration

## Summary
- Added deep-link hydration in `/admin/people` so query context can restore filter/focus state on first load.
- Added source/focused-section context messaging and jump action in admin people header.
- Added section-level focus highlighting so onboarding/dashboard deep links land on the intended workspace block.

## Scope
- `src/app/admin/people/page.tsx`
- `src/app/admin/people/page-deeplink-helpers.ts` (new)
- `src/app/admin/people/page-view.tsx`
- `src/app/globals.css`
- `scripts/tests/e2e-wi0867-admin-people-deeplink-focus-hydration.test.ts` (new)

## Acceptance
1. `/admin/people` hydrates `source` and `panel` query params and maps panel aliases (`invites`, `filters`, `compare`, `history`, `org`) to valid section targets.
2. `/admin/people` hydrates `q`, `active`, `departmentId`, `positionId`, `updatedDays`, `historyLimit`, `employeeId` query params on initial render.
3. Focused section auto-scrolls once on initial render when `panel` query is provided.
4. Header shows source-context banner and focused-section label when query context exists.
5. Header provides "Jump to focused section" action for focused deep-link sessions.
6. Focused section receives visible highlight styling.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0867-admin-people-deeplink-focus-hydration.test.ts`
- `npm.cmd run build`
