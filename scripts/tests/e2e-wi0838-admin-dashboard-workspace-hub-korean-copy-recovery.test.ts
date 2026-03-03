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
    "WI-0838-admin-dashboard-workspace-hub-korean-copy-recovery.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspaceHubs, /title: "결재\/확인"/);
  assert.match(workspaceHubs, /label: "결재 실행"/);
  assert.match(workspaceHubs, /title: "인사\/온보딩"/);
  assert.match(workspaceHubs, /title: "공지\/복리후생\/채용\/계약"/);
  assert.match(workspaceHubs, /label: "계약 응답 대기"/);
  assert.doesNotMatch(workspaceHubs, /�/);

  assert.match(workItem, /WI-0838/i);
  assert.match(workItem, /admin|dashboard|korean|copy|workspace/i);
  assert.match(roadmap, /WI-0838/i);
}

run();
console.log("e2e-wi0838-admin-dashboard-workspace-hub-korean-copy-recovery.test passed");
