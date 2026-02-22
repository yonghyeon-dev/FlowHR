# Payroll RFC (WI-0001 + WI-0005 + WI-0006 + WI-0010 + WI-0101 + WI-0105 + WI-0106 + WI-0110 + WI-0220 + WI-0221 + WI-0223 + WI-0224 + WI-0225 Contract)

## Goal

Provide payroll gross pay preview based on attendance aggregates, phase2 deduction/tax expansion, deduction profile auto-calculation mode, and KR statutory baseline deduction mode with progressive/lookup-table/preset/cap/tax-credit/month-boundary/insurance-rounding/taxable-split/item-code/item-preset options.

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
- WI-0110 extends golden fixture regression coverage to include statutory deterministic cases (GC-007/GC-008).
- WI-0220 extends statutory baseline with optional simple withholding lookup-table and insurance rounding rules while preserving WI-0106 compatibility.
- WI-0221 extends statutory baseline with optional managed lookup-table preset ID and stricter lookup-table validation guards while preserving WI-0220 compatibility.
- WI-0223 extends statutory baseline with optional taxable-income split input (`taxableIncomeKrw`) and explicit taxable/non-taxable sum validation against gross pay.
- WI-0224 extends statutory baseline with optional taxable/non-taxable income item arrays (`code`/`category`/`amountKrw`) and item-total validation guard integration with split totals.
- WI-0225 extends statutory baseline with optional income split item preset ID (`incomeSplitItemPresetId`) and server-managed code/category template application guard.

## Non-Goals

- Country-specific full tax engine implementation.
- External remittance integration.
