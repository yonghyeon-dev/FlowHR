# WI-0243: Mobile Notification Center Realtime Update Baseline

## Background

Phase 7 `WI-W` extends the mobile notification center from WI-0241.
The shell already supports permission and preference updates, but realtime-style feed refresh and filtering
are required to make in-app notifications operational.

## Scope

### In Scope

- notification feed realtime helper baseline
  - `apps/mobile/src/lib/notificationFeed.js`
  - newest-first sort, category filter, unread stats, sync clock formatter, mock live event appender
- notification center realtime UX
  - periodic polling refresh baseline (`30s`)
  - manual refresh action
  - live sync toggle
  - category chips and unread counters
  - live event simulation action for QA/demo
- shell copy updates (`WI-0244` placeholder for next work)
- docs and regression
  - WI doc
  - roadmap update
  - WI-0243 e2e script

### Out of Scope

- websocket/sse backend stream endpoint
- new notification contracts or schema changes
- external delivery reliability analytics

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0243-mobile-notification-center-realtime-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0242-mobile-email-template-engine-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
