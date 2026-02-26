# WI-0565: Scheduling Anomaly Incident Core Helper Extraction

## Summary
- Goal: isolate anomaly incident lifecycle/list/SLA normalization and payload builders from service orchestration.
- Scope:
  - `src/features/scheduling/anomaly-incident-core-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0565-scheduling-anomaly-incident-core-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added incident core helper module for:
  - lifecycle mutation normalization,
  - lifecycle update payload/history builders,
  - list/SLA audit payload builders,
  - SLA report response builder.
- Rewired lifecycle/list/SLA service flows to call extracted helper functions.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0565-scheduling-anomaly-incident-core-helper-extraction.test.ts`
