# Payroll RFC (WI-0001 + WI-0005 + WI-0006 + WI-0010 + WI-0101 + WI-0105 + WI-0106 Contract)

## Goal

Provide payroll gross pay preview based on attendance aggregates, phase2 deduction/tax expansion, deduction profile auto-calculation mode, and KR statutory baseline deduction mode with progressive/cap/tax-credit/month-boundary options.

## Key Decisions

- Payroll remains gross-pay only in MVP.
- Input source is approved attendance events and projections.
- Contract includes audit and deterministic recalculation invariants.
- Phase2 deduction/tax path is feature-flagged and additive-only.
- WI-0006 introduces profile-mode deduction calculation with versioned trace metadata.
- WI-0010 introduces optional expected profile version guard to reject stale profile preview requests.
- WI-0101 introduces `statutory_kr_baseline` mode with feature-flagged KR withholding/social insurance approximation.
- WI-0105 extends statutory baseline with optional progressive income-tax brackets and insurance contribution caps while preserving flat-rate compatibility.
- WI-0106 extends statutory baseline with additive tax-credit inputs and optional monthly-boundary validation (`Asia/Seoul`) while preserving WI-0105 compatibility.

## Non-Goals

- Country-specific full tax engine implementation.
- External remittance integration.
