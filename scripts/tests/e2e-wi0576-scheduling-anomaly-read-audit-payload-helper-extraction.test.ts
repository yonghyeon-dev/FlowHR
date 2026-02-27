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
  const helper = readUtf8("src", "features", "scheduling", "anomaly-incident-read-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0576-scheduling-anomaly-read-audit-payload-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAnomalyIncidentReadAuditPayload/);
  assert.match(service, /payload: buildScheduleAnomalyIncidentReadAuditPayload\(incident\)/);
  assert.doesNotMatch(
    service,
    /action:\s*"scheduling\.anomaly\.incident\.read"[\s\S]{0,220}payload:\s*\{\s*incidentId:\s*incident\.incidentId/
  );

  assert.match(helper, /export function buildScheduleAnomalyIncidentReadAuditPayload/);
  assert.ok(countLines(service) <= 3710, `service.ts should stay <= 3710 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 80,
    `anomaly-incident-read-helpers.ts should stay <= 80 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0576/i);
  assert.match(workItem, /scheduling|anomaly|read|audit|payload|helper|extraction/i);
  assert.match(roadmap, /WI-0576/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0576-scheduling-anomaly-read-audit-payload-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

