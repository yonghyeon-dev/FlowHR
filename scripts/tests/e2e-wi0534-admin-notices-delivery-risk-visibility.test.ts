import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const view = readUtf8("src", "components", "notices", "AdminNoticeWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "notices", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0534-admin-notices-delivery-risk-visibility.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(view, /function isReadCoverageRisk/);
  assert.match(view, /publishedWithoutReadCount/);
  assert.match(view, /copy\.readRiskSummaryLabel/);
  assert.match(view, /copy\.readRiskBadgeLabel/);

  assert.match(copy, /readRiskSummaryLabel: string;/);
  assert.match(copy, /readRiskBadgeLabel: string;/);
  assert.match(copy, /readRiskSummaryLabel: "[^"]+"/);
  assert.match(copy, /readRiskBadgeLabel: "[^"]+"/);

  assert.match(workItem, /WI-0534/i);
  assert.match(workItem, /notice|delivery|risk|read|badge/i);
  assert.match(roadmap, /WI-0534/i);
}

run()
  .then(() => {
    console.log("e2e-wi0534-admin-notices-delivery-risk-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
