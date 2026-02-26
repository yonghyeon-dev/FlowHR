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
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const helpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-core-helpers.ts"
  );
  const workItem = readUtf8("work-items", "WI-0565-scheduling-anomaly-incident-core-helper-extraction.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/anomaly-incident-core-helpers"/);
  assert.match(service, /normalizeAnomalyIncidentLifecycleMutationInput\(/);
  assert.match(service, /buildAnomalyIncidentLifecycleUpdateResult\(/);
  assert.match(service, /buildAnomalyIncidentListAuditPayload\(/);
  assert.match(service, /buildAnomalyIncidentSlaAuditPayload\(/);
  assert.match(service, /buildAnomalyIncidentSlaReport\(/);

  assert.match(helpers, /export function normalizeAnomalyIncidentLifecycleMutationInput/);
  assert.match(helpers, /export function buildAnomalyIncidentLifecycleUpdateResult/);
  assert.match(helpers, /export function buildAnomalyIncidentListAuditPayload/);
  assert.match(helpers, /export function buildAnomalyIncidentSlaAuditPayload/);
  assert.match(helpers, /export function buildAnomalyIncidentSlaReport/);

  assert.doesNotMatch(service, /assigneeId is required when action is ASSIGN/);
  assert.doesNotMatch(service, /resolutionCode is only allowed when action is RESOLVE/);

  assert.ok(
    countLines(service) <= 4000,
    `scheduling/service.ts should stay <= 4000 lines (current: ${countLines(service)})`
  );

  assert.match(workItem, /WI-0565/i);
  assert.match(workItem, /scheduling|anomaly|incident|core|helper|extraction/i);
  assert.match(roadmap, /WI-0565/i);
}

run()
  .then(() => {
    console.log("e2e-wi0565-scheduling-anomaly-incident-core-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
