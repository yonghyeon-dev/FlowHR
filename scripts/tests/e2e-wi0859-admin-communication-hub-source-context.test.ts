import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const hubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const noticesWorkspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const noticesView = readUtf8("src", "components", "notices", "AdminNoticeWorkspaceView.tsx");
  const benefitsWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const benefitsView = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspaceView.tsx");
  const recruitmentWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "AdminRecruitmentWorkspace.tsx"
  );
  const recruitmentView = readUtf8(
    "src",
    "components",
    "recruitment",
    "AdminRecruitmentWorkspaceView.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0859-admin-communication-hub-source-context.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(hubs, /\/admin\/notices\?status=PUBLISHED&risk=no-read&source=admin-dashboard/);
  assert.match(hubs, /\/admin\/benefits\?status=SUBMITTED&risk=pending_3d&source=admin-dashboard/);
  assert.match(hubs, /\/admin\/recruitment\?risk=stalled_7d&source=admin-dashboard/);

  assert.match(noticesWorkspace, /const source = searchParams\.get\("source"\)/);
  assert.match(noticesWorkspace, /source === "admin-dashboard"/);
  assert.match(noticesWorkspace, /sourceHint=\{sourceHint\}/);
  assert.match(noticesView, /sourceHint: string;/);
  assert.match(noticesView, /sourceHint \? <p className="small muted">\{sourceHint\}<\/p> : null/);

  assert.match(benefitsWorkspace, /const source = searchParams\.get\("source"\)/);
  assert.match(benefitsWorkspace, /source === "admin-dashboard"/);
  assert.match(benefitsWorkspace, /sourceHint=\{sourceHint\}/);
  assert.match(benefitsView, /sourceHint: string;/);
  assert.match(benefitsView, /sourceHint \? <p className="small muted">\{sourceHint\}<\/p> : null/);

  assert.match(recruitmentWorkspace, /const source = searchParams\.get\("source"\)/);
  assert.match(recruitmentWorkspace, /source === "admin-dashboard"/);
  assert.match(recruitmentWorkspace, /sourceHint=\{sourceHint\}/);
  assert.match(recruitmentView, /sourceHint: string;/);
  assert.match(
    recruitmentView,
    /sourceHint \? <p className="small muted">\{sourceHint\}<\/p> : null/
  );

  assert.match(workItem, /WI-0859/i);
  assert.match(workItem, /admin|communication|hub|source|context/i);
  assert.match(roadmap, /WI-0859/i);
}

run();
console.log("e2e-wi0859-admin-communication-hub-source-context.test passed");
