import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const adminHelpers = readUtf8("src", "app", "admin", "page-helpers.ts");
  const employeeHelpers = readUtf8("src", "app", "employee", "page-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0379-admin-employee-runtime-locale-format-guard.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminHelpers, /export function formatDateTime\(value: string \| null, runtimeLocale: string\)/);
  assert.match(employeeHelpers, /export function formatDateTime\(value: string \| null, runtimeLocale: string\)/);
  assert.doesNotMatch(adminHelpers, /runtimeLocale = "ko-KR"/);
  assert.doesNotMatch(employeeHelpers, /runtimeLocale = "ko-KR"/);

  assert.match(adminPage, /const runtimeLocale = isKoLocale \? "ko-KR" : "en-US";/);
  assert.match(employeePage, /runtimeLocale,/);
  assert.match(adminPage, /\(value: string \| null\) => formatDateTime\(value, runtimeLocale\)/);
  assert.match(employeePage, /\(value: string \| null\) => formatDateTime\(value, runtimeLocale\)/);
  assert.match(adminPage, /formatDateTime=\{formatDateTimeByLocale\}/);
  assert.match(employeePage, /formatDateTime=\{formatDateTimeByLocale\}/);

  assert.match(workItem, /WI-0379/i);
  assert.match(workItem, /runtime locale format guard/i);
  assert.match(roadmap, /WI-0379/i);
}

run()
  .then(() => {
    console.log("e2e-wi0379-admin-employee-runtime-locale-format-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
