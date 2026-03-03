# WI-0851 Admin Contracts Dashboard Source Banner

## Summary
- Added dedicated source-entry banner for `/admin/contracts` when opened from `/admin` dashboard quick links.
- Banner now shows dashboard queue context (decision queue, pending response, or SLA overdue) based on applied filters.
- Extended contracts locale copy keys for dashboard source messaging and pending-response queue label.

## Scope
- `src/components/contracts/AdminContractsWorkspace.tsx`
- `src/components/contracts/copy.ts`
- `scripts/tests/e2e-wi0851-admin-contracts-dashboard-source-banner.test.ts` (new)

## Acceptance
1. `/admin/contracts?source=admin-dashboard` shows dashboard source banner.
2. Banner focus label resolves to decision queue, pending response, or SLA overdue by active filter.
3. Existing analytics-source banner behavior remains unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0851-admin-contracts-dashboard-source-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0850-admin-dashboard-contract-queue-breakdown-quick-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0842-admin-contracts-analytics-source-banner.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
