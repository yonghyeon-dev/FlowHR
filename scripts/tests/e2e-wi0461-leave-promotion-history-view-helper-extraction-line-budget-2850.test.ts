import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const leaveService = readUtf8("src", "features", "leave", "service.ts");
  const promotionHistoryViews = readUtf8(
    "src",
    "features",
    "leave",
    "promotion-history-views.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0461-leave-promotion-history-view-helper-extraction-line-budget-2850.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(leaveService, /from "@\/features\/leave\/promotion-history-views"/);
  assert.match(leaveService, /toPromotionTargetSnapshots/);
  assert.match(leaveService, /toPromotionDeliverySummaryView/);
  assert.match(leaveService, /toPromotionDeliveryRecipientView/);
  assert.match(leaveService, /toRetryCountByEmployeeId/);
  assert.match(leaveService, /toRecipientStatus/);

  assert.doesNotMatch(leaveService, /function toPromotionTargetSnapshots\(/);
  assert.doesNotMatch(leaveService, /function toPromotionDeliverySummaryView\(/);
  assert.doesNotMatch(leaveService, /function toPromotionDeliveryRecipientView\(/);
  assert.doesNotMatch(leaveService, /function toRetryCountByEmployeeId\(/);
  assert.doesNotMatch(leaveService, /function toRecipientStatus\(/);
  assert.ok(
    countLines(leaveService) <= 2850,
    `leave/service.ts should stay <= 2850 lines (current: ${countLines(leaveService)})`
  );

  assert.match(promotionHistoryViews, /export type PromotionTargetSnapshot = \{/);
  assert.match(promotionHistoryViews, /export type PromotionDeliverySummaryView = \{/);
  assert.match(promotionHistoryViews, /export type PromotionDeliveryRecipientView = \{/);
  assert.match(promotionHistoryViews, /export function toPromotionTargetSnapshots\(/);
  assert.match(promotionHistoryViews, /export function toPromotionDeliverySummaryView\(/);
  assert.match(promotionHistoryViews, /export function toPromotionDeliveryRecipientView\(/);
  assert.match(promotionHistoryViews, /export function toRetryCountByEmployeeId\(/);
  assert.match(promotionHistoryViews, /export function toRecipientStatus\(/);

  assert.match(workItem, /WI-0461/i);
  assert.match(
    workItem,
    /leave|promotion|history|view|helper|extraction|line budget/i
  );
  assert.match(roadmap, /WI-0461/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0461-leave-promotion-history-view-helper-extraction-line-budget-2850.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
