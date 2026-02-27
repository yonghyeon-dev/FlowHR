# WI-0566: Employee Self-Service Interaction Setter Bundle Extraction

## Summary
- Goal: simplify `employee/page.tsx` orchestration by extracting interaction setter bundle composition.
- Scope:
  - `src/app/employee/page-interaction-setter-bundles.ts`
  - `src/app/employee/page.tsx`
  - `scripts/tests/e2e-wi0566-employee-self-service-interaction-setter-bundle-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildEmployeeInteractionSetterBundles` helper for attendance/leave/request/period setter bundles.
- Rewired employee page to use extracted helper and removed inline bundle object creation.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0566-employee-self-service-interaction-setter-bundle-extraction.test.ts`
