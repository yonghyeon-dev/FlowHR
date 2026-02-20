# Payroll Test Cases (WI-0001 + WI-0005 + WI-0006 Contract)

## Scope

Payroll gross pay preview and confirmation behavior for WI-0001 plus phase2 deduction/tax and deduction-profile contract coverage.

## Functional Cases

1. Run payroll preview for monthly period with approved attendance data.
2. Reject payroll preview requests when `employeeId` does not exist (404).
3. Confirm payroll run by payroll operator.
4. Reject preview request for unauthorized role.
5. Trigger recalculation when corrected attendance event arrives.
6. Run deduction/tax preview with feature flag for phase2 contract path.
7. Create/update deduction profile and read latest profile by ID.
8. Run deduction/tax preview in `profile` mode without explicit deduction values.
9. Reject profile-mode preview when `expectedProfileVersion` is stale.
10. List payroll runs by period (`from`/`to`) and verify role guard (payroll_operator/admin, plus employee self-service for own CONFIRMED only).
11. List deduction profiles (optional filters `active`, `mode`) and verify role guard.
12. Run deduction/tax preview in `statutory_kr_baseline` mode with taxable-base and component breakdown output.
13. Reject statutory baseline preview when `payroll_kr_baseline_v1` feature flag is disabled.
14. Run statutory baseline preview with progressive `incomeTaxBrackets`.
15. Run statutory baseline preview with insurance contribution caps and verify capped bases.
16. Reject statutory baseline preview when bracket ordering/open-ended bracket rule is invalid.
17. Run statutory baseline preview with additive tax-credit fields and verify pre-credit vs post-credit tax values.
18. Reject statutory baseline preview when `requireMonthlyBoundary=true` and period is not monthly boundary in `Asia/Seoul`.
19. Replay statutory golden fixtures (`GC-007`, `GC-008`) and verify deterministic deduction totals/net pay.
20. Employee self-service payslip list returns only own `CONFIRMED` statutory runs with deduction breakdown details, and rejects `PREVIEWED`/other-employee access.

## Accuracy Cases

1. Overtime, night, and holiday minute categories are paid with correct multipliers.
2. Gross pay rounding follows common SSoT rules.
3. Deterministic output for repeated same-input calculations.
4. `totalDeductionsKrw` equals sum of deduction components.
5. `netPayKrw` equals `grossPayKrw - totalDeductionsKrw`.
6. Profile-mode calculation stores profile ID/version trace and remains deterministic.
7. Profile-mode stale version guard returns deterministic `409` mismatch error.
8. Statutory baseline mode computes taxable base and component sums deterministically.
9. Statutory baseline mode total/net calculations match component aggregation.
10. Progressive bracket mode computes income tax by bracket segments deterministically.
11. Insurance caps bound each insurance component base deterministically.
12. Tax-credit mode applies credit before local-income-tax and never produces negative income tax.
13. Monthly-boundary guard in `Asia/Seoul` rejects non-monthly periods deterministically.
14. Employee payslip self-service view preserves statutory deduction totals/net values and excludes unauthorized runs.

## Regression Linkage

- `GC-001-standard-day.json`
- `GC-002-overnight-boundary.json`
- `GC-003-late-correction.json`
- `GC-004-holiday-overtime.json`
- `GC-005-retroactive-recalc.json`
- `GC-006-phase2-deduction-profile.json`
- `GC-007-statutory-progressive-cap.json`
- `GC-008-statutory-tax-credit-month-boundary.json`

## QA Gate Expectations

- Spec Gate: contract invariants and consumer impact present.
- Code Gate: payroll unit/integration/regression checks pass.
- Compatibility Gate: gross-only consumer path remains valid with phase2 flag off.
- Profile Gate: profile-mode API/auth/audit checks are validated before merge.
- Statutory Gate: statutory_kr_baseline mode must remain feature-flagged and deterministic.
- Progressive/Cap Gate: bracket ordering and insurance-cap calculations must be deterministic and validated.
- Tax-Credit/Boundary Gate: tax-credit ordering and monthly-boundary guard checks must be deterministic and validated.
- Employee Payslip Gate: employee role can list only their own CONFIRMED payroll runs; other employees and PREVIEWED runs are blocked (403).
