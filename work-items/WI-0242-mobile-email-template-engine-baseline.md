# WI-0242: Mobile Email Template Engine Baseline

## Background

Phase 7 `WI-V` follows mobile shell and push baseline with transactional email consistency.
Admin users need to verify template content by locale and variable interpolation directly in mobile shell.

## Scope

### In Scope

- email template catalog and renderer module
  - `apps/mobile/src/lib/emailTemplates.js`
  - template metadata, ko/en subject/body, placeholder interpolation
- email template preference/history store
  - `apps/mobile/src/lib/emailTemplateStore.js`
  - selected template, locale, variable draft, preview history persistence
- admin mobile email template screen
  - `apps/mobile/src/screens/EmailTemplateScreen.js`
  - template selector, locale toggle, variable editor, preview panel, history panel
- shell routing integration
  - admin home entry point
  - root navigator route (`EmailTemplates`)
- docs and regression
  - WI doc
  - roadmap update
  - WI-0242 e2e test script

### Out of Scope

- backend email sending orchestration
- API/DB contract changes
- provider-specific deliverability analytics

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0242-mobile-email-template-engine-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0241-mobile-push-notification-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
