# WI-0406: Global i18n Residual Token Cleanup

## Summary
- Goal: remove remaining English-first runtime copy from newly opened domain routes and mobile notification surfaces.
- Change:
  - Normalized Korean baseline copy in `/admin/notices`, `/admin/benefits`, `/admin/recruitment`, `/employee/benefits`, `/employee/recruitment`.
  - Converted mobile notification feed/history payload labels to locale-aware maps (`ko`/`en`) and locale-dependent seed inbox loading.
  - Updated mobile notification center/history screens to resolve device locale and render locale-specific UI copy.
  - Updated mobile analytics preset card to locale-aware status/error/action copy for Korean runtime.
  - Hardened notification permission/default title helpers with locale fallback.
- Outcome:
  - Korean runtime no longer exposes English-only defaults in mobile notification/history/preset flows.
  - Newly opened notices/benefits/recruitment baseline routes do not carry residual English wording in Korean copy lines.

## Scope
- `src/app/admin/notices/page.tsx`
- `src/app/admin/benefits/page.tsx`
- `src/app/admin/recruitment/page.tsx`
- `src/app/employee/benefits/page.tsx`
- `src/app/employee/recruitment/page.tsx`
- `apps/mobile/src/lib/notificationFeed.js`
- `apps/mobile/src/lib/notificationHistory.js`
- `apps/mobile/src/lib/notificationStore.js`
- `apps/mobile/src/lib/notifications.js`
- `apps/mobile/src/screens/NotificationCenterScreen.js`
- `apps/mobile/src/screens/NotificationHistoryScreen.js`
- `apps/mobile/src/components/MobileAnalyticsFilterPresetCard.js`
- `scripts/tests/e2e-wi0406-global-i18n-residual-token-cleanup.test.ts`
- `work-items/WI-0406-global-i18n-residual-token-cleanup.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0406-global-i18n-residual-token-cleanup.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0400-mobile-root-navigator-locale-dynamic-title-baseline.test.ts`
- `npm.cmd run -s build`
