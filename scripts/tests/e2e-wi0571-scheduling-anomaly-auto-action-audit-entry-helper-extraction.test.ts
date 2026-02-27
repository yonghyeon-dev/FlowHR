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
  const auditHelper = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-auto-action-audit-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0571-scheduling-anomaly-auto-action-audit-entry-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAnomalyIncidentAutoActionAssignFailedAuditEntry/);
  assert.match(service, /buildScheduleAnomalyIncidentAutoActionGeneratedAuditEntry/);
  assert.match(service, /buildScheduleAnomalyIncidentAutoActionExecutionAuditEntry/);
  assert.match(
    service,
    /await context\.dataAccess\.audit\.append\(\s*buildScheduleAnomalyIncidentAutoActionGeneratedAuditEntry\(/m
  );
  assert.match(
    service,
    /await context\.dataAccess\.audit\.append\(\s*buildScheduleAnomalyIncidentAutoActionExecutionAuditEntry\(/m
  );
  assert.doesNotMatch(service, /action:\s*"scheduling\.anomaly\.incident\.auto_action\.generated"/);

  assert.match(auditHelper, /export function buildScheduleAnomalyIncidentAutoActionAssignFailedAuditEntry/);
  assert.match(auditHelper, /export function buildScheduleAnomalyIncidentAutoActionGeneratedAuditEntry/);
  assert.match(auditHelper, /export function buildScheduleAnomalyIncidentAutoActionExecutionAuditEntry/);
  assert.ok(countLines(service) <= 3740, `service.ts should stay <= 3740 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(auditHelper) <= 120,
    `anomaly-incident-auto-action-audit-helpers.ts should stay <= 120 lines (current: ${countLines(auditHelper)})`
  );

  assert.match(workItem, /WI-0571/i);
  assert.match(workItem, /scheduling|anomaly|auto-action|audit|entry|helper|extraction/i);
  assert.match(roadmap, /WI-0571/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0571-scheduling-anomaly-auto-action-audit-entry-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

