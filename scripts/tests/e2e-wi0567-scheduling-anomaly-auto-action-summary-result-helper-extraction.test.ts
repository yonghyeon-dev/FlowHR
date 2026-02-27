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
  const workItem = readUtf8(
    "work-items",
    "WI-0567-scheduling-anomaly-auto-action-summary-result-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAnomalyIncidentAutoActionSummaryPayload/);
  assert.match(service, /buildScheduleAnomalyIncidentAutoActionResult/);
  assert.match(service, /const summaryPayload = buildScheduleAnomalyIncidentAutoActionSummaryPayload\(\{/);
  assert.match(service, /return buildScheduleAnomalyIncidentAutoActionResult\(\{/);
  assert.doesNotMatch(
    service,
    /const summaryPayload = \{[\s\S]*?executedAt,[\s\S]*?dryRun: escalation\.dryRun/
  );

  assert.match(helper, /export function buildScheduleAnomalyIncidentAutoActionSummaryPayload/);
  assert.match(helper, /export function buildScheduleAnomalyIncidentAutoActionResult/);
  assert.ok(countLines(service) <= 3760, `service.ts should stay <= 3760 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 360,
    `anomaly-incident-auto-action-helpers.ts should stay <= 360 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0567/i);
  assert.match(workItem, /scheduling|anomaly|auto-action|summary|result|helper|extraction/i);
  assert.match(roadmap, /WI-0567/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0567-scheduling-anomaly-auto-action-summary-result-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
