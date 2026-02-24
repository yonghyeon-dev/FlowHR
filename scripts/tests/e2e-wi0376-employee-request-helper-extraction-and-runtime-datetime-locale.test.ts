import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeePageHelpers = readUtf8("src", "app", "employee", "page-helpers.ts");
  const requestHelpers = readUtf8("src", "app", "employee", "page-request-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0376-employee-request-helper-extraction-and-runtime-datetime-locale.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from "@\/app\/employee\/page-request-helpers";/);
  assert.match(employeePage, /buildMobileRequestTimeline/);
  assert.match(employeePage, /buildRequestFailureCauses/);
  assert.match(employeePage, /buildRequestFeedbackRows/);
  assert.match(employeePage, /buildRequestSearchRows/);
  assert.match(employeePage, /filterMobileRequestTimeline/);
  assert.match(employeePage, /filterRequestFeedbackRows/);
  assert.match(employeePage, /const formatDateTimeByLocale = useCallback\(/);
  assert.match(employeePage, /formatDateTime=\{formatDateTimeByLocale\}/);
  assert.match(employeePage, /return buildRequestFeedbackRows\(\{/);
  assert.match(employeePage, /return buildRequestSearchRows\(\{/);
  assert.match(employeePage, /return buildMobileRequestTimeline\(\{/);
  assert.match(employeePage, /return buildRequestFailureCauses\(\{/);
  assert.doesNotMatch(employeePage, /const rows: RequestFeedbackRow\[] = \[];/);

  assert.match(employeePageHelpers, /export function formatDateTime\(value: string \| null, runtimeLocale = "ko-KR"\)/);
  assert.match(employeePageHelpers, /return parsed\.toLocaleString\(runtimeLocale\);/);

  assert.match(requestHelpers, /export function buildRequestFeedbackRows/);
  assert.match(requestHelpers, /export function buildRequestSearchRows/);
  assert.match(requestHelpers, /export function buildMobileRequestTimeline/);
  assert.match(requestHelpers, /export function buildRequestFailureCauses/);
  assert.match(requestHelpers, /export function filterRequestFeedbackRows/);
  assert.match(requestHelpers, /export function filterMobileRequestTimeline/);

  assert.match(workItem, /WI-0376/i);
  assert.match(workItem, /request helper extraction/i);
  assert.match(roadmap, /WI-0376/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0376-employee-request-helper-extraction-and-runtime-datetime-locale.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
