# WI-0815 Mobile Benefits Deeplink Shortcuts

## Summary
- Added employee mobile home shortcut actions for benefits queue triage.
- New deep-link shortcuts open web benefits workspace with prefilled filters:
  - Pending + aging risk: `/employee/benefits?status=SUBMITTED&risk=pending_3d`
  - Approved history: `/employee/benefits?status=APPROVED`
- Kept existing generic benefits shortcut unchanged for baseline compatibility.

## Scope
- `apps/mobile/src/screens/EmployeeHomeScreen.js`
- `apps/mobile/src/navigation/RootNavigator.js`
- `scripts/tests/e2e-wi0815-mobile-benefits-deeplink-shortcuts.test.ts` (new)

## Acceptance
1. Employee mobile home exposes dedicated benefits triage shortcut actions.
2. Pending and approved shortcut buttons open filtered web benefits routes.
3. Existing shortcut bridge behavior and line-budget guards remain valid.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0422-mobile-employee-self-service-shortcut-bridge.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0240-mobile-app-shell-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0815-mobile-benefits-deeplink-shortcuts.test.ts`
