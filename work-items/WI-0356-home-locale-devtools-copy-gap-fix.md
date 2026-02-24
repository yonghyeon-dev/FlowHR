# WI-0356: Home locale devtools copy gap fix

## Summary
- Localized remaining fixed labels on `/` home surface for employee quick links and devtools link names.
- Added new i18n message keys and replaced literal text in `src/app/page.tsx` with translator lookups.

## Scope
- `src/lib/i18n/messages.ts`
- `src/app/page.tsx`
- `scripts/tests/e2e-wi0356-home-locale-devtools-copy-gap-fix.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0356-home-locale-devtools-copy-gap-fix.test.ts`
