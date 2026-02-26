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
  const schedulingService = readUtf8("src", "features", "scheduling", "service.ts");
  const queueHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-queue-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0508-scheduling-anomaly-queue-helper-extraction-line-budget-phase3.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4520,
    `scheduling/service.ts should stay <= 4520 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(queueHelpers) <= 180,
    `anomaly-incident-queue-helpers.ts should stay <= 180 lines (current: ${countLines(queueHelpers)})`
  );

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-incident-queue-helpers";/
  );
  assert.match(schedulingService, /filterScheduleAnomalyIncidentQueue\(/);
  assert.match(schedulingService, /buildScheduleAnomalyIncidentSlaQueue\(/);
  assert.doesNotMatch(schedulingService, /toSlaStatusWeight\(/);

  assert.match(queueHelpers, /export function filterScheduleAnomalyIncidentQueue\(/);
  assert.match(queueHelpers, /export function buildScheduleAnomalyIncidentSlaQueue\(/);
  assert.match(queueHelpers, /resolveScheduleAnomalyIncidentSlaStatus\(/);
  assert.match(queueHelpers, /parseIsoTimestampToMillis\(/);
  assert.match(queueHelpers, /toSlaStatusWeight\(/);

  assert.match(workItem, /WI-0508/i);
  assert.match(workItem, /scheduling|anomaly|queue|helper|line budget|phase3/i);
  assert.match(roadmap, /WI-0508/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0508-scheduling-anomaly-queue-helper-extraction-line-budget-phase3.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
