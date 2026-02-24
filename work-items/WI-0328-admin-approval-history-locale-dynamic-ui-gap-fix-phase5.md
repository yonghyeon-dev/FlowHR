# WI-0328: Admin Approval History Locale Dynamic UI Gap Fix Phase 5

## Background

`/admin/approval-history` still had mixed hardcoded labels and static Korean
runtime formatting, so browser locale (`ko`/`en`) did not fully control the
surface copy.

## Scope

- Add locale-aware copy bundle for approval-history page:
  - `src/app/admin/approval-history/page-locale-helpers.ts`
- Rewire `src/app/admin/approval-history/page.tsx` to:
  - consume `useI18n` locale (`ko`/`en`)
  - resolve page copy from locale helper bundle
  - apply locale-driven datetime formatting for logs/history timestamps
- Add WI-0328 regression coverage.

## Out of Scope

- Approval history API/schema changes
- New approval workflows
- Cross-page redesign

## Acceptance

1. Approval-history page headings/form labels/log CTA copy render via locale
   helper bundle (`ko`/`en`).
2. Page timestamp formatting follows runtime locale (`ko-KR`/`en-US`).
3. WI-0328 regression and build checks pass.

## Notes

- Related issue: `#425`
- UI copy hardening only (no domain behavior change)
