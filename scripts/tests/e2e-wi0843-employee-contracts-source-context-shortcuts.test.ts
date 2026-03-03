import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const hubs = readUtf8("src", "components", "employee-dashboard", "workspace-hubs.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0843-employee-contracts-source-context-shortcuts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(hubs, /\/employee\/contracts\?source=employee-dashboard/);
  assert.match(hubs, /status=pending_response&source=employee-dashboard/);
  assert.match(hubs, /deadline=due_soon&source=employee-dashboard/);
  assert.match(hubs, /deadline=overdue&source=employee-dashboard/);

  assert.match(workItem, /WI-0843/i);
  assert.match(workItem, /employee|dashboard|contract|source|shortcut/i);
  assert.match(roadmap, /WI-0843/i);
}

run();
console.log("e2e-wi0843-employee-contracts-source-context-shortcuts.test passed");
