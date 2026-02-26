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
    "WI-0516-scheduling-anomaly-auto-action-notification-helper-extraction-line-budget-phase11.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4200,
    `scheduling/service.ts should stay <= 4200 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(autoActionHelpers) <= 260,
    `anomaly-incident-auto-action-helpers.ts should stay <= 260 lines (current: ${countLines(autoActionHelpers)})`
  );

  assert.match(
    schedulingService,
    /notifyScheduleAnomalyIncidentAutoActionExecution/
  );
  assert.match(
    schedulingService,
    /notifyScheduleAnomalyIncidentAutoActionExecution\(\{/
  );
  assert.doesNotMatch(schedulingService, /if \(!escalation\.dryRun\)/);

  assert.match(
    autoActionHelpers,
    /export async function notifyScheduleAnomalyIncidentAutoActionExecution\(/ 
  );
  assert.match(
    autoActionHelpers,
    /scheduling\.anomaly\.incident\.auto_action\.notify\.failed/
  );
  assert.match(
    autoActionHelpers,
    /buildScheduleAnomalyIncidentAutoActionEventItems/
  );

  assert.match(workItem, /WI-0516/i);
  assert.match(workItem, /scheduling|anomaly|auto action|notification|helper|line budget|phase11/i);
  assert.match(roadmap, /WI-0516/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0516-scheduling-anomaly-auto-action-notification-helper-extraction-line-budget-phase11.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
