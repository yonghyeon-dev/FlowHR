# WI-0457: Leave Promotion Delivery Helper Extraction (Line Budget 3000)

## Summary
- Goal: Keep `src/features/leave/service.ts` under 3000 lines by extracting promotion-delivery helper logic.
- Scope:
  - Extract webhook/email template config resolver and sender helpers.
  - Extract promotion notice message builder.
  - Keep delivery behavior and payload contracts unchanged.

## Delivery
- Added `src/features/leave/promotion-delivery-helpers.ts`
  - Delivery provider/config types
  - `resolvePromotionWebhookProvider`, `resolvePromotionWebhookConfig`
  - `resolvePromotionEmailTemplateConfig`, `buildPromotionNoticeMessage`
  - `sendPromotionWebhook`, `sendPromotionEmailTemplate`
- Updated `src/features/leave/service.ts`
  - Replaced in-file helper implementations with imports.
  - Line count reduced to 2928.
- Added `scripts/tests/e2e-wi0457-leave-promotion-delivery-helper-extraction-line-budget-3000.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0457-leave-promotion-delivery-helper-extraction-line-budget-3000.test.ts`
