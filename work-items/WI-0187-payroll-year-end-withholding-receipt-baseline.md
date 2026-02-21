# WI-0187: Payroll Year-End Settlement and Withholding Receipt Baseline

## Background and Problem

FlowHR can calculate payroll, close periods, and manage payslip delivery/receipt. However, there is no yearly settlement summary and no withholding receipt preview/issue workflow.
To continue Phase 4 payroll compliance scope with customer-facing value, WI-0187 adds year-end APIs and dedicated Admin/Employee routes.

## Scope

### In Scope

- Add year-end settlement API:
  - `POST /payroll/year-end/preview-settlement`
  - employee/year annual totals aggregation from confirmed runs
  - annual tax liability and withholding delta summary
- Add withholding receipt API:
  - `POST /payroll/year-end/withholding-receipts`
  - preview mode (`issue=false`) and issue mode (`issue=true`)
  - issue guard: confirmed + distributed + receipt-confirmed yearly runs
  - employee own preview support, payroll operator/admin issue support
- Add payroll service logic:
  - feature flag gate (`FLOWHR_PAYROLL_YEAR_END_V1`)
  - role and tenant boundary guard
  - audit/domain event publication for preview/issue/failure telemetry
- Add dedicated routes:
  - Admin: `/admin/payroll-year-end`
  - Employee: `/employee/withholding-receipt`
- Add WI-0187 regression test:
  - `scripts/tests/e2e-wi0187-payroll-year-end-withholding-receipt-baseline.test.ts`
- Wire WI-0187 into MVP/FULL e2e chains
- Update payroll specs (contract/api/test-cases)

### Out of Scope

- HomeTax/국세청 external filing integration
- PDF renderer for withholding receipt documents
- Multi-year bulk issuance scheduler

## User Scenarios

1. Payroll operator previews year-end settlement for an employee and checks annual tax liability vs prior withholding.
2. Payroll operator previews withholding receipt readiness and sees blocking reasons when prerequisites are missing.
3. Payroll operator issues withholding receipt after yearly payroll runs are confirmed/distributed/receipt-confirmed.
4. Employee previews own withholding receipt readiness from employee portal.

## Data Changes

- New APIs:
  - POST /payroll/year-end/preview-settlement
  - POST /payroll/year-end/withholding-receipts
- Updated model:
  - `PayrollRun` (read-only usage for issue guard checks)
- DB migration:
  - none (service/audit/event-driven baseline)

## Rollback Plan

- Disable `FLOWHR_PAYROLL_YEAR_END_V1`
- Revert year-end routes and payroll service/schema changes
- Revert admin/employee dedicated routes and navigation links
- Revert payroll spec and e2e updates

## Definition of Done (DoD)

- [x] Year-end settlement preview returns deterministic annual totals and tax-liability/withholding-delta summary.
- [x] Withholding receipt issue is blocked until yearly runs are confirmed, distributed, and receipt-confirmed.
- [x] Employee can preview own withholding receipt readiness; issue remains payroll-operator/admin only.
- [x] Dedicated admin/employee routes exist without adding new sections to legacy large pages.
- [x] Payroll contract/api/test-cases include year-end endpoints, invariants, and feature flag.
- [x] WI-0187 regression test exists and is wired into MVP/FULL suites.
