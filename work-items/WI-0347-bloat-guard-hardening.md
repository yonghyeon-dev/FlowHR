# WI-0347: Bloat guard hardening

## Summary
- Added regression guard for contracts component size budget (`<= 300` lines).
- Added core-surface forbidden-pattern guard against phase N+1 preset stacking keywords.
- Kept guard scope focused on core `admin`/`employee` surfaces and contracts modules.

## Scope
- `scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts` (new)
- `ROADMAP.md`

## Notes
- Test/guard hardening only; no runtime behavior changes.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- `npm.cmd exec tsx scripts/tests/page-composition-guard.test.ts`
