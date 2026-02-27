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
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const helper = readUtf8("src", "features", "scheduling", "anomaly-incident-auto-action-helpers.ts");
  const auditHelper = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-auto-action-audit-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0570-scheduling-anomaly-auto-action-assign-failed-payload-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAnomalyIncidentAutoActionAssignFailedAuditEntry/);
  assert.doesNotMatch(
    service,
    /payload:\s*\{\s*incidentId,\s*previousAssigneeId,\s*autoAssigneeId,\s*autoAssignMode,\s*escalationDecision,\s*error[\s\S]*?\}/
  );

  assert.match(helper, /export function buildScheduleAnomalyIncidentAutoActionAssignFailedPayload/);
  assert.match(auditHelper, /buildScheduleAnomalyIncidentAutoActionAssignFailedPayload/);
  assert.ok(countLines(service) <= 3740, `service.ts should stay <= 3740 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 365,
    `anomaly-incident-auto-action-helpers.ts should stay <= 365 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0570/i);
  assert.match(workItem, /scheduling|anomaly|auto-action|assign|failed|payload|helper|extraction/i);
  assert.match(roadmap, /WI-0570/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0570-scheduling-anomaly-auto-action-assign-failed-payload-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
