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
  const deliveryHelpers = readUtf8("src", "features", "leave", "promotion-delivery-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0457-leave-promotion-delivery-helper-extraction-line-budget-3000.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(leaveService, /from "@\/features\/leave\/promotion-delivery-helpers"/);
  assert.match(leaveService, /resolvePromotionWebhookConfig/);
  assert.match(leaveService, /resolvePromotionEmailTemplateConfig/);
  assert.match(leaveService, /sendPromotionWebhook/);
  assert.match(leaveService, /sendPromotionEmailTemplate/);
  assert.doesNotMatch(leaveService, /function resolvePromotionWebhookConfig\(/);
  assert.doesNotMatch(leaveService, /function resolvePromotionEmailTemplateConfig\(/);
  assert.doesNotMatch(leaveService, /async function sendPromotionWebhook\(/);
  assert.doesNotMatch(leaveService, /async function sendPromotionEmailTemplate\(/);
  assert.ok(
    countLines(leaveService) <= 3000,
    `leave/service.ts should stay <= 3000 lines (current: ${countLines(leaveService)})`
  );

  assert.match(deliveryHelpers, /export function resolvePromotionWebhookConfig\(/);
  assert.match(deliveryHelpers, /export function resolvePromotionEmailTemplateConfig\(/);
  assert.match(deliveryHelpers, /export async function sendPromotionWebhook\(/);
  assert.match(deliveryHelpers, /export async function sendPromotionEmailTemplate\(/);
  assert.match(deliveryHelpers, /export function buildPromotionNoticeMessage\(/);

  assert.match(workItem, /WI-0457/i);
  assert.match(workItem, /leave|promotion|delivery|helper|extraction|line budget/i);
  assert.match(roadmap, /WI-0457/i);
}

run()
  .then(() => {
    console.log("e2e-wi0457-leave-promotion-delivery-helper-extraction-line-budget-3000.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
