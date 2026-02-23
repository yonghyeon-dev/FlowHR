# WI-0234: Payroll KR Preset Share-Link Reset/Reapply UX

## Background

WI-0233 exposed applied/invalid query feedback for preset share links, but operators still had no direct UX
control to clear share-applied values and deterministically re-apply the current query context during review.

## Scope

### In Scope

- Extend `PayrollKrPresetShareLinkFeedbackPanel` with explicit reset/reapply actions.
- Add `/admin` payroll statutory handlers for:
  - resetting share-applied preset/taxable/non-taxable inputs to defaults
  - re-applying current `window.location.search` share query context deterministically
- Preserve existing parser and API payload behavior (UI-only enhancement).
- Update roadmap/spec/tests and add WI-0234 e2e coverage.

### Out of Scope

- Payroll API schema/contract payload changes.
- Signed share token generation, persistence, or expiry policy.

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0234-payroll-kr-preset-share-link-reset-reapply-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0233-payroll-kr-preset-share-link-validation-feedback-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0232-payroll-kr-preset-share-link-auto-apply-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0231-payroll-kr-preset-payload-copy-share-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0230-payroll-kr-preset-sample-payload-preview.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0229-payroll-kr-preset-manual-consistency-ux-guide.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0228-payroll-kr-item-code-dictionary-server-validation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0227-payroll-kr-item-code-autocomplete-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0226-payroll-kr-multi-item-input-table-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0225-payroll-kr-income-split-item-preset-dataset.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0224-payroll-kr-income-split-item-code-category-input.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0223-payroll-kr-taxable-non-taxable-split-rule.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
