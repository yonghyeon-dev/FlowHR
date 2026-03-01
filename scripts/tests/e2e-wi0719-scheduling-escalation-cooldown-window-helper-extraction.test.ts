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
    "WI-0719-scheduling-escalation-cooldown-window-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /resolveScheduleAnomalyIncidentEscalationCooldownWindowStartMillis/);
  assert.match(
    service,
    /resolveScheduleAnomalyIncidentEscalationCooldownWindowStartMillis\(asOf, cooldownMinutes\)/
  );

  assert.match(
    escalationHelpers,
    /export function resolveScheduleAnomalyIncidentEscalationCooldownWindowStartMillis/
  );
  assert.match(escalationHelpers, /return asOf\.getTime\(\) - cooldownMinutes \* 60_000;/);

  assert.match(workItem, /WI-0719/i);
  assert.match(workItem, /scheduling|escalation|cooldown|window|helper/i);
  assert.match(roadmap, /WI-0719/i);
}

run()
  .then(() => {
    console.log("e2e-wi0719-scheduling-escalation-cooldown-window-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
