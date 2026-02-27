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
    "WI-0569-scheduling-anomaly-escalation-request-payload-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAnomalyIncidentEscalationRequestPayload/);
  assert.match(service, /buildScheduleAnomalyIncidentEscalationRequestFailedPayload/);
  assert.match(service, /const payload = buildScheduleAnomalyIncidentEscalationRequestPayload\(\{/);
  assert.match(
    service,
    /payload: buildScheduleAnomalyIncidentEscalationRequestFailedPayload\(\{/
  );

  assert.match(helper, /export function buildScheduleAnomalyIncidentEscalationRequestPayload/);
  assert.match(helper, /export function buildScheduleAnomalyIncidentEscalationRequestFailedPayload/);
  assert.ok(countLines(service) <= 3740, `service.ts should stay <= 3740 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 280,
    `anomaly-incident-escalation-helpers.ts should stay <= 280 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0569/i);
  assert.match(workItem, /scheduling|anomaly|escalation|request|payload|helper|extraction/i);
  assert.match(roadmap, /WI-0569/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0569-scheduling-anomaly-escalation-request-payload-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
