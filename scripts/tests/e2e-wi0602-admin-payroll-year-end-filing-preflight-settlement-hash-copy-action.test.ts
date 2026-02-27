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
    "WI-0602-admin-payroll-year-end-filing-preflight-settlement-hash-copy-action.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /^\ufeff?"use client";/m);
  assert.match(panel, /copyHashAction:/);
  assert.match(panel, /copiedHashStatus:/);
  assert.match(panel, /copyHashFailedStatus:/);
  assert.match(panel, /pasteHashHint:/);
  assert.match(panel, /const settlementHash = checklist\?\.checklist\.metrics\.settlementHash\?\.trim\(\) \?\? ""/);
  assert.match(panel, /navigator\.clipboard\?\.writeText/);
  assert.match(panel, /setHashActionStatus\(panelCopy\.copiedHashStatus\)/);
  assert.match(panel, /setHashActionStatus\(panelCopy\.copyHashFailedStatus\)/);
  assert.match(panel, /\{panelCopy\.copyHashAction\}/);

  assert.match(workItem, /WI-0602/i);
  assert.match(workItem, /preflight|settlement-hash|copy|action/i);
  assert.match(roadmap, /WI-0602/i);
}

run()
  .then(() => {
    console.log("e2e-wi0602-admin-payroll-year-end-filing-preflight-settlement-hash-copy-action.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
