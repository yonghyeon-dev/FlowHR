import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const mutationRuntime = readUtf8("src", "app", "employee", "page-mutation-runtime.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0433-employee-mutation-runtime-extraction-and-line-budget-500.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from "@\/app\/employee\/page-mutation-runtime";/);
  assert.match(employeePage, /const \{ mutationActions, clearLogs \} = buildEmployeeMutationRuntime\(\{/);
  assert.doesNotMatch(employeePage, /async function callApi\(/);
  assert.doesNotMatch(employeePage, /const mutationActions = buildEmployeeMutationActions\(\{/);

  assert.match(mutationRuntime, /export function buildEmployeeMutationRuntime\(/);
  assert.match(mutationRuntime, /const \{ response, body, log \} = await performEmployeeApiCall\(/);
  assert.match(mutationRuntime, /const mutationActions = buildEmployeeMutationActions\(\{/);
  assert.match(mutationRuntime, /const clearLogs = \(\) => \{\s*setLogs\(\[\]\);/);

  const lineCount = employeePage.split(/\r?\n/).length;
  assert.ok(lineCount <= 500, `expected employee page <= 500 lines, got ${lineCount}`);

  assert.match(workItem, /WI-0433/i);
  assert.match(workItem, /employee|mutation|runtime|extraction|line budget|500/i);
  assert.match(roadmap, /WI-0433/i);
}

run()
  .then(() => {
    console.log("e2e-wi0433-employee-mutation-runtime-extraction-and-line-budget-500.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
