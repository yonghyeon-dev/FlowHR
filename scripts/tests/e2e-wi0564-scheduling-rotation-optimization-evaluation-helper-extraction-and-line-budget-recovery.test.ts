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
  const helpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "rotation-optimization-evaluation-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0564-scheduling-rotation-optimization-evaluation-helper-extraction-and-line-budget-recovery.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/rotation-optimization-evaluation-helpers"/);
  assert.match(service, /buildRotationOffsetEvaluation\(/);
  assert.match(service, /sortRotationOffsetEvaluations\(/);
  assert.doesNotMatch(service, /function evaluateRotationOffset\(/);

  assert.match(helpers, /export type RotationOffsetEvaluation</);
  assert.match(helpers, /export function buildRotationOffsetEvaluation/);
  assert.match(helpers, /export function sortRotationOffsetEvaluations/);

  assert.ok(
    countLines(service) <= 4000,
    `scheduling/service.ts should stay <= 4000 lines (current: ${countLines(service)})`
  );

  assert.match(workItem, /WI-0564/i);
  assert.match(
    workItem,
    /scheduling|rotation|optimization|evaluation|helper|extraction|line-budget|recovery/i
  );
  assert.match(roadmap, /WI-0564/i);
}

run()
  .then(() => {
    console.log("e2e-wi0564-scheduling-rotation-optimization-evaluation-helper-extraction-and-line-budget-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
