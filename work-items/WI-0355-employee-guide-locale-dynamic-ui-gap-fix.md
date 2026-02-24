# WI-0355: Employee guide locale dynamic UI gap fix

## Summary
- Removed residual hardcoded English status text from `/employee/guide`.
- Added locale-aware hero eyebrow, log status copy, and request-label copy.
- Rewired guide data loading logs to use locale copy payload instead of fixed English labels.

## Scope
- `src/components/employee-guide/copy.ts`
- `src/components/employee-guide/EmployeeGuideDashboard.tsx`
- `src/components/employee-guide/EmployeeGuideSections.tsx`
- `src/components/employee-guide/useEmployeeGuideData.ts`
- `scripts/tests/e2e-wi0355-employee-guide-locale-dynamic-ui-gap-fix.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0355-employee-guide-locale-dynamic-ui-gap-fix.test.ts`
