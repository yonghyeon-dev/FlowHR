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
  const automationHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-automation-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0460-scheduling-anomaly-automation-helper-extraction-line-budget-5100.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-automation-helpers"/
  );
  assert.match(schedulingService, /buildAnomalyAlertPayload/);
  assert.match(schedulingService, /buildAnomalyEscalationPayload/);
  assert.match(schedulingService, /buildAnomalyTicketRequestPayload/);
  assert.match(schedulingService, /classifyAnomalyEscalationSeverity/);
  assert.match(schedulingService, /anomalyEscalationSeverityWeight/);
  assert.match(schedulingService, /parseAnomalySeverityFromEnv/);
  assert.match(schedulingService, /parsePositiveIntegerRangeFromEnv/);

  assert.doesNotMatch(schedulingService, /function isSchedulingAnomalyAlertsEnabled\(/);
  assert.doesNotMatch(schedulingService, /function parseAnomalyEscalationRouting\(/);
  assert.doesNotMatch(schedulingService, /function buildAnomalyTicketRequestPayload\(/);
  assert.doesNotMatch(schedulingService, /type AnomalyEscalationSeverity = "MINOR" \| "MAJOR" \| "CRITICAL"/);

  assert.ok(
    countLines(schedulingService) <= 5100,
    `scheduling/service.ts should stay <= 5100 lines (current: ${countLines(schedulingService)})`
  );

  assert.match(
    automationHelpers,
    /export type AnomalyEscalationSeverity = "MINOR" \| "MAJOR" \| "CRITICAL";/
  );
  assert.match(automationHelpers, /export function isSchedulingAnomalyAlertsEnabled\(/);
  assert.match(automationHelpers, /export function buildAnomalyAlertPayload\(/);
  assert.match(automationHelpers, /export function buildAnomalyEscalationPayload\(/);
  assert.match(automationHelpers, /export function buildAnomalyTicketRequestPayload\(/);

  assert.match(workItem, /WI-0460/i);
  assert.match(
    workItem,
    /scheduling|anomaly|automation|helper|extraction|line budget/i
  );
  assert.match(roadmap, /WI-0460/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0460-scheduling-anomaly-automation-helper-extraction-line-budget-5100.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
