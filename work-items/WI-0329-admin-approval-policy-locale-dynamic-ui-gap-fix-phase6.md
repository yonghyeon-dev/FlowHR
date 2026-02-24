# WI-0329: Admin Approval Policy Locale Dynamic UI Gap Fix Phase 6

## Background

`/admin/approval-policy` still exposed mixed-language and broken copy (mojibake)
on policy/delegation/log surfaces, reducing locale consistency and readability.

## Scope

- Add locale helper bundle for approval policy page:
  - `src/app/admin/approval-policy/page-locale-helpers.ts`
- Rewire `src/app/admin/approval-policy/page.tsx` to:
  - consume `useI18n` locale (`ko`/`en`)
  - resolve page copy from locale helper
  - apply runtime-locale datetime formatting for delegation/log timestamps
- Add WI-0329 regression coverage.

## Out of Scope

- Approval policy/delegation API changes
- New workflow behaviors
- Cross-page redesign

## Acceptance

1. Approval policy page renders hero/context/policy/delegation/log copy from
   locale helper (`ko`/`en`).
2. Broken mixed-language literals are removed from the touched page surface.
3. WI-0329 regression and build checks pass.

## Notes

- Related issue: `#427`
- UI copy hardening only (no domain behavior change)
