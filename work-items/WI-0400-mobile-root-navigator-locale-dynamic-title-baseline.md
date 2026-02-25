# WI-0400: Mobile RootNavigator Locale-Dynamic Title Baseline

## Summary
- Added `apps/mobile/src/lib/mobileLocale.js` to resolve runtime locale (`ko`/`en`) from device Intl context.
- Wired `apps/mobile/src/navigation/RootNavigator.js` to apply locale-aware copy for splash text and stack screen titles.
- Kept scope intentionally narrow at navigator level so mobile locale rollout can progress without blocking on full screen-copy migration.

## Scope
- `apps/mobile/src/lib/mobileLocale.js`
- `apps/mobile/src/navigation/RootNavigator.js`
- `scripts/tests/e2e-wi0400-mobile-root-navigator-locale-dynamic-title-baseline.test.ts`
- `ROADMAP.md`
- `package.json`

## Validation
- `npm.cmd run -s typecheck`
- `npm.cmd exec tsx scripts/tests/e2e-wi0400-mobile-root-navigator-locale-dynamic-title-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
