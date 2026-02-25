# WI-0463: Scheduling Incident Read-Model Helper Extraction (Line Budget 4800)

## Summary
- Goal: Reduce `src/features/scheduling/service.ts` by extracting anomaly-incident read-model and persistence orchestration helpers.
- Scope:
  - Extract incident read-model conversion/upsert helpers.
  - Extract incident audit/store read fallback and backfill helpers.
  - Keep anomaly incident lifecycle/list/SLA/reconcile behavior unchanged.

## Delivery
- Added `src/features/scheduling/incident-read-model-helpers.ts`
  - Extracted helpers:
    - Auto-assign input normalizers
    - SLA status weight + read-model clone
    - Entity/read-model mapping + upsert input builder
    - Audit projection loader + store fallback/backfill
    - Shared incident list/get read-model orchestrators
- Updated `src/features/scheduling/service.ts`
  - Removed inline incident read-model/store/audit helper block.
  - Rewired lifecycle/list/SLA/reconcile/read paths to helper imports.
  - `service.ts` line count reduced to <= 4800 budget.
- Added `scripts/tests/e2e-wi0463-scheduling-incident-read-model-helper-extraction-line-budget-4800.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0463-scheduling-incident-read-model-helper-extraction-line-budget-4800.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0460-scheduling-anomaly-automation-helper-extraction-line-budget-5100.test.ts`
