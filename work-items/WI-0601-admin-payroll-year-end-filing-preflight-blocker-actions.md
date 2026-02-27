# WI-0601: Admin Payroll Year-End Filing Preflight Blocker Actions

## Summary
- Goal: add an actionable preflight blocker panel in `/admin/payroll-year-end-filing` so operators can resolve finalize blockers without leaving the filing flow.
- Scope:
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
  - `src/components/payroll-year-end-filing/request-feedback-helpers.ts`
  - `src/components/payroll-year-end-filing/FilingPreflightBlockerPanel.tsx`
  - `src/components/payroll-year-end-filing/FilingApiLogsPanel.tsx`
  - `src/components/payroll-year-end-filing/FilingFailureActionPanel.tsx`
  - `src/components/payroll-year-end-filing/FilingSettlementSummaryPanels.tsx`
  - `src/components/payroll-year-end-filing/FilingSubmissionTimelinePanel.tsx`
  - `scripts/tests/e2e-wi0601-admin-payroll-year-end-filing-preflight-blocker-actions.test.ts`
  - `work-items/WI-0601-admin-payroll-year-end-filing-preflight-blocker-actions.md`
  - `ROADMAP.md`

## Delivery
- Added preflight blocker panel on filing console:
  - loads `/api/payroll/year-end/preflight-checklist`
  - shows failed/warn checks, readiness summary, settlement-hash presence
  - provides direct follow-up actions for key blockers:
    - pending submission blocker -> switch to `submitted` queue + refresh
    - non-taxable guard blocker -> rerun finalization preview
    - other blockers -> deep-link to `/admin/payroll-year-end/preflight`
- Extended failure-action retry model:
  - added `preflight_checklist` to `PayrollYearEndFilingFailureAction`
  - wired retry dispatch for preflight checklist load failures.
- Kept line-budget guard intact by splitting console panels into dedicated components:
  - `FilingApiLogsPanel`
  - `FilingFailureActionPanel`
  - `FilingSettlementSummaryPanels`
  - `FilingSubmissionTimelinePanel`
- Line budget status:
  - `PayrollYearEndFilingConsole.tsx`: `1293` lines (`<= 1300` 유지).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0601-admin-payroll-year-end-filing-preflight-blocker-actions.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0599-admin-payroll-year-end-filing-failure-action-ux-hardening.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0558-payroll-year-end-filing-value-helper-extraction-and-line-budget-recovery.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint` (known existing warnings only)
