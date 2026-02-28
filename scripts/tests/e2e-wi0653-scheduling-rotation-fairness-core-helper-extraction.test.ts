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
  const helper = readUtf8("src", "features", "scheduling", "rotation-fairness-core-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0653-scheduling-rotation-fairness-core-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/rotation-fairness-core-helpers"/);
  assert.match(service, /normalizeTemplateIds\(/);
  assert.match(service, /normalizeRotationFairnessAdvancedConstraints\(/);
  assert.match(service, /evaluateRotationFairnessAdvancedScore\(/);
  assert.match(service, /deriveRotationBalanceGrade\(/);
  assert.match(service, /plannedMinutesForSchedule\(/);
  assert.match(service, /weekdaySetKey\(/);

  assert.match(helper, /export function normalizeTemplateIds\(/);
  assert.match(helper, /export function normalizeEmployeeIds\(/);
  assert.match(helper, /export function normalizeRotationFairnessGlobalConstraints\(/);
  assert.match(helper, /export function normalizeRotationFairnessAdvancedConstraints\(/);
  assert.match(helper, /export function evaluateRotationFairnessAdvancedScore\(/);
  assert.match(helper, /export function deriveRotationBalanceGrade\(/);
  assert.match(helper, /export function weekdaySetKey\(/);

  assert.doesNotMatch(service, /function normalizeTemplateIds\(/);
  assert.doesNotMatch(service, /function normalizeEmployeeIds\(/);
  assert.doesNotMatch(service, /function normalizeRotationFairnessGlobalConstraints\(/);
  assert.doesNotMatch(service, /function normalizeRotationFairnessAdvancedConstraints\(/);
  assert.doesNotMatch(service, /function evaluateRotationFairnessAdvancedScore\(/);
  assert.doesNotMatch(service, /function plannedMinutesForSchedule\(/);
  assert.doesNotMatch(service, /function plannedMinutesForGeneratedWindow\(/);
  assert.doesNotMatch(service, /function weekdaySetKey\(/);

  assert.ok(
    countLines(service) <= 3000,
    `scheduling/service.ts should stay <= 3000 lines (current: ${countLines(service)})`
  );
  assert.ok(
    countLines(helper) <= 460,
    `rotation-fairness-core-helpers.ts should stay <= 460 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0653/i);
  assert.match(workItem, /scheduling|rotation|fairness|core|helper|extraction/i);
  assert.match(roadmap, /WI-0653/i);
}

run()
  .then(() => {
    console.log("e2e-wi0653-scheduling-rotation-fairness-core-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
