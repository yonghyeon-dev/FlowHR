# WI-0190: Payroll Year-End Export Format Expansion and Validation Baseline

## Background and Problem

WI-0189 introduced year-end settlement finalization and filing export, but export output is limited and there is no explicit validation-mode contract for stricter compliance checks.
To continue Phase 4 payroll compliance flow, WI-0190 extends filing export with multi-format artifacts and deterministic validation modes.

## Scope

### In Scope

- Extend year-end filing export API payload:
  - support output formats `json`, `csv`, `jsonl`, `hometax_csv`
  - support validation mode `basic`/`strict`
- Extend payroll service export logic:
  - deterministic artifact builder (file name/content type/content/checksum/byte length)
  - deterministic record validation checks (totals/run-count/uniqueness/receipt/non-negative)
  - strict mode guard (`409`) when validation fails
- Extend admin filing console UX:
  - export format selector with new formats
  - validation mode selector
  - artifact and validation status/issue visibility
- Add WI-0190 regression test:
  - `scripts/tests/e2e-wi0190-payroll-year-end-export-format-expansion-and-validation-baseline.test.ts`
- Wire WI-0190 into MVP/FULL e2e chains
- Update payroll specs (contract/api/test-cases)

### Out of Scope

- Government e-filing API transmission
- Digital signature workflow for exported artifacts
- Batch scheduler for multi-employee filing exports

## User Scenarios

1. Payroll operator exports finalized year-end filing data in required format (`json`/`csv`/`jsonl`/`hometax_csv`).
2. Payroll operator chooses `strict` validation mode to block exports when finalized totals and current records diverge.
3. Payroll operator reviews deterministic artifact metadata (checksum, byte length) for audit trace.

## Data Changes

- Updated API:
  - POST /payroll/year-end/export-filing-data (format + validation mode expansion)
- Updated model:
  - `PayrollRun` (read-only source for format-specific filing rows and validation checks)
- DB migration:
  - none (service/API/UI/spec extension only)

## Rollback Plan

- Keep `FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1` off for disable path
- Revert filing export format/validation extensions in schema/service/UI
- Revert WI-0190 test and spec updates

## Definition of Done (DoD)

- [x] Filing export supports `json`/`csv`/`jsonl`/`hometax_csv` with deterministic artifact checksum.
- [x] Filing export supports `basic`/`strict` validation mode; strict mode blocks validation-failed exports.
- [x] Admin filing console exposes format/mode controls and displays validation/artifact results.
- [x] Payroll contract/api/test-cases include WI-0190 expansion and invariants.
- [x] WI-0190 regression test exists and is wired into MVP/FULL suites.
