# WI-0185: Payroll Withholding Settlement and Close-Period Baseline

## Background and Problem

FlowHR can preview and confirm payroll runs, but there is no explicit period-close workflow that summarizes confirmed runs and compares withholding/net payout amounts against previously paid amounts.
To continue Phase 4 payroll hardening without expanding monolith pages, WI-0185 introduces a dedicated close-period API and admin route.

## Scope

### In Scope

- Add payroll close-period API:
  - `POST /payroll/runs/close-period`
  - period-level summary from payroll runs
  - confirmed-run totals and withholding/net settlement deltas against prior-paid values
  - preview/apply workflow (`apply=false/true`)
- Add close-period service logic:
  - payroll period-close feature flag gate
  - permission and tenant boundary guard
  - close-blocking validation when unconfirmed (`PREVIEWED`) runs remain
  - audit and domain event publication for preview/close
- Add dedicated admin route:
  - `/admin/payroll-close`
  - close-period preview and apply actions
  - blocking reason and run-state summary visibility
- Add WI-0185 regression test:
  - `scripts/tests/e2e-wi0185-payroll-withholding-close-period-baseline.test.ts`
- Wire WI-0185 test into MVP/FULL e2e chains
- Update payroll specs (contract/api/test-cases)

### Out of Scope

- Legal-grade external tax filing/remittance integration
- Persistent payroll period close ledger table/migration
- Re-open/void workflow for closed payroll periods

## User Scenarios

1. Payroll operator previews period close summary for a month and checks whether all runs are confirmed.
2. Payroll operator compares withholding/social/net totals with prior paid amounts and reviews settlement delta.
3. Payroll operator executes period close only when blocking runs are zero.

## Data and API Changes

- New API endpoint: `POST /payroll/runs/close-period`
- No DB migration (audit/event-driven workflow baseline)

## Rollback Plan

- Revert route `src/app/api/payroll/runs/close-period/route.ts`
- Revert payroll close-period service/schema additions
- Remove `/admin/payroll-close` route and navigation link
- Revert payroll spec and e2e chain updates

## Definition of Done (DoD)

- [x] Close-period API returns deterministic period totals, run-state summary, and settlement deltas.
- [x] `apply=true` is blocked when unconfirmed runs remain; `apply=false` preview still returns blocking reasons.
- [x] Dedicated admin route exists for period-close preview and apply workflow.
- [x] Payroll contract/api/test-cases include close-period endpoint, events, invariants, and feature flag.
- [x] WI-0185 regression test exists and is wired into MVP/FULL suites.
