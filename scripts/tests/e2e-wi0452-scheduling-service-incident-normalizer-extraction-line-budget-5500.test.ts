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
  const serviceSource = readUtf8("src", "features", "scheduling", "service.ts");
  const helperSource = readUtf8("src", "features", "scheduling", "incident-normalizers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0452-scheduling-service-incident-normalizer-extraction-line-budget-5500.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(serviceSource, /from "@\/features\/scheduling\/incident-normalizers"/);
  assert.match(serviceSource, /normalizeIncidentListTopN,/);
  assert.match(serviceSource, /resolveAnomalyIncidentSlaTargetMinutes,/);
  assert.match(serviceSource, /parseIsoTimestampToMillis,/);
  assert.doesNotMatch(serviceSource, /function parseAnomalyIncidentSlaMinutesEnvValue\(/);
  assert.doesNotMatch(serviceSource, /function normalizeAnomalyIncidentReplayIncidentIds\(/);
  assert.ok(
    countLines(serviceSource) <= 5500,
    `scheduling/service.ts should stay <= 5500 lines after WI-0452 (current: ${countLines(serviceSource)})`
  );

  assert.match(helperSource, /export function normalizeIncidentListTopN\(/);
  assert.match(helperSource, /export function resolveAnomalyIncidentSlaTargetMinutes\(/);
  assert.match(helperSource, /export function normalizeAnomalyIncidentReplayIncidentIds\(/);
  assert.match(helperSource, /export function parseIsoTimestampToMillis\(/);

  assert.match(workItem, /WI-0452/i);
  assert.match(workItem, /scheduling|incident|normalizer|extraction|line budget/i);
  assert.match(roadmap, /WI-0452/i);
}

run()
  .then(() => {
    console.log("e2e-wi0452-scheduling-service-incident-normalizer-extraction-line-budget-5500.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
