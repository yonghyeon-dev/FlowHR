# WI-0182: Leave Accrual Auto-Grant Engine Baseline

## Background and Problem

FlowHR already supports per-employee yearly settlement (`/leave/accrual/settle`), but payroll/admin still has to run it manually one-by-one.
After WI-0176~WI-0181 bloat cleanup, the next roadmap phase requires actual leave-policy engine progress instead of UI phase-loop expansion.

Following `docs/codex-guide.md` Phase 3 direction, WI-0182 adds organization-level auto-grant execution with dry-run/apply modes.

## Scope

### In Scope

- Add leave accrual auto-grant API:
  - `POST /leave/accrual/auto-grant`
  - organization scope + target year + `dryRun` + `includeAlreadySettled`
  - per-employee result row and summary counts
- Auto-grant baseline rule:
  - policy `annualGrantDays` / `carryOverCapDays` reuse
  - join month (`Employee.createdAt`) based pro-rated suggested grant
  - already-settled employee skip handling
- Add dedicated admin route:
  - `/admin/leave-accrual`
  - dry-run/apply trigger and result inspection
- Add WI-0182 regression test:
  - `scripts/tests/e2e-wi0182-leave-accrual-auto-grant-engine-baseline.test.ts`
- Wire WI-0182 test into MVP/FULL e2e chains
- Update leave specs (contract/api/test-cases) for the new endpoint

### Out of Scope

- Legal-grade annual accrual edge-case full automation
- Scheduler/cron/workflow-based background batch execution
- Mobile-specific leave UI

## User Scenarios

1. Payroll operator runs dry-run to preview who will be settled and why rows are skipped.
2. Admin applies auto-grant for a target year in one execution instead of per-employee manual calls.
3. Already-settled employees are skipped safely and reported in summary.

## Data and API Changes

- New API endpoint: `POST /leave/accrual/auto-grant`
- No schema migration (existing employee/policy/balance data reused)

## Rollback Plan

- Revert route `src/app/api/leave/accrual/auto-grant/route.ts`
- Revert service/schema additions for auto-grant
- Remove `/admin/leave-accrual` route and navigation link
- Revert leave spec and package test-chain updates

## Definition of Done (DoD)

- [x] Auto-grant API supports dry-run/apply with organization/year validation.
- [x] Auto-grant summary includes eligible/already-settled/not-eligible/applied/failed counts.
- [x] Dedicated admin route exists for running and inspecting auto-grant results.
- [x] Leave contract/api/test-cases reflect the new endpoint and behavior.
- [x] WI-0182 regression test exists and is wired into MVP/FULL suites.
