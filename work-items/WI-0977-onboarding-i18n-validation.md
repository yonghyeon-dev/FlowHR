# WI-0977: onboarding i18n + empty ID validation

## Background and Problem

Onboarding pages had locale-inconsistent messages and weak preflight validation.
This could trigger API calls when session identifiers were empty and expose non-localized UX.

## Scope

### In Scope

- Add locale branching (`ko`/default English) for all hardcoded Korean copy in `src/app/(protected)/onboarding/page.tsx` with `useI18n()`.
- Add locale branching for error messages in `src/app/employee/onboarding/page.tsx`.
- Block onboarding API calls when `organizationId` is empty in protected onboarding flow.
- Block onboarding API calls when `employeeId` is empty in employee onboarding flow.

### Out of Scope

- API contract/schema/migration changes.
- Onboarding route redesign.

## Test Plan

- `node --experimental-strip-types scripts/tests/e2e-wi0977-onboarding-i18n-validation.test.ts`
- `node --experimental-strip-types scripts/tests/e2e-wi0972-employee-pages-session-loading.test.ts`
- `npm run typecheck`

## ADR

- Not required: scoped UX/validation hardening without architecture changes.
