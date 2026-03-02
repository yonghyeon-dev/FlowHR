# WI-0759 Recruitment Referral Opening Status Policy

## Summary
- blocked referral submission to closed openings:
  - `POST /api/recruitment/referrals` now returns `409 recruitment.referral.create.opening_closed` when opening status is not `OPEN`.
- tightened referral stage lifecycle policy for admin/manager updates:
  - `POST /api/recruitment/referrals/{referralId}/stage` now validates allowed transitions and returns `409 recruitment.referral.stage.invalid_transition` for invalid jumps.
- aligned admin recruitment stage selector with policy:
  - stage dropdown now shows only current + allowed next stages.

## Scope
- recruitment core journey enhancement only
- no scheduler/ops/devtools expansion
- no phase-style UI layering

## Data Changes
- none (reuse WI-0757 recruitment persistence models/tables)

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0759-recruitment-referral-opening-status-policy.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
