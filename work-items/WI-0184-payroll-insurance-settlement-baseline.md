# WI-0184: Payroll 4-Insurance Settlement Baseline

## Background and Problem

FlowHR payroll currently supports gross preview and KR statutory baseline deduction preview, but there is no dedicated settlement view for 4-insurance employee/employer contributions and delta reconciliation.
To progress Phase 4 without expanding monolith pages, WI-0184 adds a focused insurance settlement preview API and a dedicated admin route.

## Scope

### In Scope

- Add payroll insurance settlement preview API:
  - `POST /payroll/runs/preview-insurance-settlement`
  - per-employee settlement calculation from approved attendance and KRW rates/caps
  - employee/employer contribution breakdown and settlement delta (`priorWithheldKrw`, `priorEmployerPaidKrw`)
- Add settlement service logic:
  - payroll preview permission and tenant/employee boundary guard
  - optional monthly-boundary validation in `Asia/Seoul`
  - audit event append for read/preview action
- Add dedicated admin route:
  - `/admin/payroll-insurance`
  - query input + summary/breakdown rendering
- Add WI-0184 regression test:
  - `scripts/tests/e2e-wi0184-payroll-insurance-settlement-baseline.test.ts`
- Wire WI-0184 test into MVP/FULL e2e chains
- Update payroll specs (contract/api/test-cases)

### Out of Scope

- Legal-grade final filing/remittance automation
- Batch settlement scheduler/cron workflows
- Mobile-native payroll settlement UX

## User Scenarios

1. Payroll operator previews employee/employer 4-insurance settlement for a monthly payroll period.
2. Payroll operator checks settlement deltas against already-withheld/paid amounts before finalizing payroll.
3. Admin reviews component-level contribution breakdown and caps for audit readiness.

## Data and API Changes

- New API endpoint: `POST /payroll/runs/preview-insurance-settlement`
- No DB migration (preview/read model path)

## Rollback Plan

- Revert route `src/app/api/payroll/runs/preview-insurance-settlement/route.ts`
- Revert service/schema additions for insurance settlement preview
- Remove `/admin/payroll-insurance` route and navigation link
- Revert payroll spec and e2e chain updates

## Definition of Done (DoD)

- [x] Insurance settlement API returns deterministic employee/employer contribution breakdown and deltas.
- [x] Tenant/permission guards block unauthorized preview requests.
- [x] Dedicated admin route exists for settlement preview and review.
- [x] Payroll contract/api/test-cases include new endpoint and invariants.
- [x] WI-0184 regression test exists and is wired into MVP/FULL suites.
