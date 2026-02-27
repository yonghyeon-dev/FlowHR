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
  const helper = readUtf8("src", "features", "scheduling", "anomaly-incident-archive-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0572-scheduling-anomaly-archive-summary-result-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAnomalyIncidentArchiveAuditPayload/);
  assert.match(service, /buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload/);
  assert.match(service, /buildScheduleAnomalyIncidentArchiveResult/);
  assert.match(service, /payload: buildScheduleAnomalyIncidentArchiveAuditPayload\(\{/);
  assert.match(
    service,
    /payload: buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload\(\{/
  );
  assert.match(service, /return buildScheduleAnomalyIncidentArchiveResult\(\{/);
  assert.doesNotMatch(service, /payload:\s*\{\s*archivedAt,\s*dryRun,\s*asOf:/);

  assert.match(helper, /export function buildScheduleAnomalyIncidentArchiveAuditPayload/);
  assert.match(helper, /export function buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload/);
  assert.match(helper, /export function buildScheduleAnomalyIncidentArchiveResult/);
  assert.ok(countLines(service) <= 3730, `service.ts should stay <= 3730 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 280,
    `anomaly-incident-archive-helpers.ts should stay <= 280 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0572/i);
  assert.match(workItem, /scheduling|anomaly|archive|summary|result|helper|extraction/i);
  assert.match(roadmap, /WI-0572/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0572-scheduling-anomaly-archive-summary-result-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

