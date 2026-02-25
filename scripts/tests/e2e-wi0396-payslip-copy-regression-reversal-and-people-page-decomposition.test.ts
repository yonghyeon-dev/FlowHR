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
  const peoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const peopleView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const peopleHelpers = readUtf8("src", "app", "admin", "people", "page-helpers.ts");
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipDerivedState = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "use-payslip-derived-state.ts"
  );
  const payslipLocaleHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const payslipHelpers = readUtf8("src", "app", "employee", "payslips", "page-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0396-payslip-copy-regression-reversal-and-people-page-decomposition.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(peoplePage, /import \{ AdminPeoplePageView \} from "@\/app\/admin\/people\/page-view";/);
  assert.match(peoplePage, /return \(\s*<AdminPeoplePageView[\s\S]*\/>\s*\);/);
  assert.ok(countLines(peoplePage) < 500, "admin people page should stay under 500 lines");

  assert.match(peopleView, /id="directory-filters"/);
  assert.match(peopleView, /id="org-chart"/);
  assert.match(peopleView, /id="employee-compare"/);
  assert.match(peopleView, /id="employee-history"/);

  assert.match(peopleHelpers, /export function filterEmployees\(input: FilterEmployeesInput\)/);
  assert.match(peopleHelpers, /export function buildOrgTree\(input: BuildOrgTreeInput\): OrgTreeNode\[]/);
  assert.match(peopleHelpers, /export function buildCompareRows\(input: BuildCompareRowsInput\): CompareRow\[]/);

  assert.match(payslipDerivedState, /resolveCompareInsightTitle\(isKoLocale\)/);
  assert.match(payslipDerivedState, /resolveCompareInsightAriaLabel\(isKoLocale\)/);
  assert.match(payslipDerivedState, /formatCompareWindowLabel\(selectedLabel, compareLabel, isKoLocale\)/);
  assert.doesNotMatch(
    payslipPage,
    /const compareInsightTitle = isKoLocale \? "전월 대비 설명" : "Month-over-month explanation";/
  );
  assert.doesNotMatch(
    payslipPage,
    /const compareInsightAriaLabel = isKoLocale[\s\S]*\? "전월 대비 설명 카드"/
  );
  assert.ok(countLines(payslipPage) < 1300, "payslip page should stay bounded after helper extraction");

  assert.match(payslipLocaleHelpers, /export function resolveCompareInsightTitle\(isKoLocale: boolean\)/);
  assert.match(payslipLocaleHelpers, /export function resolveCompareInsightAriaLabel\(isKoLocale: boolean\)/);
  assert.match(payslipLocaleHelpers, /export function formatCompareWindowLabel\(/);
  assert.match(payslipHelpers, /export function buildCompareMetrics\(/);

  assert.match(workItem, /WI-0396/i);
  assert.match(workItem, /payslip|people|decomposition|역행|500/i);
  assert.match(roadmap, /WI-0396/i);
}

run()
  .then(() => {
    console.log("e2e-wi0396-payslip-copy-regression-reversal-and-people-page-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
