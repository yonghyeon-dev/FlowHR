import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const slaQueryHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-sla-query-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0716-scheduling-anomaly-sla-query-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /resolveScheduleAnomalyIncidentSlaQueryInput/);
  assert.match(
    service,
    /const \{ topN, assigneeId, includeResolved, slaTargetMinutes, warningMinutes, asOf, asOfMillis \} =\s*resolveScheduleAnomalyIncidentSlaQueryInput\(input\)/
  );

  assert.match(slaQueryHelpers, /normalizeIncidentListTopN/);
  assert.match(slaQueryHelpers, /resolveAnomalyIncidentSlaTargetMinutes/);
  assert.match(slaQueryHelpers, /resolveAnomalyIncidentWarningMinutes/);
  assert.match(slaQueryHelpers, /asOfMillis: asOf\.getTime\(\)/);

  assert.match(workItem, /WI-0716/i);
  assert.match(workItem, /scheduling|anomaly|sla|query|helper|extraction/i);
  assert.match(roadmap, /WI-0716/i);
}

run()
  .then(() => {
    console.log("e2e-wi0716-scheduling-anomaly-sla-query-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
