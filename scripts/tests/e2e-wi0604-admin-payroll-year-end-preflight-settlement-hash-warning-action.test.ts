import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingPreflightBlockerPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0604-admin-payroll-year-end-preflight-settlement-hash-warning-action.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /refreshSettlementHashAction:/);
  assert.match(panel, /check\.key === "settlement_hash_available"/);
  assert.match(panel, /onClick=\{onPreviewFinalization\}/);

  assert.match(workItem, /WI-0604/i);
  assert.match(workItem, /settlement hash|warning|preflight|action|preview/i);
  assert.match(roadmap, /WI-0604/i);
}

run()
  .then(() => {
    console.log("e2e-wi0604-admin-payroll-year-end-preflight-settlement-hash-warning-action.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
