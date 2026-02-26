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
  const readHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-read-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0515-scheduling-anomaly-read-helper-extraction-line-budget-phase10.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4200,
    `scheduling/service.ts should stay <= 4200 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(readHelpers) <= 120,
    `anomaly-incident-read-helpers.ts should stay <= 120 lines (current: ${countLines(readHelpers)})`
  );

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-incident-read-helpers";/
  );
  assert.match(schedulingService, /resolveScheduleAnomalyIncidentForActor\(\{/);
  assert.doesNotMatch(
    schedulingService,
    /const incident = await getScheduleAnomalyIncidentReadModel\(context\.dataAccess,\s*normalizedIncidentId\)/
  );

  assert.match(readHelpers, /export async function resolveScheduleAnomalyIncidentForActor\(/);
  assert.match(readHelpers, /incidentId is required/);
  assert.match(readHelpers, /anomaly incident not found/);

  assert.match(workItem, /WI-0515/i);
  assert.match(workItem, /scheduling|anomaly|read|helper|line budget|phase10/i);
  assert.match(roadmap, /WI-0515/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0515-scheduling-anomaly-read-helper-extraction-line-budget-phase10.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
