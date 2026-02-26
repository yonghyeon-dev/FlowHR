# WI-0516: Scheduling Anomaly Auto Action Notification Helper Extraction Line Budget Phase 11

## Summary
- Goal: slim `executeScheduleAnomalyIncidentAutoAction` by extracting auto-action executed notification + 실패 감사 분기를 helper로 이동한다.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-incident-auto-action-helpers.ts`
  - `scripts/tests/e2e-wi0516-scheduling-anomaly-auto-action-notification-helper-extraction-line-budget-phase11.test.ts`
  - `ROADMAP.md`

## Delivery
- Extended `anomaly-incident-auto-action-helpers.ts` with:
  - `notifyScheduleAnomalyIncidentAutoActionExecution`
  - event item projection helper for bounded payload (top 50)
- Rewired `executeScheduleAnomalyIncidentAutoAction` to delegate notification + notify-failure audit branching.
- Reduced `scheduling/service.ts` line count:
  - 3794 -> 3771

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0515-scheduling-anomaly-read-helper-extraction-line-budget-phase10.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0516-scheduling-anomaly-auto-action-notification-helper-extraction-line-budget-phase11.test.ts`
- [x] `npm.cmd run typecheck`
