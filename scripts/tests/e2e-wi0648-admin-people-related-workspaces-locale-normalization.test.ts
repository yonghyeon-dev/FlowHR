import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const pageView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const relatedPanel = readUtf8("src", "app", "admin", "people", "page-view-related-workspaces-panel.tsx");
  const workItem = readUtf8("work-items", "WI-0648-admin-people-related-workspaces-locale-normalization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(pageView, /aria-label=\{isKoLocale \? "관련 화면 이동" : "Related workspaces"\}/);

  assert.match(relatedPanel, /관련 화면 이동/);
  assert.match(relatedPanel, /결재 실행 현황/);
  assert.match(relatedPanel, /근태 워크스페이스/);
  assert.match(relatedPanel, /관리자 대시보드/);
  assert.match(relatedPanel, /Approval executions/);
  assert.match(relatedPanel, /Attendance workspace/);
  assert.match(relatedPanel, /Admin dashboard/);

  assert.match(workItem, /WI-0648/i);
  assert.match(workItem, /people|related workspaces|locale|normalization/i);
  assert.match(roadmap, /WI-0648/i);
}

run()
  .then(() => {
    console.log("e2e-wi0648-admin-people-related-workspaces-locale-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
