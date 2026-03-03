# WI-0846 Admin Analytics Contract Renewal Quick-Action Link

## Summary
- Added dedicated renewal-candidate quick action in admin analytics contract panel.
- Renewal-priority path now opens `/admin/contracts?renewalCandidateOnly=true` with source context.
- Added localized ko/en copy key for renewal-candidate queue action label.

## Scope
- `src/components/admin-kpi/AdminContractKpiPanel.tsx`
- `src/components/admin-kpi/copy.ts`
- `scripts/tests/e2e-wi0846-admin-analytics-contract-renewal-quick-action-link.test.ts` (new)

## Acceptance
1. Contract panel quick actions include renewal-candidate queue link.
2. Renewal-priority action uses renewal-candidate queue label and route.
3. ko/en copy includes localized renewal-candidate queue action label.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0846-admin-analytics-contract-renewal-quick-action-link.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0841-admin-analytics-contract-kpi-source-context-links.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
