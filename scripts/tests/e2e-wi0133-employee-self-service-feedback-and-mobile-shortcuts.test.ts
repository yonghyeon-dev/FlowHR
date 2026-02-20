import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(employeePage, /요청 상태 피드백/, "employee portal should include request feedback panel");
  assert.match(employeePage, /실패 원인 가시화/, "employee portal should include visible failure cause section");
  assert.match(employeePage, /모바일 단축 흐름/, "employee portal should include mobile shortcut flow panel");
  assert.match(employeePage, /requestFailureCauses/, "employee portal should compute request failure causes");
  assert.match(employeePage, /copyFailureCause/, "employee portal should support failure cause copy action");

  assert.match(employeeLayout, /href="\/employee#request-feedback"/, "employee navigation should link to feedback panel");
  assert.match(employeeLayout, /href="\/employee#mobile-shortcuts"/, "employee navigation should link to mobile shortcut panel");

  assert.match(globalCss, /\.feedback-kpi-grid/, "request feedback KPI styles should exist");
  assert.match(globalCss, /\.failure-cause-list/, "failure cause list styles should exist");
  assert.match(globalCss, /\.mobile-shortcut-grid/, "mobile shortcut grid styles should exist");
  assert.match(globalCss, /\.mobile-shortcut-feedback/, "mobile shortcut feedback styles should exist");
}

run();
console.log("e2e-wi0133-employee-self-service-feedback-and-mobile-shortcuts.test passed");
