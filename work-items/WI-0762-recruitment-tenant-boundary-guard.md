# WI-0762 Recruitment Tenant Boundary Guard

## Summary
- enforced organization scope guard across recruitment routes:
  - `GET /api/recruitment/openings`
  - `POST /api/recruitment/openings`
  - `GET /api/recruitment/referrals`
  - `POST /api/recruitment/referrals`
- added mismatch handling when request organization differs from actor organization:
  - opening/referral list/create routes now return `403` with `organization_scope_mismatch` reason.
- hardened referral stage/withdraw mutation routes with tenant boundary check:
  - stage/withdraw now return `404 recruitment.referral.not_found` for cross-tenant access.

## Scope
- recruitment core journey trust/safety enhancement only
- no scheduler/ops/devtools expansion
- no phase-style UI layering

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0762-recruitment-tenant-boundary-guard.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
