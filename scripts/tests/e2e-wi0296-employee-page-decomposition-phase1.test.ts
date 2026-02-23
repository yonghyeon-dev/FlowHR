import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeePageTypes = readUtf8("src", "app", "employee", "page-types.ts");
  const employeePageHelpers = readUtf8("src", "app", "employee", "page-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0296-employee-page-decomposition-phase1.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from \"@\/app\/employee\/page-types\"/);
  assert.match(employeePage, /from \"@\/app\/employee\/page-helpers\"/);

  assert.doesNotMatch(employeePage, /^type ApiLog =/m);
  assert.doesNotMatch(employeePage, /^type LeaveRequestDto =/m);
  assert.doesNotMatch(employeePage, /^function isDevToolsEnabled\(\)/m);
  assert.doesNotMatch(employeePage, /^function sortRequestRowsByOption\(/m);
  assert.doesNotMatch(employeePage, /^function matchesRequestSearch\(/m);

  assert.match(employeePageTypes, /export type ApiLog =/);
  assert.match(employeePageTypes, /export type LeaveRequestDto =/);
  assert.match(employeePageTypes, /export type RequestSearchRow =/);

  assert.match(employeePageHelpers, /export function isDevToolsEnabled\(\)/);
  assert.match(employeePageHelpers, /export function sortRequestRowsByOption\(/);
  assert.match(employeePageHelpers, /export function matchesRequestSearch\(/);
  assert.match(employeePageHelpers, /export function estimateLeaveRequestedDays\(/);

  assert.match(workItem, /WI-0296/i);
  assert.match(workItem, /decomposition/i);
  assert.match(roadmap, /WI-0296/i);
}

run()
  .then(() => {
    console.log("e2e-wi0296-employee-page-decomposition-phase1.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
