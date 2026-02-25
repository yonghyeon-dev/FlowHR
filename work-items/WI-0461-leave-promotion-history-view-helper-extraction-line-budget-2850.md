# WI-0461: Leave Promotion History View Helper Extraction (Line Budget 2850)

## Summary
- Goal: Reduce `src/features/leave/service.ts` by extracting promotion-history view types and mapping helpers.
- Scope:
  - Extract delivery/recipient/target view types.
  - Extract promotion history mapping/retry-status helpers.
  - Keep leave promotion dispatch/retry behavior unchanged.

## Delivery
- Added `src/features/leave/promotion-history-views.ts`
  - Types:
    - `PromotionDeliveryStatus`
    - `PromotionRecipientStatus`
    - `PromotionTargetSnapshot`
    - `PromotionDeliverySummaryView`
    - `PromotionDeliveryRecipientView`
  - Helpers:
    - `toPromotionTargetSnapshots`
    - `toPromotionTargetSnapshotsFromRecipients`
    - `toPromotionDispatchRecipients`
    - `toPromotionDeliverySummaryView`
    - `toPromotionDeliveryRecipientView`
    - `toRetryCountByEmployeeId`
    - `toRecipientStatus`
- Updated `src/features/leave/service.ts`
  - Removed inline duplicated view/helper blocks and switched to imports.
  - Line count reduced to 2740 and guarded to <= 2850.
- Added `scripts/tests/e2e-wi0461-leave-promotion-history-view-helper-extraction-line-budget-2850.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0461-leave-promotion-history-view-helper-extraction-line-budget-2850.test.ts`
