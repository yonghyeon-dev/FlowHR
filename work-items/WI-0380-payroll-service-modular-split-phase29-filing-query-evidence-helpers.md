# WI-0380: Payroll service modular split phase29 (filing query evidence helpers)

## Summary
- Extracted year-end filing query and evidence-note flows into `service-year-end-filing-query-evidence-helpers.ts`.
- Moved submission list/ack catalog/timeline read paths and evidence note mutation audit/event composition out of `service.ts`.
- Rewired `service.ts` wrappers for:
  - `listPayrollYearEndFilingSubmissions`
  - `listPayrollYearEndFilingAckCatalog`
  - `listPayrollYearEndFilingSubmissionTimeline`
  - `addPayrollYearEndFilingEvidenceNote`

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-year-end-filing-query-evidence-helpers.ts`
- `scripts/tests/e2e-wi0380-payroll-service-modular-split-phase29-filing-query-evidence-helpers.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0380-payroll-service-modular-split-phase29-filing-query-evidence-helpers.test.ts`
- `npm.cmd run -s typecheck`
