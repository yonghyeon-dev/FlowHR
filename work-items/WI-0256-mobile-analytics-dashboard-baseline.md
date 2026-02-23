# WI-0256: Mobile Analytics Dashboard Baseline

## Background

FlowHR mobile currently provides approval/request/notification operational screens, but lacks a
single KPI surface that summarizes cross-domain status and trend for quick decision making.

## Scope

### In Scope

- mobile analytics domain helper baseline
  - `apps/mobile/src/lib/mobileAnalytics.js`
  - period options (`7d`/`14d`/`30d`)
  - KPI snapshot builder (approval/request/notification)
  - daily trend series builder
  - snapshot export payload serializer
- analytics dashboard screen baseline
  - `apps/mobile/src/screens/MobileAnalyticsDashboardScreen.js`
  - period filter chips
  - KPI snapshot + domain breakdown panels
  - daily trend rows
  - export payload generate/clear UI
  - role-aware quick links
- navigation and home entry wiring
  - `apps/mobile/src/navigation/RootNavigator.js`
  - `apps/mobile/src/screens/AdminHomeScreen.js`
  - `apps/mobile/src/screens/EmployeeHomeScreen.js`
  - new route `MobileAnalyticsDashboard` + home CTA
- shell placeholder bump (`WI-0257~`)
  - admin/employee home coming-soon copy
- docs and regression
  - WI doc
  - roadmap update
  - WI-0256 e2e script

### Out of Scope

- backend analytics API / warehouse integration
- CSV/XLSX file export upload pipeline
- role/tenant policy based analytics authorization expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0256-mobile-analytics-dashboard-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0255-mobile-employee-request-follow-up-preset-import-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0254-mobile-employee-request-follow-up-action-bundle-saved-preset-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0253-mobile-employee-request-follow-up-template-recommendation-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0252-mobile-employee-request-notification-follow-up-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0251-mobile-employee-request-history-status-tracking-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0250-mobile-employee-self-service-request-submit-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0249-mobile-admin-approval-queue-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0248-mobile-notification-history-preset-import-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0247-mobile-notification-history-preset-pin-recent-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0246-mobile-notification-history-quick-preset-filters-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0245-mobile-notification-history-bulk-actions-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0244-mobile-notification-history-search-archive-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0243-mobile-notification-center-realtime-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0242-mobile-email-template-engine-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0241-mobile-push-notification-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0240-mobile-app-shell-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
