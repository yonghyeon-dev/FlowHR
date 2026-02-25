# WI-0464: Leave Policy/Time Helper Extraction (Line Budget 2600)

## Summary
- Goal: Reduce `src/features/leave/service.ts` by extracting policy/time calculation helpers and defaults.
- Scope:
  - Extract Seoul-day/date utilities and leave math helpers.
  - Extract policy default constants, policy resolver, and request constraint helpers.
  - Keep leave request/accrual/promotion behavior unchanged.

## Delivery
- Added `src/features/leave/policy-time-helpers.ts`
  - Extracted constants:
    - `SEOUL_OFFSET_MS`, `DAY_MS`, `FULL_DAY_HOURS`
    - Leave policy default constants (`DEFAULT_*`)
  - Extracted helpers:
    - `toSeoulDayIndex`, `fromSeoulDayIndex`, `formatSeoulDay`, `resolveSeoulYearEnd`
    - `calculateLeaveDays`, `calculateProRatedAnnualGrantDays`, `roundTo2`
    - `resolvePolicyRules`, `renderPromotionMessageTemplate`
    - `calculateRequestedLeave`, `assertPolicyRequestConstraints`, `ensureValidPeriod`
- Updated `src/features/leave/service.ts`
  - Removed inline policy/time helper block and switched to helper imports.
  - `leave/service.ts` line count reduced to <= 2600 budget.
- Added `scripts/tests/e2e-wi0464-leave-policy-time-helper-extraction-line-budget-2600.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0464-leave-policy-time-helper-extraction-line-budget-2600.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0461-leave-promotion-history-view-helper-extraction-line-budget-2850.test.ts`
