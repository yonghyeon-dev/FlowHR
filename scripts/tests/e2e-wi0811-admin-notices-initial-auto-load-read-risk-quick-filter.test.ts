import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const workspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const view = readUtf8("src", "components", "notices", "AdminNoticeWorkspaceView.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0811-admin-notices-initial-auto-load-read-risk-quick-filter.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspace, /const \[readRiskOnly, setReadRiskOnly\] = useState\(false\);/);
  assert.match(workspace, /const \[autoLoadAttempted, setAutoLoadAttempted\] = useState\(false\);/);
  assert.match(workspace, /if \(autoLoadAttempted \|\| \(!organizationId && !usesBearerToken\)\)/);
  assert.match(workspace, /setAutoLoadAttempted\(true\);/);
  assert.match(workspace, /void loadNotices\(\);/);
  assert.match(workspace, /if \(readRiskOnly && !isReadCoverageRisk\(notice, readCountByNoticeId\)\)/);
  assert.match(workspace, /readRiskNoticeCount=\{readRiskNoticeCount\}/);
  assert.match(workspace, /onSetReadRiskOnly=\{setReadRiskOnly\}/);

  assert.match(view, /readRiskOnly: boolean;/);
  assert.match(view, /readRiskNoticeCount: number;/);
  assert.match(view, /onSetReadRiskOnly: \(value: boolean\) => void;/);
  assert.match(view, /onClick=\{\(\) => onSetReadRiskOnly\(false\)\}/);
  assert.match(view, /onClick=\{\(\) => onSetReadRiskOnly\(true\)\}/);
  assert.match(view, /\{copy\.readRiskSummaryLabel\} \(\{readRiskNoticeCount\}\)/);

  assert.match(workItem, /WI-0811/i);
  assert.match(workItem, /admin|notices|auto-load|read-risk|quick-filter/i);
  assert.match(roadmap, /WI-0811/i);
}

run();
console.log("e2e-wi0811-admin-notices-initial-auto-load-read-risk-quick-filter.test passed");
