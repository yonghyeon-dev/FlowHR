# WI-0374: Admin runtime locale and API helper extraction

## Summary
- Extracted admin dashboard API request parsing/header logic into `src/app/admin/page-api-helpers.ts`.
- Updated admin dashboard runtime timestamps to follow locale (`ko-KR` / `en-US`) instead of fixed `ko-KR`.
- Updated `formatDateTime` helper signature to accept `runtimeLocale` and rewired admin panel props to use locale-aware formatter.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-helpers.ts`
- `src/app/admin/page-api-helpers.ts`
- `scripts/tests/e2e-wi0374-admin-runtime-locale-and-api-helper-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0374-admin-runtime-locale-and-api-helper-extraction.test.ts`
- `npm.cmd run -s typecheck`
