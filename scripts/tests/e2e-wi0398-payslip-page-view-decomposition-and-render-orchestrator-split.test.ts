import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const payslipHelpers = readUtf8("src", "app", "employee", "payslips", "page-helpers.ts");
  const payslipLocaleHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const peoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0398-payslip-page-view-decomposition-and-render-orchestrator-split.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    payslipPage,
    /import \{ EmployeePayslipsPageView \} from "@\/app\/employee\/payslips\/page-view";/
  );
  assert.match(payslipPage, /return \(\s*<EmployeePayslipsPageView[\s\S]*\/>\s*\);/);
  assert.ok(countLines(payslipPage) < 900, "employee payslips page should stay under 900 lines");

  assert.match(payslipView, /id="payslip-search-sort"/);
  assert.match(payslipView, /id="status-feedback"/);
  assert.match(payslipView, /id="compare-view"/);
  assert.match(payslipView, /resolvePayslipRunStateLabel\(selectedRun\.state, isKoLocale\)/);

  assert.match(payslipHelpers, /export function buildCompareMetrics\(/);
  assert.match(payslipLocaleHelpers, /export function resolvePayslipPageCopy\(isKoLocale: boolean\)/);

  assert.ok(countLines(peoplePage) < 500, "admin people page should remain under 500 lines");

  assert.match(workItem, /WI-0398/i);
  assert.match(workItem, /payslip|page-view|decomposition|orchestrator/i);
  assert.match(roadmap, /WI-0398/i);
}

run()
  .then(() => {
    console.log("e2e-wi0398-payslip-page-view-decomposition-and-render-orchestrator-split.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
