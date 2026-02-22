# WI-0200: Browser Locale Dynamic UI Language Baseline

## Background and Problem

FlowHR currently mixes Korean and English labels across root/home/login/admin/employee surfaces.
This causes inconsistent UX when users expect language to follow browser settings.

## Scope

### In Scope

- Add common i18n baseline for `ko` and `en`.
- Resolve request locale from browser language header (`Accept-Language`) on server render.
- Apply dynamic `<html lang>` at root layout.
- Provide client i18n context so client components can render locale-aware labels.
- Localize shared surfaces:
  - `src/app/page.tsx`
  - `src/app/admin/layout.tsx`
  - `src/app/employee/layout.tsx`
  - `src/app/login/page.tsx`
  - `src/components/SessionMenu.tsx`
- Add WI-0200 regression test:
  - `scripts/tests/e2e-wi0200-browser-locale-dynamic-ui-language-baseline.test.ts`
- Wire WI-0200 test into MVP/FULL e2e chains.

### Out of Scope

- Full-string localization for all deep domain pages/components.
- Locale-prefixed routing (`/ko`, `/en`) and manual language selector UI.
- Translation management pipeline (external service/CMS).

## Data and API Changes

- No DB migration.
- No API contract change.

## Rollback Plan

- Revert i18n baseline files and localized shared surface updates.
- Remove WI-0200 test and e2e chain wiring.
- Restore previous static language rendering.

## Definition of Done (DoD)

- [x] Browser `Accept-Language` resolves app locale (`ko`/`en`) with deterministic fallback.
- [x] Root `<html lang>` is dynamically set by resolved locale.
- [x] Shared root/home/login/admin/employee/session labels render via i18n dictionary.
- [x] WI-0200 e2e exists and is wired into MVP/FULL suites.
