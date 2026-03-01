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
    "WI-0717-scheduling-anomaly-escalation-candidate-helper.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /selectScheduleAnomalyIncidentEscalationCandidates/);
  assert.match(
    service,
    /const candidates = selectScheduleAnomalyIncidentEscalationCandidates\(\s*slaReport\.items,\s*includeWarning\s*\)/
  );
  assert.match(escalationHelpers, /export function selectScheduleAnomalyIncidentEscalationCandidates/);
  assert.match(escalationHelpers, /item\.status === "BREACHED" \|\| \(includeWarning && item\.status === "WARNING"\)/);

  assert.match(workItem, /WI-0717/i);
  assert.match(workItem, /scheduling|anomaly|escalation|candidate|helper/i);
  assert.match(roadmap, /WI-0717/i);
}

run()
  .then(() => {
    console.log("e2e-wi0717-scheduling-anomaly-escalation-candidate-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
