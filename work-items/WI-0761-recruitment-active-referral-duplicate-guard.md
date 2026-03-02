# WI-0761 Recruitment Active Referral Duplicate Guard

## Summary
- added active duplicate guard on referral submission:
  - `POST /api/recruitment/referrals` now blocks duplicate active referrals for the same opening and candidate email.
  - response: `409 recruitment.referral.create.duplicate_active` with existing referral id/stage.
- normalized duplicate detection by candidate email (trim + lowercase).
- updated employee recruitment submit flow:
  - when duplicate-active conflict occurs, show immediate user-facing guidance and refresh workspace state.

## Scope
- recruitment core journey enhancement only
- no scheduler/ops/devtools expansion
- no phase-style UI layering

## Data Changes
- none (reuse WI-0757 recruitment persistence models/tables)

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0761-recruitment-active-referral-duplicate-guard.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
