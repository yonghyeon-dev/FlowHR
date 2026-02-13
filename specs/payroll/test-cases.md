# Payroll Test Cases (WI-0001 + WI-0005 Contract)

## Scope

Payroll gross pay preview and confirmation behavior for WI-0001 plus phase2 deduction/tax contract coverage.

## Functional Cases

1. Run payroll preview for monthly period with approved attendance data.
2. Confirm payroll run by payroll operator.
3. Reject preview request for unauthorized role.
4. Trigger recalculation when corrected attendance event arrives.
5. Run deduction/tax preview with feature flag for phase2 contract path.

## Accuracy Cases

1. Overtime, night, and holiday minute categories are paid with correct multipliers.
2. Gross pay rounding follows common SSoT rules.
3. Deterministic output for repeated same-input calculations.
4. `totalDeductionsKrw` equals sum of deduction components.
5. `netPayKrw` equals `grossPayKrw - totalDeductionsKrw`.

## Regression Linkage

- `GC-001-standard-day.json`
- `GC-002-overnight-boundary.json`
- `GC-003-late-correction.json`
- `GC-004-holiday-overtime.json`
- `GC-005-retroactive-recalc.json`

## QA Gate Expectations

- Spec Gate: contract invariants and consumer impact present.
- Code Gate: payroll unit/integration/regression checks pass.
- Compatibility Gate: gross-only consumer path remains valid with phase2 flag off.
