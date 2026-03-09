# WI-1056: Product feedback and dev-remnant cleanup

## Background

Several product surfaces still feel unfinished because dev remnants remain visible and meaningful actions provide weak or no feedback.

## Goal

Raise product trust by removing dev remnants and adding expected confirmation and success feedback on core UI actions.

## In Scope

- Hide remaining dashboard dev logs in product mode
- Replace raw payslip JSON copy behavior with product-safe copy behavior
- Add confirmation before admin people profile update commits
- Add visible success feedback for notification read actions

## Out Of Scope

- Full product-wide design refresh
- Navigation or data-model rewrites

## Acceptance Criteria

1. Product-mode surfaces do not expose dev-only log panels.
2. Raw JSON payload copy is not the default user-facing behavior.
3. High-impact profile updates request confirmation before commit.
4. Notification read actions confirm success to the user.

## Progress

- Replaced low-trust request failure copy on these production surfaces:
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `src/components/payslip-receipts/copy.ts`
  - `src/components/payroll-payslip-delivery/copy.ts`
  - `src/components/payroll-year-end-filing/copy.ts`
  - `src/components/leave-calendar/copy.ts`
  - `src/components/payroll-year-end/copy.ts`
  - `src/components/payroll-year-end/employee-year-end-input-copy.ts`
  - `src/components/payroll-close/copy.ts`
  - `src/components/payroll-insurance/copy.ts`
- Replaced `request failed; check logs` style messages with product-safe recovery guidance.
- Replaced `invalid input` style messages with user-directed value review copy.
- Added confirmation before admin people profile updates commit:
  - `src/app/admin/people/page-directory-actions.ts`
- Added visible success feedback after admin/employee notification read actions:
  - `src/app/admin/notifications/page.tsx`
  - `src/app/employee/notifications/page.tsx`
- Replaced raw JSON compare snapshot copy with a human-readable summary:
  - `src/app/employee/payslips/page.tsx`
- Removed a remaining shared-session dev remnant:
  - `src/components/SessionMenu.tsx`
  - raw organization ID output replaced with account-status language
  - raw session errors replaced with user-facing session guidance
- Added regression coverage and wired it into the CI integration chain:
  - `scripts/tests/e2e-wi1056-product-feedback-and-dev-remnant-cleanup.test.ts`
  - `package.json` `test:integration`
- Local verification:
  - `npm run typecheck`
  - `npm run test:integration`
