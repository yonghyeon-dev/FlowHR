import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const filingCopy = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const filingConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const preflightBlockerPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingPreflightBlockerPanel.tsx"
  );
  const yearEndCopy = readUtf8("src", "components", "payroll-year-end", "copy.ts");
  const workItem = readUtf8("work-items", "WI-1065-year-end-filing-control-copy.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const gapInventory = readUtf8("docs", "production-gap-inventory.md");

  assert.doesNotMatch(
    preflightBlockerPanel,
    /refreshSettlementHashAction:\s*"Refresh settlement hash"/,
    "preflight blocker action must not expose raw settlement hash refresh wording"
  );
  assert.doesNotMatch(
    preflightBlockerPanel,
    /refreshSettlementHashAction:\s*"정산 해시 갱신"/,
    "preflight blocker action must not expose raw 정산 해시 wording"
  );

  assert.match(
    filingConsole,
    /const unresolvedAckCodeLabel =/,
    "filing console should render a product-facing fallback label when the response catalog is absent"
  );
  assert.doesNotMatch(
    filingConsole,
    /<option value=\{ackCode\}>\{ackCode \|\| "ACK-OK"\}<\/option>/,
    "filing console fallback option must not expose raw ACK-OK text"
  );

  assert.doesNotMatch(
    filingCopy,
    /settlementHashLabel:\s*"Settlement Hash"/,
    "filing summary labels must not expose raw settlement hash wording"
  );
  assert.doesNotMatch(
    filingCopy,
    /settlementHashLabel:\s*"정산 해시"/,
    "filing summary labels must not expose raw 정산 해시 wording"
  );
  assert.match(filingCopy, /defaultAcceptedResponseOptionLabel:/);
  assert.match(filingCopy, /defaultRejectedResponseOptionLabel:/);

  assert.doesNotMatch(
    yearEndCopy,
    /settlementHashLabel:\s*"정산 해시"/,
    "year-end summary labels must not expose raw 정산 해시 wording"
  );

  assert.match(workItem, /WI-1065/i);
  assert.match(progress, /WI-1065/i);
  assert.match(gapInventory, /WI-1065/i);
}

run()
  .then(() => {
    console.log("e2e-wi1065-year-end-filing-control-copy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
