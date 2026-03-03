import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const hubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const workItem = readUtf8("work-items", "WI-0845-admin-dashboard-contract-renewal-candidate-link.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(hubs, /\/admin\/contracts\?renewalCandidateOnly=true/);
  assert.match(hubs, /계약 갱신 후보/);
  assert.match(hubs, /Contract renewal candidates/);

  assert.match(workItem, /WI-0845/i);
  assert.match(workItem, /admin|dashboard|contract|renewal|link/i);
  assert.match(roadmap, /WI-0845/i);
}

run();
console.log("e2e-wi0845-admin-dashboard-contract-renewal-candidate-link.test passed");
