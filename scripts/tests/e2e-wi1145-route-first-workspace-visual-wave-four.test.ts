import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminNoticeWorkspace = readUtf8(
    "src",
    "components",
    "notices",
    "AdminNoticeWorkspaceView.tsx"
  );
  const employeeNoticeBoard = readUtf8(
    "src",
    "components",
    "notices",
    "EmployeeNoticeBoard.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1145-route-first-workspace-visual-wave-four.md"
  );

  assert.match(
    adminNoticeWorkspace,
    /className="saas-content workspace-shell admin-workspace-shell"/
  );
  assert.match(
    adminNoticeWorkspace,
    /className="page-header workspace-page-header"/
  );
  assert.match(
    adminNoticeWorkspace,
    /className="small muted workspace-source-banner"/
  );
  assert.match(
    adminNoticeWorkspace,
    /className="panel-grid workspace-panel-grid"/
  );
  assert.match(
    adminNoticeWorkspace,
    /className="panel workspace-section-card workspace-toolbar-card"/
  );
  assert.match(
    adminNoticeWorkspace,
    /className="panel workspace-side-panel"/
  );
  assert.match(
    adminNoticeWorkspace,
    /className="kpi-strip workspace-summary-strip"/
  );

  assert.match(
    employeeNoticeBoard,
    /className="saas-content workspace-shell employee-workspace-shell"/
  );
  assert.match(
    employeeNoticeBoard,
    /className="page-header workspace-page-header employee-workspace-status-header"/
  );
  assert.match(
    employeeNoticeBoard,
    /className="small fail workspace-inline-status"/
  );
  assert.match(
    employeeNoticeBoard,
    /className="panel workspace-section-card workspace-toolbar-card"/
  );
  assert.match(
    employeeNoticeBoard,
    /className="panel workspace-section-card workspace-note-card"/
  );
  assert.match(
    employeeNoticeBoard,
    /className="kpi-strip workspace-summary-strip employee-workspace-status-strip"/
  );

  assert.match(globalsCss, /\.workspace-summary-strip \{/);
  assert.match(globalsCss, /\.workspace-note-card \{/);
  assert.match(globalsCss, /\.workspace-inline-status \{/);

  assert.match(workItem, /WI-1145/);
  assert.match(workItem, /visual/i);
}

run()
  .then(() => {
    console.log("e2e-wi1145-route-first-workspace-visual-wave-four.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
