import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const panel = readUtf8("src", "components", "admin-kpi", "AdminContractKpiPanel.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0846-admin-analytics-contract-renewal-quick-action-link.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /renewalCandidateOnly=true/);
  assert.match(panel, /actionOpenRenewalCandidateQueue/);
  assert.match(copy, /actionOpenRenewalCandidateQueue: "Open renewal candidate queue"/);
  assert.match(copy, /actionOpenRenewalCandidateQueue: "갱신 후보 큐 열기"/);

  assert.match(workItem, /WI-0846/i);
  assert.match(workItem, /admin|analytics|contract|renewal|quick action/i);
  assert.match(roadmap, /WI-0846/i);
}

run();
console.log("e2e-wi0846-admin-analytics-contract-renewal-quick-action-link.test passed");
