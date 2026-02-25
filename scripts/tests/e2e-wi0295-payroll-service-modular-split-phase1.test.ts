import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const payrollAdapterHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-year-end-adapter-helpers.ts"
  );
  const yearEndCalculationHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "year-end-calculation-helpers.ts"
  );
  const yearEndFilingArtifactHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "year-end-filing-artifact-helpers.ts"
  );
  const yearEndFilingSubmissionQueryHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "year-end-filing-submission-query-helpers.ts"
  );
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminPageState = readUtf8("src", "app", "admin", "page-state.ts");
  const adminPageHelpers = readUtf8("src", "app", "admin", "page-helpers.ts");
  const adminPageTypes = readUtf8("src", "app", "admin", "page-types.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0295-payroll-service-modular-split-phase1.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /from \"@\/features\/payroll\/service-year-end-adapter-helpers\"/);
  assert.match(payrollAdapterHelpers, /from \"@\/features\/payroll\/year-end-calculation-helpers\"/);
  assert.match(payrollAdapterHelpers, /from \"@\/features\/payroll\/year-end-filing-artifact-helpers\"/);
  assert.match(payrollAdapterHelpers, /from \"@\/features\/payroll\/year-end-filing-submission-query-helpers\"/);
  assert.match(payrollAdapterHelpers, /return normalizeYearEndDeductionItemsCore\(deductionItems, toKrwInteger\);/);
  assert.match(payrollAdapterHelpers, /return buildYearEndFilingArtifactCore\(format, rows, payload\);/);
  assert.match(payrollAdapterHelpers, /return validateYearEndFilingRecordsCore\(rows, payload\);/);
  assert.match(payrollAdapterHelpers, /return sortYearEndFilingSubmissionsCore\(submissions, options\);/);

  assert.match(
    yearEndCalculationHelpers,
    /export function normalizeYearEndDeductionItems/
  );
  assert.match(yearEndCalculationHelpers, /export function applyYearEndTaxCreditCaps/);
  assert.match(
    yearEndFilingArtifactHelpers,
    /export function buildYearEndFilingArtifact/
  );
  assert.match(
    yearEndFilingArtifactHelpers,
    /export function validateYearEndFilingRecords/
  );
  assert.match(
    yearEndFilingSubmissionQueryHelpers,
    /export function matchesYearEndFilingSubmissionFilters/
  );
  assert.match(
    yearEndFilingSubmissionQueryHelpers,
    /export function sortYearEndFilingSubmissions/
  );

  assert.match(adminPage, /from \"@\/app\/admin\/page-helpers\"/);
  assert.match(
    `${adminPage}\n${adminPageState}`,
    /from \"@\/app\/admin\/page-types\"/
  );
  assert.match(adminPage, /const showDevTools = isTruthyFlag/);
  assert.match(
    `${adminPage}\n${adminPageState}`,
    /const \[periodStart, setPeriodStart\] = useState\(firstDayOfMonthLocal\(\)\)/
  );

  assert.match(adminPageHelpers, /export function buildQuery/);
  assert.match(adminPageHelpers, /export function toWaitHours/);
  assert.match(adminPageTypes, /export type PayrollRunDto/);
  assert.match(adminPageTypes, /export type LeaveBalanceDto/);

  assert.match(workItem, /WI-0295/i);
  assert.match(workItem, /decomposition/i);
  assert.match(roadmap, /WI-0295/i);
}

run()
  .then(() => {
    console.log("e2e-wi0295-payroll-service-modular-split-phase1.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
