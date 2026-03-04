# WI-0937: Minimum Wage Guard For Payroll Calculation

## Background and Problem

Payroll confirmation currently has no minimum-wage validation layer.
For KR payroll in 2026, confirmation must warn and require explicit acknowledgment when any effective hourly rate falls below legal minimum.

## Scope

### In Scope

- Add minimum-wage constants for KR 2026 (`10,630 KRW/hour`, effective `2026-01-01`).
- Enhance payroll preview response with minimum-wage warnings.
- Add payroll confirm guard requiring `acknowledgeMinWageWarning=true` for below-minimum cases.
- Append audit entry when minimum-wage warning is acknowledged.
- Add admin endpoint to expose current minimum-wage policy.
- Add e2e coverage for warning, confirm guard, acknowledgment path, and policy endpoint.

### Out of Scope

- Historical payroll backfill or revalidation of existing confirmed runs.
- Multi-country/minimum-wage policy versioning beyond current KR 2026 constant.

## API and Event Changes

- Endpoints:
  - `POST /api/payroll/runs/preview` response now includes `warnings`.
  - `POST /api/payroll/runs/{runId}/confirm` now enforces minimum-wage acknowledgment guard.
  - `GET /api/admin/payroll/minimum-wage` added.
- Audit actions:
  - `payroll.minimum_wage_warning_acknowledged` (new)
- Events published:
  - none added

## Test Plan

- `scripts/tests/e2e-wi0937-minimum-wage-guard.test.ts`
  - preview below minimum wage returns warning
  - confirm without acknowledgment returns `400`
  - confirm with acknowledgment returns `200` and appends audit
  - preview above minimum wage returns no warning
  - admin minimum-wage endpoint returns current policy values

## Rollback Plan

- Revert minimum-wage guard and warning payload additions in payroll service and routes.
- Remove admin minimum-wage route.
- Remove WI-0937 e2e test and audit action usage.
