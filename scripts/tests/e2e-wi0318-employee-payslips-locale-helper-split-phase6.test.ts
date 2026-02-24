import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipLocaleHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0318-employee-payslips-locale-helper-split-phase6.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipPage, /from "@\/app\/employee\/payslips\/page-locale-helpers"/);
  assert.match(payslipPage, /resolvePayslipSearchSortCopy\(isKoLocale\)/);
  assert.match(payslipPage, /formatDateTime\(run\.periodStart\)/);
  assert.match(payslipPage, /formatKrw\(selectedRun\.netPayKrw\)/);

  assert.doesNotMatch(payslipPage, /function resolveRuntimeLocale\(\)/);
  assert.doesNotMatch(payslipPage, /function formatDateTime\(value: string \| null\)/);
  assert.doesNotMatch(payslipPage, /function formatKrw\(value: number \| null\)/);
  assert.doesNotMatch(payslipPage, /function formatDateOnly\(value: string \| null\)/);

  assert.match(payslipLocaleHelpers, /export function resolveRuntimeLocale\(\)/);
  assert.match(payslipLocaleHelpers, /export function formatDateTime\(value: string \| null\)/);
  assert.match(payslipLocaleHelpers, /export function formatKrw\(value: number \| null\)/);
  assert.match(payslipLocaleHelpers, /export function formatDateOnly\(value: string \| null\)/);
  assert.match(payslipLocaleHelpers, /export function resolvePayslipSearchSortCopy\(isKoLocale: boolean\)/);

  const payslipPageLineCount = payslipPage.split(/\r?\n/).length;
  assert.ok(
    payslipPageLineCount < 1500,
    `expected employee payslips page line count below 1500, got ${payslipPageLineCount}`
  );

  assert.match(workItem, /WI-0318/i);
  assert.match(workItem, /locale helper split|decomposition/i);
  assert.match(roadmap, /WI-0318/i);
}

run()
  .then(() => {
    console.log("e2e-wi0318-employee-payslips-locale-helper-split-phase6.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
