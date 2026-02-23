# WI-0282: Payroll KR Lookup Preset Effective-Date Auto Resolution

## Background

`POST /payroll/runs/preview-with-deductions` supports `incomeTaxLookupPresetId`, but operators must
manually choose a preset ID every time. For payroll precision, the statutory KR preview should also
support deterministic preset auto selection by an effective-date reference.

## Scope

### In Scope

- add statutory KR lookup preset auto-selection inputs:
  - `statutory.incomeTaxLookupPresetAuto` (boolean)
  - `statutory.incomeTaxLookupAsOf` (ISO datetime, optional)
- auto-resolution behavior:
  - when `incomeTaxLookupPresetAuto=true` and explicit tax method input is absent
    (`incomeTaxBrackets`, `incomeTaxLookupTable`, `incomeTaxLookupPresetId`), resolve lookup preset
    by effective date
  - effective date reference:
    - use `incomeTaxLookupAsOf` when provided
    - otherwise use payroll `periodEnd`
  - select latest preset where `effectiveFrom <= reference date`
- guard behavior:
  - reject mixed usage when auto-selection is combined with explicit tax method fields
  - reject when no eligible preset exists for resolved reference date
- add second preset dataset to verify date-based selection deterministically
- response enrichment:
  - include auto-resolution metadata (`autoSelected`, `resolvedBy`, `asOf`, selected preset metadata)
- update payroll contract/api/test-cases and bump payroll spec version (`1.56.0`)
- add WI-0282 e2e regression:
  - deterministic preset auto resolution by effective date
  - mixed-input guard and no-eligible-preset guard

### Out of Scope

- legal tax-rule rewrite outside current lookup preset model
- payroll close/finalization/filing workflow changes
- scheduler/ops automation expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0282-payroll-kr-lookup-preset-effective-date-auto-resolution.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0221-payroll-kr-tax-table-preset-and-validation-guard.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run build`

