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
  const helper = readUtf8("src", "features", "scheduling", "anomaly-cockpit-report-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0575-scheduling-anomaly-cockpit-summary-result-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAttendanceAnomalyCockpitAuditPayload/);
  assert.match(service, /buildScheduleAttendanceAnomalyCockpitReport/);
  assert.match(service, /payload: buildScheduleAttendanceAnomalyCockpitAuditPayload\(\{/);
  assert.match(service, /return buildScheduleAttendanceAnomalyCockpitReport\(\{/);
  assert.doesNotMatch(
    service,
    /action:\s*"scheduling\.anomaly\.cockpit\.generated"[\s\S]{0,240}payload:\s*\{/
  );

  assert.match(helper, /export function buildScheduleAttendanceAnomalyCockpitAuditPayload/);
  assert.match(helper, /export function buildScheduleAttendanceAnomalyCockpitReport/);
  assert.ok(countLines(service) <= 3710, `service.ts should stay <= 3710 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 240,
    `anomaly-cockpit-report-helpers.ts should stay <= 240 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0575/i);
  assert.match(workItem, /scheduling|anomaly|cockpit|summary|result|helper|extraction/i);
  assert.match(roadmap, /WI-0575/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0575-scheduling-anomaly-cockpit-summary-result-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
