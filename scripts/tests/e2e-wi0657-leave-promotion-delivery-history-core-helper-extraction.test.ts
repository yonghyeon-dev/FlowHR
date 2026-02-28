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
  const historyCoreHelpers = readUtf8(
    "src",
    "features",
    "leave",
    "promotion-delivery-history-core-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0657-leave-promotion-delivery-history-core-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(leaveService, /from "@\/features\/leave\/promotion-delivery-history-core-helpers"/);
  assert.match(leaveService, /resolvePromotionRecipientStats\(/);
  assert.match(leaveService, /normalizeRecipientEmployeeIds\(/);
  assert.match(leaveService, /persistPromotionDeliveryHistory\(context\.dataAccess\.leavePromotionDeliveries,/);

  assert.doesNotMatch(leaveService, /async function persistPromotionDeliveryHistory\(/);
  assert.doesNotMatch(leaveService, /function normalizeRecipientEmployeeIds\(/);

  assert.match(historyCoreHelpers, /export function resolvePromotionRecipientStats\(/);
  assert.match(historyCoreHelpers, /export async function persistPromotionDeliveryHistory\(/);
  assert.match(historyCoreHelpers, /export function normalizeRecipientEmployeeIds\(/);
  assert.match(historyCoreHelpers, /toPromotionDispatchRecipients\(/);
  assert.match(historyCoreHelpers, /toRecipientStatus\(/);

  assert.ok(
    countLines(leaveService) <= 2450,
    `leave/service.ts should stay <= 2450 lines (current: ${countLines(leaveService)})`
  );

  assert.match(workItem, /WI-0657/i);
  assert.match(workItem, /leave|promotion|delivery|history|core|helper|extraction|line-budget/i);
  assert.match(roadmap, /WI-0657/i);
}

run()
  .then(() => {
    console.log("e2e-wi0657-leave-promotion-delivery-history-core-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
