import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipsPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const runtimeHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-runtime.ts");
  const barrel = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0443-payslips-runtime-locale-lock-for-consistent-i18n-rendering.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(runtimeHelpers, /let runtimeLocaleOverride: string \| null = null;/);
  assert.match(runtimeHelpers, /export function setPayslipRuntimeLocale\(value: string \| null\)/);
  assert.match(runtimeHelpers, /if \(runtimeLocaleOverride\) \{\s*return runtimeLocaleOverride;/);

  assert.match(barrel, /setPayslipRuntimeLocale/);

  assert.match(payslipsPage, /setPayslipRuntimeLocale\(runtimeLocale\)/);
  assert.match(payslipsPage, /setPayslipRuntimeLocale\(null\)/);

  assert.match(workItem, /WI-0443/i);
  assert.match(workItem, /payslip|locale|runtime|i18n/i);
  assert.match(roadmap, /WI-0443/i);
}

run()
  .then(() => {
    console.log("e2e-wi0443-payslips-runtime-locale-lock.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
