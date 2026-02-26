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
  const incidentListHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-list-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0514-scheduling-anomaly-incident-list-helper-extraction-line-budget-phase9.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4200,
    `scheduling/service.ts should stay <= 4200 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(incidentListHelpers) <= 120,
    `anomaly-incident-list-helpers.ts should stay <= 120 lines (current: ${countLines(incidentListHelpers)})`
  );

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-incident-list-helpers";/
  );
  assert.match(schedulingService, /buildScheduleAnomalyIncidentListResult\(\{/);
  assert.doesNotMatch(schedulingService, /const matched = filterScheduleAnomalyIncidentQueue\(readModels/);

  assert.match(incidentListHelpers, /export function buildScheduleAnomalyIncidentListResult\(/);
  assert.match(incidentListHelpers, /filterScheduleAnomalyIncidentQueue\(/);
  assert.match(incidentListHelpers, /cloneScheduleAnomalyIncidentReadModel/);

  assert.match(workItem, /WI-0514/i);
  assert.match(workItem, /scheduling|anomaly|incident list|helper|line budget|phase9/i);
  assert.match(roadmap, /WI-0514/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0514-scheduling-anomaly-incident-list-helper-extraction-line-budget-phase9.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
