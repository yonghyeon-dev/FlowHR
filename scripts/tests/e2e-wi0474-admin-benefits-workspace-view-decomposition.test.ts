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
  const workspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const view = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspaceView.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0474-admin-benefits-workspace-view-decomposition.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(countLines(workspace) <= 300, "AdminBenefitsWorkspace must stay <= 300 lines");
  assert.match(workspace, /import AdminBenefitsWorkspaceView/);
  assert.match(workspace, /<AdminBenefitsWorkspaceView/);
  assert.match(view, /copy\.createCatalogTitle/);
  assert.match(view, /copy\.catalogTitle/);
  assert.match(view, /copy\.requestTitle/);

  assert.match(workItem, /WI-0474/i);
  assert.match(workItem, /benefits|workspace|view|decomposition/i);
  assert.match(roadmap, /WI-0474/i);
}

run()
  .then(() => {
    console.log("e2e-wi0474-admin-benefits-workspace-view-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
