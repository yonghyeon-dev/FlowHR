# WI-0426: Mobile Employee Shortcut Bridge (Schedule/Contracts/Payslips)

## Summary
- Goal: expand mobile employee-home shortcut bridge to additional core self-service pages.
- Change:
  - Extended mobile employee-home callbacks and copy for schedule/contracts/payslips.
  - Wired root navigator deep links to:
    - `/employee/schedule`
    - `/employee/contracts`
    - `/employee/payslips`
- Outcome:
  - Mobile users can jump directly to key web self-service screens from one home surface.

## Scope
- `apps/mobile/src/navigation/RootNavigator.js`
- `apps/mobile/src/screens/EmployeeHomeScreen.js`
- `scripts/tests/e2e-wi0426-mobile-employee-shortcut-bridge-schedule-contracts-payslips.test.ts`
- `work-items/WI-0426-mobile-employee-shortcut-bridge-schedule-contracts-payslips.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0400-mobile-root-navigator-locale-dynamic-title-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0422-mobile-employee-self-service-shortcut-bridge.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0426-mobile-employee-shortcut-bridge-schedule-contracts-payslips.test.ts`
