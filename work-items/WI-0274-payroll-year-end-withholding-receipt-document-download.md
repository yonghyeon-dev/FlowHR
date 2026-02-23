# WI-0274: Payroll Year-End Withholding Receipt Issued Document Download

## Background

Withholding receipt preview/issue flow existed, but there was no API to read/download
an already issued receipt artifact for employee self-service or operator support.
Users could confirm readiness but could not retrieve a deterministic issued document
payload from the product.

## Scope

### In Scope

- add issued receipt document read endpoint
  - extend `GET /payroll/year-end/withholding-receipts` query mode (`year`, `employeeId`, `format`)
  - support `format=json|text` document artifact output with `fileName`, `contentType`, and `contentSha256`
  - return `404` when issued receipt audit snapshot does not exist
  - enforce authorization guard:
    - employee can read only own issued document
    - payroll_operator/admin can read tenant-scoped employee document
- add employee UI wiring
  - `/employee/withholding-receipt` adds issued-document load action and download action
  - show document metadata (`format`, `fileName`, hash, timestamps) with content preview
- update payroll spec/contract/test-cases and contract version bump (`1.54.0`)
- add WI-0274 regression e2e
  - `scripts/tests/e2e-wi0274-payroll-year-end-withholding-receipt-document-download.test.ts`

### Out of Scope

- PDF renderer generation or binary attachment storage
- scheduler/ops automation expansion
- withholding formula/cap policy changes

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0274-payroll-year-end-withholding-receipt-document-download.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0273-payroll-year-end-hash-guard-regression-suite.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run build`
