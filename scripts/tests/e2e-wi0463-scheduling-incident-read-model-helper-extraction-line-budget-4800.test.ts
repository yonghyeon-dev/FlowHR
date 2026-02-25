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
  const serviceSource = readUtf8("src", "features", "scheduling", "service.ts");
  const helperSource = readUtf8(
    "src",
    "features",
    "scheduling",
    "incident-read-model-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0463-scheduling-incident-read-model-helper-extraction-line-budget-4800.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    serviceSource,
    /from "@\/features\/scheduling\/incident-read-model-helpers"/
  );
  assert.match(serviceSource, /listScheduleAnomalyIncidentReadModels\(context\.dataAccess,/);
  assert.match(serviceSource, /getScheduleAnomalyIncidentReadModel\(context\.dataAccess,/);
  assert.match(serviceSource, /toScheduleAnomalyIncidentUpsertInput\(/);

  assert.doesNotMatch(serviceSource, /async function listScheduleAnomalyIncidentReadModels\(/);
  assert.doesNotMatch(serviceSource, /async function getScheduleAnomalyIncidentReadModel\(/);
  assert.doesNotMatch(serviceSource, /function toScheduleAnomalyIncidentReadModelFromEntity\(/);
  assert.doesNotMatch(serviceSource, /function toScheduleAnomalyIncidentUpsertInput\(/);

  assert.ok(
    countLines(serviceSource) <= 4800,
    `scheduling/service.ts should stay <= 4800 lines (current: ${countLines(serviceSource)})`
  );

  assert.match(helperSource, /export const MAX_ANOMALY_INCIDENT_HISTORY = 50;/);
  assert.match(helperSource, /export async function listScheduleAnomalyIncidentReadModels\(/);
  assert.match(helperSource, /export async function getScheduleAnomalyIncidentReadModel\(/);
  assert.match(helperSource, /export async function listScheduleAnomalyIncidentReadModelsFromStore\(/);
  assert.match(helperSource, /export function toScheduleAnomalyIncidentUpsertInput\(/);

  assert.match(workItem, /WI-0463/i);
  assert.match(workItem, /scheduling|incident|read-model|helper|extraction|line budget/i);
  assert.match(roadmap, /WI-0463/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0463-scheduling-incident-read-model-helper-extraction-line-budget-4800.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
