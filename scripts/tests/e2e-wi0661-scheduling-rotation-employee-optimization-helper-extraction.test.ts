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
  const helper = readUtf8(
    "src",
    "features",
    "scheduling",
    "rotation-employee-optimization-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0661-scheduling-rotation-employee-optimization-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/rotation-employee-optimization-helpers"/);
  assert.match(service, /return evaluateEmployeeRotationOptimization\(\{/);
  assert.match(service, /buildRotationOffsetEvaluation: \(evaluationInput\) =>/);
  assert.match(
    service,
    /listExistingSchedules: \(\{ periodStart, periodEnd, employeeId \}\) =>[\s\S]*listWorkSchedules\(context, \{/
  );
  assert.doesNotMatch(
    service,
    /async function evaluateBestRotationForEmployee[\s\S]*const periodStart = parseDateToKstBase\(input\.fromDate\);/
  );

  assert.match(helper, /export type EmployeeRotationOptimizationEvaluation</);
  assert.match(helper, /export async function evaluateEmployeeRotationOptimization</);
  assert.match(helper, /const periodStart = parseDateToKstBase\(input\.fromDate\);/);
  assert.match(helper, /sortRotationOffsetEvaluations\(evaluations\)/);

  assert.ok(
    countLines(service) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines \(current: ${countLines(service)}\)`
  );
  assert.ok(
    countLines(helper) <= 220,
    `rotation-employee-optimization-helpers.ts should stay <= 220 lines \(current: ${countLines(helper)}\)`
  );

  assert.match(workItem, /WI-0661/i);
  assert.match(workItem, /scheduling|rotation|employee|optimization|helper|extraction/i);
  assert.match(roadmap, /WI-0661/i);
}

run()
  .then(() => {
    console.log("e2e-wi0661-scheduling-rotation-employee-optimization-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
