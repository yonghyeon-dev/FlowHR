# WI-0346: Admin payroll customer-value copy

## Summary
- Added customer-value narrative cards to payroll panel (accuracy/transparency/explainability).
- Kept copy locale-aware (`ko`/`en`) and aligned with core user-facing payroll journey.
- Improved admin payroll UX context without introducing ops-only controls.

## Scope
- `src/components/admin-dashboard/AdminPayrollPanel.tsx`
- `scripts/tests/e2e-wi0346-admin-payroll-customer-value-copy.test.ts` (new)
- `ROADMAP.md`

## Notes
- UI-copy enhancement only.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0346-admin-payroll-customer-value-copy.test.ts`
- `npm.cmd run -s typecheck`
