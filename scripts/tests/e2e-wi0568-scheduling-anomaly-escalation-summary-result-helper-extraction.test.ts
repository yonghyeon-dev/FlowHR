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
  const helper = readUtf8("src", "features", "scheduling", "anomaly-incident-escalation-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0568-scheduling-anomaly-escalation-summary-result-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAnomalyIncidentEscalationSummaryPayload/);
  assert.match(service, /buildScheduleAnomalyIncidentEscalationResult/);
  assert.match(service, /payload: buildScheduleAnomalyIncidentEscalationSummaryPayload\(\{/);
  assert.match(service, /return buildScheduleAnomalyIncidentEscalationResult\(\{/);
  assert.doesNotMatch(
    service,
    /payload: \{[\s\S]*?requestedAt,[\s\S]*?includeResolved,[\s\S]*?topN: input\.topN \?\? 50/
  );

  assert.match(helper, /export function buildScheduleAnomalyIncidentEscalationSummaryPayload/);
  assert.match(helper, /export function buildScheduleAnomalyIncidentEscalationResult/);
  assert.ok(countLines(service) <= 3745, `service.ts should stay <= 3745 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 280,
    `anomaly-incident-escalation-helpers.ts should stay <= 280 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0568/i);
  assert.match(workItem, /scheduling|anomaly|escalation|summary|result|helper|extraction/i);
  assert.match(roadmap, /WI-0568/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0568-scheduling-anomaly-escalation-summary-result-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
