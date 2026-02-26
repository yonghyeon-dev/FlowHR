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
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const helpers = readUtf8("src", "features", "scheduling", "rotation-window-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0563-scheduling-rotation-window-helper-extraction-and-line-budget-recovery.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/rotation-window-helpers"/);
  assert.match(service, /buildRotationWindowsForTemplates\(/);
  assert.match(service, /buildTemplateRangeWindows\(/);
  assert.match(service, /rotateTemplatesByOffset\(/);
  assert.match(service, /buildScheduleWindowFromTemplateDate\(/);

  assert.doesNotMatch(service, /function rotateTemplatesByOffset\(/);
  assert.doesNotMatch(service, /function buildRotationWindowsForTemplates\(/);
  assert.doesNotMatch(service, /function buildTemplateRangeWindows\(/);
  assert.doesNotMatch(service, /function buildScheduleWindowFromTemplateDate\(/);

  assert.match(helpers, /export type GeneratedScheduleWindow = \{/);
  assert.match(helpers, /export function rotateTemplatesByOffset/);
  assert.match(helpers, /export function buildScheduleWindowFromTemplateDate/);
  assert.match(helpers, /export function buildRotationWindowsForTemplates/);
  assert.match(helpers, /export function buildTemplateRangeWindows/);

  assert.ok(
    countLines(service) <= 4000,
    `scheduling/service.ts should stay <= 4000 lines (current: ${countLines(service)})`
  );

  assert.match(workItem, /WI-0563/i);
  assert.match(workItem, /scheduling|rotation|window|helper|extraction|line-budget|recovery/i);
  assert.match(roadmap, /WI-0563/i);
}

run()
  .then(() => {
    console.log("e2e-wi0563-scheduling-rotation-window-helper-extraction-and-line-budget-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
