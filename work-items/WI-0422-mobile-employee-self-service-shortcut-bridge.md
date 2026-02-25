# WI-0422: Mobile Employee Self-Service Shortcut Bridge

## Summary
- Goal: bridge mobile employee home to newly active web self-service surfaces.
- Change:
  - Added mobile web URL resolver in root navigator (`EXPO_PUBLIC_FLOWHR_WEB_URL` fallback `http://localhost:3000`).
  - Wired employee-home callbacks to open web routes:
    - `/employee/notices`
    - `/employee/benefits`
    - `/employee/recruitment`
  - Reworked `EmployeeHomeScreen` locale copy and added extension shortcut card.
- Outcome:
  - Mobile users can jump into notice/benefits/recruitment journeys immediately without waiting for full native screens.

## Scope
- `apps/mobile/src/navigation/RootNavigator.js`
- `apps/mobile/src/screens/EmployeeHomeScreen.js`
- `scripts/tests/e2e-wi0422-mobile-employee-self-service-shortcut-bridge.test.ts`
- `work-items/WI-0422-mobile-employee-self-service-shortcut-bridge.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0400-mobile-root-navigator-locale-dynamic-title-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0422-mobile-employee-self-service-shortcut-bridge.test.ts`

