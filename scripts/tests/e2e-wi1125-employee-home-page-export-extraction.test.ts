import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-1125-employee-home-page-export-extraction.md"
  );

  assert.doesNotMatch(employeePage, /export function EmployeeSelfServicePage/);
  assert.doesNotMatch(employeePage, /export type EmployeeSelfServicePageMode/);
  assert.match(employeePage, /export default function EmployeeSelfServiceHomePage/);
  assert.match(workItem, /production deploy/i);
}

run();
console.log("e2e-wi1125-employee-home-page-export-extraction.test passed");
