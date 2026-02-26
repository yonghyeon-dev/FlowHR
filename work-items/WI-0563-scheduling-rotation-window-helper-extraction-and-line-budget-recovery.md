# WI-0563: Scheduling Rotation Window Helper Extraction and Line-Budget Recovery

## Summary
- Goal: keep scheduling service focused on orchestration by extracting rotation window builders.
- Scope:
  - `src/features/scheduling/rotation-window-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0563-scheduling-rotation-window-helper-extraction-and-line-budget-recovery.test.ts`
  - `ROADMAP.md`

## Delivery
- Extracted template window and rotation window helpers into `rotation-window-helpers.ts`.
- Rewired scheduling service to import extracted builders/types and removed duplicated local helper blocks.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0563-scheduling-rotation-window-helper-extraction-and-line-budget-recovery.test.ts`
