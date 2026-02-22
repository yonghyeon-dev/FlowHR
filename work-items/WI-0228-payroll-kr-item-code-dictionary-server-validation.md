# WI-0228: Payroll KR Item Code Dictionary Server Validation Guard

## Background

WI-0227 added dictionary autocomplete on `/admin`, but payloads could still be crafted with unsupported
codes or mismatched categories. The server now needs deterministic validation parity with the dictionary.

## Scope

### In Scope

- Validate `statutory.taxableIncomeItems` codes against `taxable` dictionary entries on server side.
- Validate `statutory.nonTaxableIncomeItems` codes against `non_taxable` dictionary entries on server side.
- Reject category mismatch for dictionary-backed codes.
- Canonicalize accepted code/category to dictionary values for deterministic downstream payload.
- Update payroll specs/roadmap and add WI-0228 e2e coverage.

### Out of Scope

- Dictionary CRUD management UI.
- External dictionary sync (NTS/Hometax).

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0228-payroll-kr-item-code-dictionary-server-validation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0227-payroll-kr-item-code-autocomplete-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0226-payroll-kr-multi-item-input-table-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0225-payroll-kr-income-split-item-preset-dataset.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0224-payroll-kr-income-split-item-code-category-input.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0223-payroll-kr-taxable-non-taxable-split-rule.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
