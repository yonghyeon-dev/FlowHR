import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const workspaceHubs = readUtf8("src", "components", "employee-dashboard", "workspace-hubs.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0840-employee-dashboard-contract-action-needed-shortcut.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspaceHubs, /href: "\/employee\/contracts\?status=pending_response"/);
  assert.match(workspaceHubs, /label: "계약 응답 필요"/);
  assert.match(workspaceHubs, /label: "Contracts action needed"/);

  assert.match(workItem, /WI-0840/i);
  assert.match(workItem, /employee|dashboard|contract|shortcut|action/i);
  assert.match(roadmap, /WI-0840/i);
}

run();
console.log("e2e-wi0840-employee-dashboard-contract-action-needed-shortcut.test passed");
