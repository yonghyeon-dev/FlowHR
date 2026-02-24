# WI-0323: Payroll Service Year-End Run Snapshot Helper Split Phase 14

## Background

`src/features/payroll/service.ts` remained large after WI-0321. The year-end
run snapshot loading and payroll total aggregation logic was still embedded in
the monolith service file.

## Scope

- Extract year-end run snapshot/aggregation helper logic from
  `src/features/payroll/service.ts` into
  `src/features/payroll/service-year-end-run-snapshot-helpers.ts`.
- Rewire `service.ts` to import `aggregatePayrollTotalsKrw`,
  `loadYearEndRunSnapshot`, and `YearEndRunSnapshot`.
- Add WI-0323 regression coverage.

## Out of Scope

- Payroll business rule changes
- API/schema/contract changes
- Year-end filing lifecycle behavior changes

## Acceptance

1. `service.ts` no longer declares `aggregatePayrollTotalsKrw` and
   `loadYearEndRunSnapshot`.
2. Snapshot helper module exports both functions and required snapshot types.
3. WI-0323 regression and build checks pass.

## Notes

- Related issue: `#415`
- Internal decomposition only (no contract version bump required)
