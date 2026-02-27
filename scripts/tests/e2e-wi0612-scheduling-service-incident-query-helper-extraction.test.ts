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
  const queryHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-query-service-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0612-scheduling-service-incident-query-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/anomaly-incident-query-service-helpers"/);
  assert.match(service, /return listScheduleAnomalyIncidentsFromHelper\(context, input\);/);
  assert.match(service, /return getScheduleAnomalyIncidentFromHelper\(context, incidentId\);/);
  assert.doesNotMatch(service, /action: "scheduling\.anomaly\.incident\.listed"/);
  assert.doesNotMatch(service, /action: "scheduling\.anomaly\.incident\.read"/);

  assert.match(queryHelpers, /export async function listScheduleAnomalyIncidentsFromHelper\(/);
  assert.match(queryHelpers, /export async function getScheduleAnomalyIncidentFromHelper\(/);
  assert.match(queryHelpers, /requireSchedulingWriteActor\(/);
  assert.match(queryHelpers, /buildAnomalyIncidentListAuditPayload\(/);
  assert.match(queryHelpers, /buildScheduleAnomalyIncidentReadAuditPayload\(/);
  assert.match(queryHelpers, /resolveScheduleAnomalyIncidentForActor\(/);
  assert.match(queryHelpers, /cloneScheduleAnomalyIncidentReadModel\(/);

  assert.ok(
    countLines(service) <= 3320,
    `scheduling/service.ts should stay <= 3320 lines (current: ${countLines(service)})`
  );
  assert.ok(
    countLines(queryHelpers) <= 180,
    `anomaly-incident-query-service-helpers.ts should stay <= 180 lines (current: ${countLines(
      queryHelpers
    )})`
  );

  assert.match(workItem, /WI-0612/i);
  assert.match(workItem, /scheduling|incident|query|helper|extraction/i);
  assert.match(roadmap, /WI-0612/i);
}

run()
  .then(() => {
    console.log("e2e-wi0612-scheduling-service-incident-query-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
