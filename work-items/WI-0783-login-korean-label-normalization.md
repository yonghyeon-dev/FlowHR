# WI-0783 Login Korean Label Normalization

## Summary
- normalized remaining English labels in Korean runtime for `/login`.
- updated Korean `messages.ts` keys:
  - `login.userId`
  - `login.email`
  - `login.role`
  - `login.organization`
  - `login.actorIdOptional`
  - `login.password`
- kept English locale keys unchanged.

## Scope
- core product i18n quality enhancement only
- no scheduler/ops expansion
- no phase-style layering

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0783-login-korean-label-normalization.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
