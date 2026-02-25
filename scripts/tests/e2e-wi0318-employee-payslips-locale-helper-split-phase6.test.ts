import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipPageView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const payslipFilterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const payslipRunListPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-run-list-panel.tsx"
  );
  const payslipSurface = `${payslipPage}\n${payslipPageView}\n${payslipFilterPanel}\n${payslipRunListPanel}`;
  const payslipLocaleHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-helpers.ts"
  );
  const payslipLocaleRuntime = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-runtime.ts"
  );
  const payslipSearchSortCopy = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-search-sort-copy.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0318-employee-payslips-locale-helper-split-phase6.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipPage, /from "@\/app\/employee\/payslips\/page-locale-helpers"/);
  assert.match(payslipPage, /resolvePayslipSearchSortCopy\(isKoLocale\)/);
  assert.match(payslipSurface, /formatDateTime\(run\.periodStart\)/);
  assert.match(payslipPageView, /formatKrw\(selectedRun\.netPayKrw\)/);

  assert.doesNotMatch(payslipSurface, /function resolveRuntimeLocale\(\)/);
  assert.doesNotMatch(payslipSurface, /function formatDateTime\(value: string \| null\)/);
  assert.doesNotMatch(payslipSurface, /function formatKrw\(value: number \| null\)/);
  assert.doesNotMatch(payslipSurface, /function formatDateOnly\(value: string \| null\)/);

  assert.match(payslipLocaleHelpers, /from "@\/app\/employee\/payslips\/page-locale-copy"/);
  assert.match(payslipLocaleHelpers, /from "@\/app\/employee\/payslips\/page-locale-runtime"/);
  assert.match(payslipLocaleHelpers, /resolveRuntimeLocale,/);
  assert.match(payslipLocaleHelpers, /formatDateTime,/);
  assert.match(payslipLocaleHelpers, /formatKrw,/);
  assert.match(payslipLocaleHelpers, /formatDateOnly,/);
  assert.match(payslipLocaleHelpers, /resolvePayslipSearchSortCopy/);

  assert.match(payslipLocaleRuntime, /export function resolveRuntimeLocale\(\)/);
  assert.match(payslipLocaleRuntime, /export function formatDateTime\(value: string \| null\)/);
  assert.match(payslipLocaleRuntime, /export function formatKrw\(value: number \| null\)/);
  assert.match(payslipLocaleRuntime, /export function formatDateOnly\(value: string \| null\)/);
  assert.match(payslipSearchSortCopy, /export function resolvePayslipSearchSortCopy\(isKoLocale: boolean\)/);

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
