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
  const serviceSource = readUtf8("src", "features", "scheduling", "service.ts");
  const projectionSource = readUtf8("src", "features", "scheduling", "incident-audit-projection.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0456-scheduling-incident-audit-projection-extraction-line-budget-5300.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(serviceSource, /from "@\/features\/scheduling\/incident-audit-projection"/);
  assert.match(serviceSource, /ANOMALY_INCIDENT_PROJECTION_AUDIT_ACTIONS/);
  assert.match(serviceSource, /buildScheduleAnomalyIncidentReadModelsFromAuditLogs/);
  assert.doesNotMatch(serviceSource, /function toIncidentHistoryEntriesFromAuditPayload\(/);
  assert.doesNotMatch(serviceSource, /function buildScheduleAnomalyIncidentReadModelsFromAuditLogs\(/);
  assert.ok(
    countLines(serviceSource) <= 5300,
    `scheduling/service.ts should stay <= 5300 lines (current: ${countLines(serviceSource)})`
  );

  assert.match(projectionSource, /export const ANOMALY_INCIDENT_PROJECTION_AUDIT_ACTIONS = \[/);
  assert.match(projectionSource, /export function buildScheduleAnomalyIncidentReadModelsFromAuditLogs\(/);
  assert.match(projectionSource, /export type IncidentAuditProjectionLog = \{/);

  assert.match(workItem, /WI-0456/i);
  assert.match(workItem, /scheduling|incident|audit|projection|extraction|line budget/i);
  assert.match(roadmap, /WI-0456/i);
}

run()
  .then(() => {
    console.log("e2e-wi0456-scheduling-incident-audit-projection-extraction-line-budget-5300.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
