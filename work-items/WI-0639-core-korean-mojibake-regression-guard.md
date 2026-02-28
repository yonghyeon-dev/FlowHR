# WI-0639 Core Korean Mojibake Regression Guard

## Summary
- added mojibake regression guard for core Korean surfaces:
  - `/admin` dashboard page
  - employee guide copy
  - employee guide sections
- blocks known corrupted tokens observed in previous sessions
- keeps guard scope focused on customer-facing core pages (not `/ops/*`)

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0639-core-korean-mojibake-regression-guard.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
