# WI-0858 Admin Workspace Hub Contract Source Context

## Summary
- Added dashboard source-context propagation for contract links rendered from `/admin` workspace hub cards.
- Kept static hub definitions unchanged and applied source query at render-time to avoid legacy WI regression churn.
- Contract workspace can now consistently show dashboard entry banner when opened from hub links.

## Scope
- `src/app/admin/page.tsx`
- `scripts/tests/e2e-wi0858-admin-workspace-hub-contract-source-context.test.ts` (new)

## Acceptance
1. Contract links in `/admin` workspace hub append `source=admin-dashboard` unless already present.
2. Non-contract workspace hub links remain unchanged.
3. `/admin/contracts` retains dashboard source banner behavior for these entries.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0858-admin-workspace-hub-contract-source-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0851-admin-contracts-dashboard-source-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0845-admin-dashboard-contract-renewal-candidate-link.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
