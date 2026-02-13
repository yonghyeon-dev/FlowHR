# Payroll Test Cases (WI-0001 + WI-0005 + WI-0006 Contract)

## Scope

Payroll gross pay preview and confirmation behavior for WI-0001 plus phase2 deduction/tax and deduction-profile contract coverage.

## Functional Cases

1. Run payroll preview for monthly period with approved attendance data.
2. Confirm payroll run by payroll operator.
3. Reject preview request for unauthorized role.
4. Trigger recalculation when corrected attendance event arrives.
5. Run deduction/tax preview with feature flag for phase2 contract path.
6. Create/update deduction profile and read latest profile by ID.
7. Run deduction/tax preview in `profile` mode without explicit deduction values.
8. Reject profile-mode preview when `expectedProfileVersion` is stale.

## Accuracy Cases

1. Overtime, night, and holiday minute categories are paid with correct multipliers.
2. Gross pay rounding follows common SSoT rules.
3. Deterministic output for repeated same-input calculations.
4. `totalDeductionsKrw` equals sum of deduction components.
5. `netPayKrw` equals `grossPayKrw - totalDeductionsKrw`.
6. Profile-mode calculation stores profile ID/version trace and remains deterministic.
7. Profile-mode stale version guard returns deterministic `409` mismatch error.

## Regression Linkage

- `GC-001-standard-day.json`
- `GC-002-overnight-boundary.json`
- `GC-003-late-correction.json`
- `GC-004-holiday-overtime.json`
- `GC-005-retroactive-recalc.json`
- `GC-006-phase2-deduction-profile.json`

## QA Gate Expectations

- Spec Gate: contract invariants and consumer impact present.
- Code Gate: payroll unit/integration/regression checks pass.
- Compatibility Gate: gross-only consumer path remains valid with phase2 flag off.
- Profile Gate: profile-mode API/auth/audit checks are validated before merge.
