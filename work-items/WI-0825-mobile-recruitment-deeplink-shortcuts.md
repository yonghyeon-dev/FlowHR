# WI-0825 Mobile Recruitment Deeplink Shortcuts

## Summary
- Extended employee mobile home shortcuts with recruitment-specific deep links for stalled-risk referrals and submitted referrals.
- Added localized shortcut copy (ko/en) for stalled and submitted recruitment queue actions.
- Wired `RootNavigator` shortcut handlers to open `/employee/recruitment` with `risk=stalled_7d` and `stage=SUBMITTED`.

## Scope
- `apps/mobile/src/screens/EmployeeHomeScreen.js`
- `apps/mobile/src/navigation/RootNavigator.js`
- `scripts/tests/e2e-wi0825-mobile-recruitment-deeplink-shortcuts.test.ts` (new)

## Acceptance
1. Employee mobile home shows two recruitment quick shortcuts: stalled queue and submitted queue.
2. Shortcuts open recruitment web workspace with deep-link query filters.
3. Employee mobile home line budget remains under 300 lines.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0825-mobile-recruitment-deeplink-shortcuts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0815-mobile-benefits-deeplink-shortcuts.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
