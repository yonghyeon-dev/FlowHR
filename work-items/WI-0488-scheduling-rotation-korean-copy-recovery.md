# WI-0488: Scheduling Rotation Korean Copy Recovery

## Summary
- Goal: fix mojibake recommendation copy in scheduling rotation-balance report so Korean user surface and audit payload stay readable.
- Scope:
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0057-scheduling-rotation-balance-report.test.ts`
  - `scripts/tests/e2e-wi0488-scheduling-rotation-korean-copy-recovery.test.ts`
  - `ROADMAP.md`

## Delivery
- Replaced six corrupted recommendation strings in `listWorkScheduleRotationBalance(...)` with normalized Korean copy.
- Strengthened runtime e2e assertion in `e2e-wi0057` to verify exact IMBALANCED recommendation messages.
- Added `e2e-wi0488` regression guard to lock recovered strings and block mojibake token reintroduction.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0057-scheduling-rotation-balance-report.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0488-scheduling-rotation-korean-copy-recovery.test.ts`
- [x] `npm.cmd run typecheck`
