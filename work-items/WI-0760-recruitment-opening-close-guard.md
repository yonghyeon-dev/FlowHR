# WI-0760 Recruitment Opening Close Guard

## Summary
- added close guard to opening status lifecycle:
  - `POST /api/recruitment/openings/{openingId}/status` now blocks `CLOSED` transition when active referrals exist.
  - response: `409 recruitment.opening.status.pending_referrals` with active referral count.
- added explicit override path for authorized users:
  - same endpoint accepts optional `force: true` to close opening after confirmation.
- wired admin recruitment workspace to handle guarded close:
  - on pending-referrals conflict, prompts confirmation and retries with `force: true`.

## Scope
- recruitment core journey enhancement only
- no scheduler/ops/devtools expansion
- no phase-style UI layering

## Data Changes
- none (reuse WI-0757 recruitment persistence models/tables)

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0760-recruitment-opening-close-guard.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
