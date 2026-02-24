# WI-0311: Payroll Service Modular Split Phase 9 (Withholding Receipt Helpers)

## Background

`src/features/payroll/service.ts` still retains dense year-end withholding receipt
guard/payload composition logic. This keeps the service file large and makes
the year-end receipt flow harder to reason about.

## Scope

- Extract year-end withholding receipt guard and summary composition into:
  - `src/features/payroll/year-end-withholding-receipt-helpers.ts`
- Rewire `src/features/payroll/service.ts` to call extracted helpers without
  behavior change.
- Add WI-0311 regression test coverage.

## Out of Scope

- API/schema/contract changes
- New receipt features or workflow changes
- UI changes

## Acceptance

1. `service.ts` delegates withholding receipt guard/payload composition to the
   new helper module.
2. Existing withholding receipt behavior remains unchanged.
3. WI-0311 regression and build checks pass.

## Notes

- Related issue: `#391`
- Structural decomposition WI (no product-scope expansion)
