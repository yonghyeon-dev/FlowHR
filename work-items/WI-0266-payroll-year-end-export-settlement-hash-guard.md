# WI-0266: Payroll Year-End Export Settlement Hash Guard

## Background

WI-0265 introduced `settlementHash` and stale-apply guard for finalization, but
filing export still allowed stale requests without explicit hash expectation.
Operators needed deterministic export-time guardrails tied to finalized
snapshot identity.

## Scope

### In Scope

- year-end filing export stale-request guard
  - add optional `expectedSettlementHash` input on export API
  - reject with `409` when provided hash mismatches latest finalized settlement hash
- export payload traceability
  - include `settlementHash` in export response payload
  - preserve deterministic settlement hash behavior for same finalized snapshot
- admin filing console update
  - expose optional expected settlement hash input for export guard
  - display settlement hash in finalization/export summary panels
- spec/contract/test-cases update and contract version bump (`1.46.0`)
- WI-0266 regression e2e
  - `scripts/tests/e2e-wi0266-payroll-year-end-export-settlement-hash-guard.test.ts`

### Out of Scope

- filing submission/resubmission guard changes (handled in next WI)
- year-end settlement formula/cap/eligibility changes
- scheduler/ops channel expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0266-payroll-year-end-export-settlement-hash-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0265-payroll-year-end-settlement-hash-and-stale-apply-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
