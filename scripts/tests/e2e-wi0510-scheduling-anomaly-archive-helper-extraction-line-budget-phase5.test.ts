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
  const archiveHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-archive-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0510-scheduling-anomaly-archive-helper-extraction-line-budget-phase5.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4380,
    `scheduling/service.ts should stay <= 4380 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(archiveHelpers) <= 220,
    `anomaly-incident-archive-helpers.ts should stay <= 220 lines (current: ${countLines(archiveHelpers)})`
  );

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-incident-archive-helpers";/
  );
  assert.match(schedulingService, /buildScheduleAnomalyIncidentArchiveCandidates\(\{/);
  assert.match(schedulingService, /executeScheduleAnomalyIncidentArchiveActions\(\{/);
  assert.doesNotMatch(schedulingService, /const sorted = incidents\.slice\(\)\.sort/);
  assert.doesNotMatch(
    schedulingService,
    /const eligible:\s*ScheduleAnomalyIncidentEntity\[\]\s*=\s*\[\]/
  );

  assert.match(archiveHelpers, /export function buildScheduleAnomalyIncidentArchiveCandidates\(/);
  assert.match(archiveHelpers, /export async function executeScheduleAnomalyIncidentArchiveActions\(/);
  assert.match(archiveHelpers, /decision: "DRY_RUN"/);
  assert.match(archiveHelpers, /decision: "ARCHIVED"/);
  assert.match(archiveHelpers, /decision: "FAILED"/);

  assert.match(workItem, /WI-0510/i);
  assert.match(workItem, /scheduling|anomaly|archive|helper|line budget|phase5/i);
  assert.match(roadmap, /WI-0510/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0510-scheduling-anomaly-archive-helper-extraction-line-budget-phase5.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
