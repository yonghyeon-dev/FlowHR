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
  const workspace = readUtf8("src", "components", "scheduling", "AdminSchedulingWorkspace.tsx");
  const workspaceView = readUtf8("src", "components", "scheduling", "AdminSchedulingWorkspaceView.tsx");
  const incidentHook = readUtf8(
    "src",
    "components",
    "scheduling",
    "use-admin-scheduling-incident-panel.ts"
  );
  const incidentPanel = readUtf8("src", "components", "scheduling", "AdminSchedulingIncidentPanel.tsx");
  const copy = readUtf8("src", "components", "scheduling", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0613-admin-scheduling-incident-query-ux-summary.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspace, /useAdminSchedulingIncidentPanel/);
  assert.match(workspace, /incidentPanel=\{incidentPanel\}/);
  assert.match(workspaceView, /AdminSchedulingIncidentPanel/);
  assert.match(workspaceView, /incidentPanel:\s*AdminSchedulingIncidentPanelState/);
  assert.match(workspaceView, /<AdminSchedulingIncidentPanel copy=\{copy\} runtimeLocale=\{runtimeLocale\} incidentPanel=\{incidentPanel\} \/>/);

  assert.match(incidentHook, /\/api\/scheduling\/anomalies\/incidents/);
  assert.match(incidentHook, /incidentSummary/);
  assert.match(incidentHook, /onRunIncidentQuickFilter/);
  assert.match(incidentHook, /pendingIncidentList/);
  assert.match(incidentHook, /statusIncidentListLoaded/);

  assert.match(incidentPanel, /copy\.incidentQueueTitle/);
  assert.match(incidentPanel, /copy\.incidentQuickFilterLabel/);
  assert.match(incidentPanel, /copy\.incidentSummaryUnassignedLabel/);
  assert.match(incidentPanel, /resolveIncidentStateLabel/);
  assert.match(incidentPanel, /quickFilterSummaryLabel/);

  assert.match(copy, /incidentQueueTitle:/);
  assert.match(copy, /incidentQuickFilterLabel:/);
  assert.match(copy, /pendingIncidentList:/);
  assert.match(copy, /statusIncidentListLoaded:/);

  assert.ok(
    countLines(workspace) <= 300,
    `AdminSchedulingWorkspace.tsx should stay <= 300 lines (current: ${countLines(workspace)})`
  );
  assert.ok(
    countLines(workspaceView) <= 300,
    `AdminSchedulingWorkspaceView.tsx should stay <= 300 lines (current: ${countLines(workspaceView)})`
  );
  assert.ok(
    countLines(incidentPanel) <= 220,
    `AdminSchedulingIncidentPanel.tsx should stay <= 220 lines (current: ${countLines(incidentPanel)})`
  );

  assert.match(workItem, /WI-0613/i);
  assert.match(workItem, /scheduling|incident|query|summary|filter/i);
  assert.match(roadmap, /WI-0613/i);
}

run()
  .then(() => {
    console.log("e2e-wi0613-admin-scheduling-incident-query-ux-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
