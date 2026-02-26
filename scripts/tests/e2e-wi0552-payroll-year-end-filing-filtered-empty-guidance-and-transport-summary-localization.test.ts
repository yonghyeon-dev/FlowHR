import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const copy = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0552-payroll-year-end-filing-filtered-empty-guidance-and-transport-summary-localization.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copy, /noSubmissionMatchesFilters:/);
  assert.match(copy, /transportShortNtsApiMockLabel:/);

  assert.match(consoleSource, /const hasFilteredSubmissionEmptyState = useMemo/);
  assert.match(consoleSource, /copy\.transportShortNtsApiMockLabel/);
  assert.match(consoleSource, /hasFilteredSubmissionEmptyState \? copy\.noSubmissionMatchesFilters : copy\.noFilingSubmissionYet/);

  assert.match(workItem, /WI-0552/i);
  assert.match(workItem, /payroll|year-end|filing|filtered|empty|transport|localization/i);
  assert.match(roadmap, /WI-0552/i);
}

run()
  .then(() => {
    console.log("e2e-wi0552-payroll-year-end-filing-filtered-empty-guidance-and-transport-summary-localization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
