# WI-0189: Payroll Year-End Finalization and Filing Export Baseline

## Background and Problem

FlowHR provides year-end settlement preview/recalculation and withholding receipt workflow, but payroll operators still cannot finalize year-end settlement and export filing-ready annual data with compliance guards.
To continue Phase 4 payroll compliance flow, WI-0189 adds finalization and filing export APIs plus dedicated Admin route.

## Scope

### In Scope

- Add year-end finalization API:
  - `POST /payroll/year-end/finalize-settlement`
  - finalization preview/apply mode (`apply=false/true`)
  - confirmed + distributed + receipt-confirmed guard chain
  - finalization payload/audit/domain-event trace
- Add year-end filing export API:
  - `POST /payroll/year-end/export-filing-data`
  - finalized settlement precondition guard
  - filing output format option (`json`/`csv`) and deterministic row export
- Add payroll service logic:
  - feature flag gate (`FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1`)
  - permission and tenant boundary enforcement
  - finalized payload lookup through audit log for export consistency
- Add dedicated route:
  - Admin: `/admin/payroll-year-end-filing`
- Add WI-0189 regression test:
  - `scripts/tests/e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test.ts`
- Wire WI-0189 into MVP/FULL e2e chains
- Update payroll specs (contract/api/test-cases)

### Out of Scope

- Government API/e-filing transmission integration
- Multi-employee batch export scheduler
- Signed PDF output or document archive lifecycle

## User Scenarios

1. Payroll operator previews year-end finalization readiness and sees blocking reasons when prerequisites are missing.
2. Payroll operator applies finalization after prerequisites are satisfied and receives finalization ID and annual settlement snapshot.
3. Payroll operator exports filing-ready annual data in `json` or `csv` format after finalization.

## Data Changes

- New APIs:
  - POST /payroll/year-end/finalize-settlement
  - POST /payroll/year-end/export-filing-data
- Updated model:
  - `PayrollRun` (read-only annual aggregation and filing row projection)
- DB migration:
  - none (service/audit/event extension only)

## Rollback Plan

- Disable `FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1`
- Revert year-end finalization/export routes and service/schema changes
- Revert admin dedicated route and navigation link
- Revert payroll spec and e2e updates

## Definition of Done (DoD)

- [x] Year-end finalization preview/apply is deterministic and enforces confirmed/distributed/receipt-confirmed prerequisites.
- [x] Filing export is blocked before finalization and returns deterministic row/csv output after finalization.
- [x] Dedicated admin route exists without extending legacy large dashboard pages.
- [x] Payroll contract/api/test-cases include finalization/export endpoints, invariants, and feature flag.
- [x] WI-0189 regression test exists and is wired into MVP/FULL suites.
