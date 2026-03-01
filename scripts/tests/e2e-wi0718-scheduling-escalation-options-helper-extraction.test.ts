import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const escalationHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-escalation-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0718-scheduling-escalation-options-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /resolveScheduleAnomalyIncidentEscalationOptions/);
  assert.match(
    service,
    /const \{ includeResolved, includeWarning, dryRun, cooldownMinutes, escalationChannel, asOf \} =\s*resolveScheduleAnomalyIncidentEscalationOptions\(input\)/
  );

  assert.match(escalationHelpers, /export function resolveScheduleAnomalyIncidentEscalationOptions/);
  assert.match(escalationHelpers, /normalizeAnomalyIncidentEscalationCooldownMinutes/);
  assert.match(escalationHelpers, /normalizeAnomalyIncidentEscalationChannel/);
  assert.match(escalationHelpers, /const asOf = input\.asOf \?\? new Date\(\)/);

  assert.match(workItem, /WI-0718/i);
  assert.match(workItem, /scheduling|escalation|options|helper|extraction/i);
  assert.match(roadmap, /WI-0718/i);
}

run()
  .then(() => {
    console.log("e2e-wi0718-scheduling-escalation-options-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
