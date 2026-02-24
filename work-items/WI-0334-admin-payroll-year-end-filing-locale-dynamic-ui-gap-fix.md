# WI-0334: Admin payroll year-end filing locale dynamic UI gap fix

## Summary
- Localized `/admin/payroll-year-end-filing` console UI copy with `useI18n` runtime locale wiring.
- Added locale copy bundle in `src/components/payroll-year-end-filing/copy.ts` and removed hardcoded English surface strings from the console.
- Kept filing/finalization API behavior unchanged while updating baseline tests that previously depended on English literals.

## Scope
- `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
- `src/components/payroll-year-end-filing/copy.ts` (new)
- `scripts/tests/e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test.ts`
- `scripts/tests/e2e-wi0191-payroll-year-end-filing-submission-tracking-and-ack-baseline.test.ts`
- `scripts/tests/e2e-wi0193-payroll-year-end-filing-submission-timeline-and-evidence-note-baseline.test.ts`
- `scripts/tests/e2e-wi0194-payroll-year-end-filing-ack-code-dictionary-and-rejection-reason-catalog-baseline.test.ts`
- `scripts/tests/e2e-wi0196-payroll-year-end-filing-submission-status-summary-and-filter-ux-baseline.test.ts`
- `scripts/tests/e2e-wi0197-payroll-year-end-filing-submission-search-sort-and-quick-action-ux-baseline.test.ts`
- `scripts/tests/e2e-wi0334-admin-payroll-year-end-filing-locale-dynamic-ui-gap-fix.test.ts` (new)
- `ROADMAP.md`
- `package.json`

## Notes
- No new ops automation, scheduler, webhook channel, or infra expansion was added.
- This WI is UI copy/locale dynamic hardening only.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0334-admin-payroll-year-end-filing-locale-dynamic-ui-gap-fix.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0191-payroll-year-end-filing-submission-tracking-and-ack-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0193-payroll-year-end-filing-submission-timeline-and-evidence-note-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0194-payroll-year-end-filing-ack-code-dictionary-and-rejection-reason-catalog-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0196-payroll-year-end-filing-submission-status-summary-and-filter-ux-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0197-payroll-year-end-filing-submission-search-sort-and-quick-action-ux-baseline.test.ts`
- `npm.cmd run typecheck`
