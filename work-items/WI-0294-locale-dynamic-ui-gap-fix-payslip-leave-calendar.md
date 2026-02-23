# WI-0294: Locale Dynamic UI Gap Fix for Payslip Receipt and Leave Calendar

## Background

Two high-traffic screens still displayed fixed English labels/messages:

- `/employee/payslip-receipts`
- `/admin/leave-calendar`

This caused mixed-language UX even when browser locale was Korean.

## Scope

- Apply locale-aware copy wiring (`ko`/`en`) in:
  - `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
  - `src/components/leave-calendar/LeaveCalendarConsole.tsx`
- Split screen copy into dedicated files to avoid component bloat:
  - `src/components/payslip-receipts/copy.ts`
  - `src/components/leave-calendar/copy.ts`
- Apply runtime locale mapping (`ko-KR`/`en-US`) for API log timestamps.
- Add regression test:
  - `scripts/tests/e2e-wi0294-locale-dynamic-ui-gap-fix-payslip-leave-calendar.test.ts`

## Out of Scope

- API contract/schema changes
- Payroll/leave business rule changes
- New ops workflows

## Acceptance

1. Browser locale context switches core labels/actions/status text on both routes.
2. API log timestamps on both screens use runtime locale mapping.
3. Regression test verifies locale-copy wiring and route linkage.

## Notes

- Related issue: `#357`
- UI-only WI (no contract version bump required)
