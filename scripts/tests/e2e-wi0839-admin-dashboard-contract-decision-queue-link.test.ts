import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0839-admin-dashboard-contract-decision-queue-link.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspaceHubs, /href: "\/admin\/contracts\?decisionQueueOnly=true"/);
  assert.match(workspaceHubs, /label: "계약 의사결정 큐"/);
  assert.match(workspaceHubs, /label: "Contract decision queue"/);

  assert.match(workItem, /WI-0839/i);
  assert.match(workItem, /admin|dashboard|contract|decision|queue/i);
  assert.match(roadmap, /WI-0839/i);
}

run();
console.log("e2e-wi0839-admin-dashboard-contract-decision-queue-link.test passed");
