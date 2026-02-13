# Payroll RFC (WI-0001 + WI-0005 Contract)

## Goal

Provide payroll gross pay preview based on attendance aggregates and define phase2 deduction/tax contract expansion.

## Key Decisions

- Payroll remains gross-pay only in MVP.
- Input source is approved attendance events and projections.
- Contract includes audit and deterministic recalculation invariants.
- Phase2 deduction/tax path is feature-flagged and additive-only.

## Non-Goals

- Country-specific full tax engine implementation.
- External remittance integration.
