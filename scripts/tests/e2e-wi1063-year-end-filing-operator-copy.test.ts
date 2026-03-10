import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const filingCopy = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const submissionStateHelpers = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "submission-state-helpers.ts"
  );
  const workItem = readUtf8("work-items", "WI-1063-year-end-filing-operator-copy.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const gapInventory = readUtf8("docs", "production-gap-inventory.md");

  assert.doesNotMatch(
    filingCopy,
    /submissionSearchPlaceholder:\s*"submissionId, ackCode, note"/,
    "filing search placeholder must not expose raw submission/ack field names"
  );
  assert.doesNotMatch(
    filingCopy,
    /settlementHashFilterLabel:\s*"Settlement Hash Filter"/,
    "filing filter label must not expose raw settlement hash wording"
  );
  assert.doesNotMatch(
    filingCopy,
    /ackSubmissionIdLabel:\s*"Ack Submission ID"/,
    "filing operator input must not label the target as raw ack submission id"
  );
  assert.doesNotMatch(
    filingCopy,
    /statusAckSubmissionIdRequired:\s*"ack submission ID is required"/,
    "filing validation status must not ask for a raw ack submission id"
  );

  assert.doesNotMatch(submissionStateHelpers, /ackStatus=/, "active filters summary must not leak raw ackStatus keys");
  assert.doesNotMatch(
    submissionStateHelpers,
    /settlementHash=/,
    "active filters summary must not leak raw settlementHash keys"
  );
  assert.doesNotMatch(submissionStateHelpers, /sort=/, "active filters summary must not leak raw sort keys");

  assert.match(workItem, /WI-1063/i);
  assert.match(progress, /WI-1063/i);
  assert.match(gapInventory, /WI-1063/i);
}

run()
  .then(() => {
    console.log("e2e-wi1063-year-end-filing-operator-copy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
