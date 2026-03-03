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
  const workspaceHubs = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "workspace-hubs.ts"
  );
  const overviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0827-employee-dashboard-korean-copy-hub-normalization.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(overviewPanels) <= 360,
    `EmployeeAccountOverviewPanels.tsx should stay under 360 lines (current: ${countLines(overviewPanels)})`
  );

  assert.match(
    workspaceHubs,
    /href: "\/employee\/benefits\?status=SUBMITTED&risk=pending_3d"/
  );
  assert.match(
    workspaceHubs,
    /href: "\/employee\/recruitment\?risk=stalled_7d"/
  );
  assert.match(overviewPanels, /Core workspace hub/);
  assert.match(overviewPanels, /Today's priority/);
  assert.match(overviewPanels, /Go to Section/);

  assert.equal(
    workspaceHubs.includes("異쒗눜洹?洹쇰Т"),
    false,
    "workspace hubs should not contain mojibake Korean title"
  );
  assert.equal(
    overviewPanels.includes("?듭떖 ?뚰겕?ㅽ럹?댁뒪 ?덈툕"),
    false,
    "overview panels should not contain mojibake Korean hub title"
  );
  assert.doesNotMatch(overviewPanels, /쨌/);

  assert.match(workItem, /WI-0827/i);
  assert.match(workItem, /employee|dashboard|korean|copy|hub|normalization/i);
  assert.match(roadmap, /WI-0827/i);
}

run()
  .then(() => {
    console.log("e2e-wi0827-employee-dashboard-korean-copy-hub-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
