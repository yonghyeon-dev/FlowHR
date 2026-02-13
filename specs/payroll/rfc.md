# Payroll RFC (WI-0001 + WI-0005 + WI-0006 + WI-0010 Contract)

## Goal

Provide payroll gross pay preview based on attendance aggregates, phase2 deduction/tax expansion, and deduction profile auto-calculation mode.

## Key Decisions

- Payroll remains gross-pay only in MVP.
- Input source is approved attendance events and projections.
- Contract includes audit and deterministic recalculation invariants.
- Phase2 deduction/tax path is feature-flagged and additive-only.
- WI-0006 introduces profile-mode deduction calculation with versioned trace metadata.
- WI-0010 introduces optional expected profile version guard to reject stale profile preview requests.

## Non-Goals

- Country-specific full tax engine implementation.
- External remittance integration.
