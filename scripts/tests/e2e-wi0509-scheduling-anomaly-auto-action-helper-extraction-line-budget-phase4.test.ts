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
  const autoActionHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-auto-action-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0509-scheduling-anomaly-auto-action-helper-extraction-line-budget-phase4.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4450,
    `scheduling/service.ts should stay <= 4450 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(autoActionHelpers) <= 220,
    `anomaly-incident-auto-action-helpers.ts should stay <= 220 lines (current: ${countLines(autoActionHelpers)})`
  );

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-incident-auto-action-helpers";/
  );
  assert.match(schedulingService, /executeScheduleAnomalyIncidentAutoActionAssignments\(\{/);
  assert.doesNotMatch(schedulingService, /for \(const escalationItem of escalation\.items\)/);

  assert.match(
    autoActionHelpers,
    /export async function executeScheduleAnomalyIncidentAutoActionAssignments\(/
  );
  assert.match(autoActionHelpers, /decision: "SKIPPED_ESCALATION"/);
  assert.match(autoActionHelpers, /decision: "SKIPPED_ALREADY_ASSIGNED"/);
  assert.match(autoActionHelpers, /decision: "SKIPPED_SAME_ASSIGNEE"/);
  assert.match(autoActionHelpers, /decision: "DRY_RUN"/);
  assert.match(autoActionHelpers, /decision: "ASSIGNED"/);
  assert.match(autoActionHelpers, /decision: "FAILED"/);

  assert.match(workItem, /WI-0509/i);
  assert.match(workItem, /scheduling|anomaly|auto action|helper|line budget|phase4/i);
  assert.match(roadmap, /WI-0509/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0509-scheduling-anomaly-auto-action-helper-extraction-line-budget-phase4.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
