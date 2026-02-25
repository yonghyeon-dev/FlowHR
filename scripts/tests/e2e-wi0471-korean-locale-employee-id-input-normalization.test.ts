import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  defaultEmployeeIdForApi,
  getLocalizedEmployeeIdInputDefault,
  normalizeEmployeeIdForApi,
  normalizeEmployeeIdForLocaleInput
} from "@/lib/i18n/employee-id-locale";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const payslipReceiptConsole = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "PayslipReceiptConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0471-korean-locale-employee-id-input-normalization.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.equal(defaultEmployeeIdForApi, "EMP-1001");
  assert.equal(getLocalizedEmployeeIdInputDefault("ko"), "직원-1001");
  assert.equal(getLocalizedEmployeeIdInputDefault("en"), "EMP-1001");

  assert.equal(normalizeEmployeeIdForApi("직원-1001", "ko"), "EMP-1001");
  assert.equal(normalizeEmployeeIdForApi("직원-1001", "en"), "EMP-1001");
  assert.equal(normalizeEmployeeIdForApi("emp-1001", "ko"), "EMP-1001");
  assert.equal(normalizeEmployeeIdForApi("EMP-1001", "en"), "EMP-1001");

  assert.equal(normalizeEmployeeIdForLocaleInput("EMP-1001", "ko"), "직원-1001");
  assert.equal(normalizeEmployeeIdForLocaleInput("직원-1001", "en"), "EMP-1001");

  for (const source of [withholdingConsole, payslipReceiptConsole]) {
    assert.match(source, /getLocalizedEmployeeIdInputDefault/);
    assert.match(source, /normalizeEmployeeIdForApi/);
    assert.match(source, /normalizeEmployeeIdForLocaleInput/);
    assert.doesNotMatch(source, /useStickyStringState\("flowhr:ctx:employeeId",\s*"EMP-1001"\)/);
    assert.doesNotMatch(source, /x-actor-id"\] = employeeId\.trim\(\) \|\| "EMP-1001"/);
  }

  assert.match(workItem, /WI-0471/i);
  assert.match(workItem, /employee id|locale|korean|normalization/i);
  assert.match(roadmap, /WI-0471/i);
}

run()
  .then(() => {
    console.log("e2e-wi0471-korean-locale-employee-id-input-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
