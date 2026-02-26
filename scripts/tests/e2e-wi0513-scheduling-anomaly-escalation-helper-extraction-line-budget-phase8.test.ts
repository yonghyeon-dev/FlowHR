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
  const escalationHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-escalation-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0513-scheduling-anomaly-escalation-helper-extraction-line-budget-phase8.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4200,
    `scheduling/service.ts should stay <= 4200 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(escalationHelpers) <= 220,
    `anomaly-incident-escalation-helpers.ts should stay <= 220 lines (current: ${countLines(escalationHelpers)})`
  );

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-incident-escalation-helpers";/
  );
  assert.match(
    schedulingService,
    /buildLatestScheduleAnomalyEscalationRequestedAtMillisByIncident\(storedIncidents\)/
  );
  assert.match(schedulingService, /executeScheduleAnomalyIncidentEscalationRequests\(\{/);
  assert.doesNotMatch(schedulingService, /const latestRequestedAtMillisByIncident = new Map<string, number>\(\)/);
  assert.doesNotMatch(
    schedulingService,
    /for \(const candidate of candidates\)[\s\S]*const lastRequestedAtMillis/
  );

  assert.match(
    escalationHelpers,
    /export function buildLatestScheduleAnomalyEscalationRequestedAtMillisByIncident\(/);
  assert.match(
    escalationHelpers,
    /export async function executeScheduleAnomalyIncidentEscalationRequests\(/
  );
  assert.match(escalationHelpers, /decision: "SKIPPED_COOLDOWN"/);
  assert.match(escalationHelpers, /decision: "DRY_RUN"/);
  assert.match(escalationHelpers, /decision: "REQUESTED"/);
  assert.match(escalationHelpers, /decision: "FAILED"/);

  assert.match(workItem, /WI-0513/i);
  assert.match(workItem, /scheduling|anomaly|escalation|helper|line budget|phase8/i);
  assert.match(roadmap, /WI-0513/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0513-scheduling-anomaly-escalation-helper-extraction-line-budget-phase8.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
