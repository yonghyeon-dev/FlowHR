# WI-0330: Admin Approval Templates Locale Dynamic UI Gap Fix Phase 7

## Background

`/admin/approval-templates` still exposed mixed-language literals and fixed
`ko-KR` datetime/amount formatting in several surfaces, causing locale
inconsistency when browser language was not Korean.

## Scope

- Add locale helper bundle for approval templates page:
  - `src/app/admin/approval-templates/page-locale-helpers.ts`
- Split page-local sections/types to keep page size budget:
  - `src/app/admin/approval-templates/page-types.ts`
  - `src/app/admin/approval-templates/page-sections.tsx`
- Rewire `src/app/admin/approval-templates/page.tsx` to:
  - consume `useI18n` locale (`ko`/`en`)
  - resolve hero/context/create/preview/list/log copy from locale helper
  - apply runtime-locale datetime/number formatting for template/delegation
    timestamps and payroll gross values
- Add WI-0330 regression coverage.

## Out of Scope

- Approval templates API contract changes
- Policy/delegation workflow behavior changes
- New page section additions

## Acceptance

1. Approval templates page renders locale-aware copy (`ko`/`en`) from helper.
2. Fixed-language labels are removed from the touched page surface.
3. Date/time and KRW values follow runtime locale (`ko-KR`/`en-US`).
4. WI-0330 regression and build checks pass.

## Notes

- Related issue: `#429`
- UI copy/localization hardening only (no domain behavior change)
