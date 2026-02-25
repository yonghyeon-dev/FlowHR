# WI-0424: Benefits Request Cancel Self-Service

## Summary
- Goal: allow employees to cancel their own pending benefits requests.
- Change:
  - Extended benefits request status model with `CANCELED`.
  - Added cancel schema/store logic and `POST /api/benefits/requests/{requestId}/cancel`.
  - Updated employee benefits workspace with cancel action, canceled filter, and canceled summary count.
- Outcome:
  - Employees can stop outdated requests immediately without waiting for admin decision.

## Scope
- `src/features/benefits/types.ts`
- `src/features/benefits/schemas.ts`
- `src/features/benefits/store.ts`
- `src/app/api/benefits/requests/[requestId]/cancel/route.ts`
- `src/components/benefits/copy.ts`
- `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
- `scripts/tests/e2e-wi0424-benefits-request-cancel-self-service.test.ts`
- `work-items/WI-0424-benefits-request-cancel-self-service.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0408-benefits-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0419-benefits-request-filter-and-name-visibility.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0424-benefits-request-cancel-self-service.test.ts`
