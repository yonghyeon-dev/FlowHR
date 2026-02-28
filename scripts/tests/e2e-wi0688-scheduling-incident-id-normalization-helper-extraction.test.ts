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
  const contextHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-service-context-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0688-scheduling-incident-id-normalization-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schedulingService, /normalizeRequiredIncidentId\(input\.incidentId\)/);
  assert.doesNotMatch(schedulingService, /const incidentId = input\.incidentId\.trim\(\);/);
  assert.match(contextHelpers, /export function normalizeRequiredIncidentId\(incidentId: string\)/);
  assert.match(contextHelpers, /throw new ServiceError\(400, "incidentId is required"\);/);

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );

  assert.match(workItem, /WI-0688/i);
  assert.match(workItem, /scheduling|incidentId|normalization|helper|extraction/i);
  assert.match(roadmap, /WI-0688/i);
}

run()
  .then(() => {
    console.log("e2e-wi0688-scheduling-incident-id-normalization-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
