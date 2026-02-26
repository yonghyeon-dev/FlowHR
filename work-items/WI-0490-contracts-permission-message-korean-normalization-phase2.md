# WI-0490: Contracts Permission Message Korean Normalization (Phase 2)

## Summary
- Goal: close remaining Korean runtime guidance gaps in e-contract flows by mapping permission/ownership-denied server errors to specific Korean messages.
- Scope:
  - `src/components/contracts/http.ts`
  - `scripts/tests/e2e-wi0490-contracts-permission-message-korean-normalization-phase2.test.ts`
  - `ROADMAP.md`

## Delivery
- Added high-priority Korean error mappings for contract permission/ownership cases:
  - `contract admin permission required`
  - `employee can only read own contract documents`
  - `employee can only respond to own document`
  - `contract response permission denied`
  - `contract signature evidence permission denied`
- Kept generic permission fallback mapping for unmatched permission messages.
- Added WI-0490 regression test to lock ko/en runtime behavior and pattern presence.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0490-contracts-permission-message-korean-normalization-phase2.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0489-contracts-http-fallback-runtime-alignment.test.ts`
- [x] `npm.cmd run typecheck`
