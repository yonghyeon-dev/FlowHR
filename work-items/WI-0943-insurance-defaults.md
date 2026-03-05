# WI-0943: Korean 4-Insurance Rate Defaults for Payroll Deduction Preview

## Background and Problem

Admins currently need to enter KR social insurance rates manually before payroll deduction preview.
This introduces repetitive setup work and raises the risk of rate-entry mistakes.

## Scope

### In Scope

- Add `DEFAULT_INSURANCE_RATES` for KR 2026:
  - `nps: 0.045`
  - `nhi: 0.03545`
  - `ei: 0.009`
  - `wci: null`
  - `effectiveYear: 2026`
- Persist organization-level insurance rate overrides on organization settings data.
- Add `GET /api/admin/insurance/rates`:
  - admin role only
  - returns merged rates (organization override first, default fallback)
- Add `PUT /api/admin/insurance/rates`:
  - admin role only
  - accepts optional `{ nps, nhi, ei, wci }` overrides
  - returns merged rates
- Add/Enhance payroll preview endpoint:
  - `POST /api/payroll/preview`
  - defaults to statutory KR deduction preview mode
  - uses organization insurance overrides when present, else default constants
  - response includes `insuranceBreakdown` as `{ nps, nhi, ei, wci }`
- Add e2e coverage for default read, override write/readback, preview breakdown, and employee-role forbid.

### Out of Scope

- Admin UI changes for insurance-rate forms.
- Historical multi-year rate versioning beyond fixed 2026 default constant.
- Policy/legal interpretation changes outside rate fallback/override behavior.

## API and Validation Notes

- `GET/PUT /api/admin/insurance/rates` require admin actor and organization scope.
- Insurance rates are validated as numbers between `0` and `1`.
- Payroll preview breakdown includes `wci` amount; default `wci` remains `0` in calculations when unset.

## Data Changes

- Table updates:
  - `Organization`
- Migration id:
  - `202603050010_wi0943_insurance_rates_defaults`

## Test Plan

- `scripts/tests/e2e-wi0943-insurance-defaults.test.ts`
  - `GET` default rates returns KR 2026 defaults
  - `PUT` custom rates persists overrides
  - `GET` after `PUT` returns overridden rates
  - `POST /api/payroll/preview` returns insurance breakdown using overridden rates
  - employee role receives `403` on admin insurance rates API

## Migration

- `prisma/migrations/202603050010_wi0943_insurance_rates_defaults/migration.sql`

## Rollback Plan

- Remove `/api/admin/insurance/rates` and `/api/payroll/preview` route additions.
- Revert organization insurance-rate override fields in data-access and schema migration.
- Remove WI-0943 e2e test and this work-item document.
