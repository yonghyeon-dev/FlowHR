# WI-0848 Admin Dashboard Contract Queue Subcount Annotation

## Summary
- Added queue subcount annotation rows to admin dashboard queue badges.
- Contract queue now exposes decision/pending-response/SLA-overdue breakdown directly in badge card.
- Approval and payroll queue cards also show core subcount breakdown for fast triage.

## Scope
- `src/app/admin/page.tsx`
- `scripts/tests/e2e-wi0848-admin-dashboard-contract-queue-subcount-annotation.test.ts` (new)

## Acceptance
1. Admin queue badge cards render per-queue breakdown annotation.
2. Contract queue card shows decision + pending response + SLA overdue composition.
3. Existing total/critical/watch calculations remain intact.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0848-admin-dashboard-contract-queue-subcount-annotation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0847-admin-dashboard-contract-pending-response-queue-badge-balance.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
