# WI-0758 Recruitment Opening Status Lifecycle

## Summary
- added opening status lifecycle API for admin/manager:
  - `POST /api/recruitment/openings/{openingId}/status`
- extended recruitment store with `updateRecruitmentOpeningStatus` to support OPEN/CLOSED transitions.
- wired `/admin/recruitment` opening list with per-opening status action (OPEN↔CLOSED) so hiring managers can close/reopen openings in-product.
- preserved existing employee journey behavior (`/employee/recruitment` already reads `status=OPEN` openings only).

## Scope
- recruitment core journey enhancement only
- no scheduler/ops/devtools expansion
- no phase-style UI layering

## Data Changes
- none (reuse WI-0757 recruitment persistence models/tables)

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0758-recruitment-opening-status-lifecycle.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
