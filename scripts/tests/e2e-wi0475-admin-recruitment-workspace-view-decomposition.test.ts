import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const workspace = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspace.tsx");
  const view = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspaceView.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0475-admin-recruitment-workspace-view-decomposition.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(countLines(workspace) <= 300, "AdminRecruitmentWorkspace must stay <= 300 lines");
  assert.match(workspace, /import AdminRecruitmentWorkspaceView/);
  assert.match(workspace, /<AdminRecruitmentWorkspaceView/);
  assert.match(view, /copy\.createOpeningTitle/);
  assert.match(view, /copy\.openingsTitle/);
  assert.match(view, /copy\.referralsTitle/);

  assert.match(workItem, /WI-0475/i);
  assert.match(workItem, /recruitment|workspace|view|decomposition/i);
  assert.match(roadmap, /WI-0475/i);
}

run()
  .then(() => {
    console.log("e2e-wi0475-admin-recruitment-workspace-view-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
