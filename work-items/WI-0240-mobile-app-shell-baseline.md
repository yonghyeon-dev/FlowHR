# WI-0240: Mobile App Shell Baseline

## Background

Roadmap `Phase 7 / WI-T` starts the native mobile channel.  
After WI-0239 (responsive mobile web baseline), FlowHR now needs an app-shell baseline for iOS/Android
so core journeys can be expanded in dedicated mobile work-items.

## Scope

### In Scope

- `apps/mobile` Expo scaffold baseline
  - `package.json`, `app.json`, `babel.config.js`, `App.js`
- auth/session bootstrap for mobile shell
  - login context input (`baseUrl`, `tenantId`, `actorId`, `accessToken`, role)
  - secure session persistence (`expo-secure-store` + in-memory fallback)
- shared FlowHR API client wrapper
  - bearer token + tenant/actor headers
  - JSON-safe response parsing
- core shell screens
  - `AdminHomeScreen` shell
  - `EmployeeHomeScreen` shell
  - role-based navigator entry (`RootNavigator`)
- docs and regression assets
  - WI document
  - roadmap update
  - WI-0240 e2e test script

### Out of Scope

- production push notifications
- full mobile business flows (attendance/leave/payroll data CRUD)
- app store signing/release pipelines
- backend contract/schema changes

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0240-mobile-app-shell-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
