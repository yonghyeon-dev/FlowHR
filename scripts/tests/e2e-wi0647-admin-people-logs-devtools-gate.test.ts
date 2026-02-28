import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const page = readUtf8("src", "app", "admin", "people", "page.tsx");
  const pageView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const workItem = readUtf8("work-items", "WI-0647-admin-people-logs-devtools-gate.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(page, /function isTruthyFlag\(value: string \| undefined\)/);
  assert.match(page, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(page, /showDevTools=\{showDevTools\}/);

  assert.match(pageView, /showDevTools: boolean;/);
  assert.match(pageView, /showDevTools\s*\}\s*=\s*props;/);
  assert.match(
    pageView,
    /showDevTools \? \([\s\S]*AdminPeopleLogsPanel[\s\S]*\) : \([\s\S]*Related workspaces/
  );

  assert.match(workItem, /WI-0647/i);
  assert.match(workItem, /people|logs|devtools|gate/i);
  assert.match(roadmap, /WI-0647/i);
}

run()
  .then(() => {
    console.log("e2e-wi0647-admin-people-logs-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
