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
  const helpers = readUtf8("src", "features", "scheduling", "rotation-fairness-selection-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0551-scheduling-rotation-fairness-selection-helper-extraction-and-line-budget-recovery.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/rotation-fairness-selection-helpers"/);
  assert.match(service, /selectRotationFairnessRecommendations\(/);
  assert.match(service, /buildRotationFairnessAdvancedSummary\(/);
  assert.doesNotMatch(service, /function selectRotationFairnessRecommendations\(/);
  assert.doesNotMatch(service, /function buildRotationFairnessAdvancedSummary\(/);

  assert.match(helpers, /export function selectRotationFairnessRecommendations/);
  assert.match(helpers, /export function buildRotationFairnessAdvancedSummary/);

  assert.ok(
    countLines(service) <= 4000,
    `scheduling/service.ts should stay <= 4000 lines (current: ${countLines(service)})`
  );

  assert.match(workItem, /WI-0551/i);
  assert.match(workItem, /scheduling|rotation|fairness|helper|extraction|line budget|recovery/i);
  assert.match(roadmap, /WI-0551/i);
}

run()
  .then(() => {
    console.log("e2e-wi0551-scheduling-rotation-fairness-selection-helper-extraction-and-line-budget-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
