# WI-0342: Locale residual gap fix (admin payroll panel)

## Summary
- Localized remaining hardcoded payroll panel field/action labels for `ko`/`en`.
- Kept existing `useI18n` runtime behavior and added structured `fieldCopy`.
- Removed mixed-language gaps in payroll preview inputs and run-confirm actions.

## Scope
- `src/components/admin-dashboard/AdminPayrollPanel.tsx`
- `scripts/tests/e2e-wi0342-locale-residual-gap-fix-payroll-panel.test.ts` (new)
- `ROADMAP.md`

## Notes
- UI-copy hardening only; no API/schema/scheduler expansion.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0342-locale-residual-gap-fix-payroll-panel.test.ts`
- `npm.cmd run -s typecheck`
