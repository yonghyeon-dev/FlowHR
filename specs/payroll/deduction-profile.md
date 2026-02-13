# Payroll Deduction Profile (WI-0006)

## Purpose

Define a reusable deduction policy profile for phase2 payroll preview in `profile` mode.

## Profile Model

Required fields:

- `id`: profile identifier
- `name`: human-readable profile name
- `version`: positive integer, increment on policy change
- `active`: boolean
- `withholdingRate`: decimal in range `0..1`
- `socialInsuranceRate`: decimal in range `0..1`
- `fixedOtherDeductionKrw`: non-negative integer

## Calculation Formula

Given `grossPayKrw`:

- `withholdingTaxKrw = round(grossPayKrw * withholdingRate)`
- `socialInsuranceKrw = round(grossPayKrw * socialInsuranceRate)`
- `otherDeductionsKrw = fixedOtherDeductionKrw`
- `totalDeductionsKrw = withholdingTaxKrw + socialInsuranceKrw + otherDeductionsKrw`
- `netPayKrw = grossPayKrw - totalDeductionsKrw`

Rounding follows `specs/common/time-and-payroll-rules.md`.

## Audit Requirements

- Profile mutation emits:
  - `payroll.deduction_profile.updated`
  - `payroll.deduction_profile.updated.v1`
- Profile-mode preview persists:
  - `deductionProfileId`
  - `deductionProfileVersion`
- Profile-mode preview may include optional `expectedProfileVersion` request field for optimistic version guard.

## Validation Rules

- Reject when any calculated deduction component is negative.
- Reject when `netPayKrw < 0`.
- Reject when profile is inactive.
- Reject when `expectedProfileVersion` is provided and does not match the current profile version.
