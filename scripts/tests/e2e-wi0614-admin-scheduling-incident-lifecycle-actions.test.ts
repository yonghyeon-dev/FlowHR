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
    "WI-0614-admin-scheduling-incident-lifecycle-actions.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(incidentHook, /selectedIncidentId/);
  assert.match(incidentHook, /incidentActionAssigneeId/);
  assert.match(incidentHook, /incidentActionNote/);
  assert.match(incidentHook, /incidentResolutionCode/);
  assert.match(incidentHook, /onAcknowledgeIncident/);
  assert.match(incidentHook, /onAssignIncident/);
  assert.match(incidentHook, /onResolveIncident/);
  assert.match(incidentHook, /\/api\/scheduling\/anomalies\/incidents\/\$\{encodeURIComponent\(incidentId\)\}\/ack/);
  assert.match(incidentHook, /\/api\/scheduling\/anomalies\/incidents\/\$\{encodeURIComponent\(incidentId\)\}\/assign/);
  assert.match(incidentHook, /\/api\/scheduling\/anomalies\/incidents\/\$\{encodeURIComponent\(incidentId\)\}\/resolve/);
  assert.match(incidentHook, /statusIncidentNeedsSelection/);
  assert.match(incidentHook, /statusIncidentNeedsAssignee/);
  assert.match(incidentHook, /statusIncidentAcknowledgeDone/);
  assert.match(incidentHook, /statusIncidentAssignDone/);
  assert.match(incidentHook, /statusIncidentResolveDone/);

  assert.match(incidentPanel, /copy\.incidentSelectAction/);
  assert.match(incidentPanel, /copy\.incidentActionTitle/);
  assert.match(incidentPanel, /copy\.incidentActionAssigneeLabel/);
  assert.match(incidentPanel, /copy\.incidentActionNoteLabel/);
  assert.match(incidentPanel, /copy\.incidentResolutionCodeLabel/);
  assert.match(incidentPanel, /copy\.incidentAcknowledgeAction/);
  assert.match(incidentPanel, /copy\.incidentAssignAction/);
  assert.match(incidentPanel, /copy\.incidentResolveAction/);
  assert.match(incidentPanel, /onAcknowledgeIncident/);
  assert.match(incidentPanel, /onAssignIncident/);
  assert.match(incidentPanel, /onResolveIncident/);

  assert.match(copy, /incidentSelectAction:/);
  assert.match(copy, /incidentActionTitle:/);
  assert.match(copy, /incidentResolutionCodeLabel:/);
  assert.match(copy, /pendingIncidentAcknowledge:/);
  assert.match(copy, /pendingIncidentAssign:/);
  assert.match(copy, /pendingIncidentResolve:/);
  assert.match(copy, /statusIncidentNeedsSelection:/);
  assert.match(copy, /statusIncidentNeedsAssignee:/);
  assert.match(copy, /statusIncidentAcknowledgeDone:/);
  assert.match(copy, /statusIncidentAssignDone:/);
  assert.match(copy, /statusIncidentResolveDone:/);

  assert.ok(
    countLines(incidentPanel) <= 260,
    `AdminSchedulingIncidentPanel.tsx should stay <= 260 lines (current: ${countLines(incidentPanel)})`
  );
  assert.ok(
    countLines(incidentHook) <= 260,
    `use-admin-scheduling-incident-panel.ts should stay <= 260 lines (current: ${countLines(incidentHook)})`
  );

  assert.match(workItem, /WI-0614/i);
  assert.match(workItem, /scheduling|incident|lifecycle|ack|assign|resolve/i);
  assert.match(roadmap, /WI-0614/i);
}

run()
  .then(() => {
    console.log("e2e-wi0614-admin-scheduling-incident-lifecycle-actions.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
