import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipsPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipHelpers = readUtf8("src", "app", "employee", "payslips", "page-helpers.ts");
  const payslipLocaleHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-0348-employee-payslips-explanation-cards-and-month-over-month-insight.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipHelpers, /buildCompareInsightCards/);
  assert.match(payslipHelpers, /type CompareInsightCard/);
  assert.match(payslipsPage, /compareInsightCards/);
  assert.match(payslipsPage, /payslip-compare-insight/);
  assert.match(payslipsPage, /resolveCompareInsightTitle\(isKoLocale\)/);
  assert.match(payslipLocaleHelpers, /Month-over-month explanation/);
  assert.match(globalsCss, /\.payslip-compare-insight/);
  assert.match(globalsCss, /\.payslip-compare-insight-grid/);

  assert.match(workItem, /WI-0348/i);
  assert.match(workItem, /month[- ]over[- ]month/i);
  assert.match(roadmap, /WI-0348/i);
}

run()
  .then(() => {
    console.log("e2e-wi0348-employee-payslips-explanation-cards-and-month-over-month-insight.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
