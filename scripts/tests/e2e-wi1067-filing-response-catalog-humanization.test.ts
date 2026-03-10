import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const filingConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const filingCopy = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const workItem = readUtf8("work-items", "WI-1067-filing-response-catalog-humanization.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const gapInventory = readUtf8("docs", "production-gap-inventory.md");

  assert.doesNotMatch(
    filingConsole,
    /\{item\.code\} - \{item\.label\}/,
    "response catalog options must not expose raw code + label text"
  );
  assert.doesNotMatch(
    filingConsole,
    /<option value=\{rejectionReasonCode \|\| "OTHER"\}>\{rejectionReasonCode \|\| "OTHER"\}<\/option>/,
    "fallback rejection option must not expose raw OTHER code text"
  );
  assert.match(filingConsole, /const unresolvedRejectionReasonLabel = copy\.defaultRejectionReasonOptionLabel;/);
  assert.match(filingCopy, /defaultRejectionReasonOptionLabel:/);

  assert.match(workItem, /WI-1067/i);
  assert.match(progress, /WI-1067/i);
  assert.match(gapInventory, /WI-1067/i);
}

run()
  .then(() => {
    console.log("e2e-wi1067-filing-response-catalog-humanization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
