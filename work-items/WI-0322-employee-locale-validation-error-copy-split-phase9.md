# WI-0322: Employee Locale Validation/Error Copy Split Phase 9

## Background

After WI-0320, `src/app/employee/page.tsx` still contained many inline
validation/error/checklist strings. The page switched locale correctly at the
surface level, but validation and failure-copy text was still scattered in the
page layer.

## Scope

- Extend `src/app/employee/page-locale-helpers.ts` with a
  `validationCopy` bundle (`ko`/`en`) for:
  - correction validation messages
  - attendance/leave pre-submit check labels and details
  - resubmit-flow checklist and submit-card copy
  - failure-cause and request-feedback fallback/error text
- Rewire `src/app/employee/page.tsx` to consume `validationCopy` instead of
  inline locale ternaries/hardcoded literals in validation/error paths.
- Add WI-0322 regression coverage.

## Out of Scope

- New employee workflow/routes
- API/schema/contract changes
- Section-level IA restructuring

## Acceptance

1. Validation/error/checklist copy in employee self-service page is resolved by
   helper bundle (`validationCopy`) for both `ko` and `en`.
2. Inline hardcoded correction validation and checklist labels are removed from
   the page logic.
3. WI-0322 regression and build checks pass.

## Notes

- Related issue: `#413`
- UI-only locale hardening; no contract/domain version change
