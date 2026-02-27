# WI-0598: Scheduling Service Split Phase 2 (Anomaly Context Helper Extraction)

## Summary
- Goal: reduce `src/features/scheduling/service.ts` size and remove repeated anomaly actor/permission/tenant boilerplate.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-service-context-helpers.ts`
  - `scripts/tests/e2e-wi0598-scheduling-service-split-phase2.test.ts`
  - `work-items/WI-0598-scheduling-service-split-phase2.md`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-service-context-helpers.ts`:
  - `requireSchedulingActor`
  - `requireSchedulingWriteActor`
  - `resolveSchedulingTenantScope`
- Replaced repeated actor/permission/tenant context blocks across anomaly APIs in `service.ts`.
  - lifecycle/list/sla/escalation/auto-action/archive/replay/reconcile/read/cockpit paths now share the same context helper entrypoint.
- Reduced scheduling service line count from 3422 to 3365 while preserving behavior.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0598-scheduling-service-split-phase2.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0597-scheduling-side-effect-helper-extraction-and-contract-status-fallbacks.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0578-scheduling-anomaly-lifecycle-audit-response-helper-extraction.test.ts`
- [x] `npm.cmd run lint`
- [x] `npm.cmd run typecheck`
