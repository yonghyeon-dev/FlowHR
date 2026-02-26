import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  formatEmployeeIdForLocaleDisplay,
  getLocalizedEmployeeIdInputDefault,
  normalizeEmployeeIdForApi,
  normalizeEmployeeIdForLocaleInput
} from "@/lib/i18n/employee-id-locale";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipApi = readUtf8("src", "app", "employee", "payslips", "use-payslip-api.ts");
  const payslipDerivedState = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "use-payslip-derived-state.ts"
  );
  const payslipDetailPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-detail-panel.tsx"
  );
  const workItem = readUtf8("work-items", "WI-0492-payslips-employee-id-locale-normalization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.equal(getLocalizedEmployeeIdInputDefault("ko"), "직원-1001");
  assert.equal(getLocalizedEmployeeIdInputDefault("en"), "EMP-1001");
  assert.equal(normalizeEmployeeIdForApi("직원-1200", "ko"), "EMP-1200");
  assert.equal(normalizeEmployeeIdForApi("EMP-1200", "ko"), "EMP-1200");
  assert.equal(normalizeEmployeeIdForLocaleInput("EMP-1200", "ko"), "직원-1200");
  assert.equal(normalizeEmployeeIdForLocaleInput("직원-1200", "en"), "EMP-1200");
  assert.equal(formatEmployeeIdForLocaleDisplay("EMP-1200", "ko"), "직원-1200");

  assert.match(payslipPage, /getLocalizedEmployeeIdInputDefault\(locale\)/);
  assert.match(payslipPage, /normalizeEmployeeIdForLocaleInput\(value, locale\)/);
  assert.match(payslipPage, /normalizeEmployeeIdForApi\(employeeLabelSource, locale\)/);
  assert.match(payslipApi, /employeeIdForApi/);
  assert.match(payslipApi, /defaultEmployeeIdForApi/);
  assert.match(payslipDerivedState, /formatEmployeeIdForLocaleDisplay/);
  assert.match(payslipDerivedState, /normalizeEmployeeIdForApi/);
  assert.match(payslipDetailPanel, /formatEmployeeIdForLocaleDisplay/);
  assert.match(workItem, /WI-0492/i);
  assert.match(workItem, /payslips|employee-id|locale|normalization/i);
  assert.match(roadmap, /WI-0492/i);
}

run()
  .then(() => {
    console.log("e2e-wi0492-payslips-employee-id-locale-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
