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
  const helper = readUtf8("src", "features", "scheduling", "anomaly-incident-replay-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0573-scheduling-anomaly-replay-summary-result-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAnomalyIncidentReplayAuditPayload/);
  assert.match(service, /buildScheduleAnomalyIncidentReplayGeneratedAuditPayload/);
  assert.match(service, /buildScheduleAnomalyIncidentReplayResult/);
  assert.match(service, /payload: buildScheduleAnomalyIncidentReplayAuditPayload\(\{/);
  assert.match(service, /payload: buildScheduleAnomalyIncidentReplayGeneratedAuditPayload\(\{/);
  assert.match(service, /return buildScheduleAnomalyIncidentReplayResult\(\{/);
  assert.doesNotMatch(service, /history:\s*replayModel\.history\.map/);

  assert.match(helper, /export function buildScheduleAnomalyIncidentReplayAuditPayload/);
  assert.match(helper, /export function buildScheduleAnomalyIncidentReplayGeneratedAuditPayload/);
  assert.match(helper, /export function buildScheduleAnomalyIncidentReplayResult/);
  assert.ok(countLines(service) <= 3710, `service.ts should stay <= 3710 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 300,
    `anomaly-incident-replay-helpers.ts should stay <= 300 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0573/i);
  assert.match(workItem, /scheduling|anomaly|replay|summary|result|helper|extraction/i);
  assert.match(roadmap, /WI-0573/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0573-scheduling-anomaly-replay-summary-result-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

