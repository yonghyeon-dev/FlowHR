import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeApiHelpers = readUtf8("src", "app", "employee", "page-api-helpers.ts");
  const employeeMutationRuntime = readUtf8(
    "src",
    "app",
    "employee",
    "page-mutation-runtime.ts"
  );
  const workItem = readUtf8("work-items", "WI-0375-employee-api-helper-extraction.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from "@\/app\/employee\/page-mutation-runtime";/);
  assert.match(employeePage, /const \{ mutationActions, clearLogs \} = buildEmployeeMutationRuntime\(\{/);
  assert.doesNotMatch(employeePage, /headers\["x-actor-role"\] = "employee";/);
  assert.doesNotMatch(employeePage, /const raw = await response\.text\(\);/);

  assert.match(employeeMutationRuntime, /import \{ performEmployeeApiCall \} from "@\/app\/employee\/page-api-helpers";/);
  assert.match(employeeMutationRuntime, /const \{ response, body, log \} = await performEmployeeApiCall\(/);
  assert.match(employeeMutationRuntime, /setLogs\(\(previousLogs\) => \[log, \.\.\.previousLogs\]\);/);

  assert.match(employeeApiHelpers, /export async function performEmployeeApiCall/);
  assert.match(employeeApiHelpers, /buildEmployeeRequestHeaders/);
  assert.match(employeeApiHelpers, /headers\["x-actor-role"\] = "employee";/);
  assert.match(employeeApiHelpers, /at: new Date\(\)\.toLocaleString\(input\.runtimeLocale\),/);

  assert.match(workItem, /WI-0375/i);
  assert.match(workItem, /api helper extraction/i);
  assert.match(roadmap, /WI-0375/i);
}

run()
  .then(() => {
    console.log("e2e-wi0375-employee-api-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
