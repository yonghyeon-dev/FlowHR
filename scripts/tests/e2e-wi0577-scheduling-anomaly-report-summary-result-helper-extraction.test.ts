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
  const helper = readUtf8("src", "features", "scheduling", "anomaly-report-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0577-scheduling-anomaly-report-summary-result-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAttendanceAnomalyReportAuditPayload/);
  assert.match(service, /buildScheduleAttendanceAnomalyReport/);
  assert.match(service, /payload: buildScheduleAttendanceAnomalyReportAuditPayload\(\{/);
  assert.match(service, /return buildScheduleAttendanceAnomalyReport\(\{/);
  assert.doesNotMatch(
    service,
    /action:\s*"scheduling\.anomaly\.report\.generated"[\s\S]{0,240}payload:\s*\{/
  );

  assert.match(helper, /export function buildScheduleAttendanceAnomalyReportAuditPayload/);
  assert.match(helper, /export function buildScheduleAttendanceAnomalyReport/);
  assert.ok(countLines(service) <= 3705, `service.ts should stay <= 3705 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 260,
    `anomaly-report-helpers.ts should stay <= 260 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0577/i);
  assert.match(workItem, /scheduling|anomaly|report|summary|result|helper|extraction/i);
  assert.match(roadmap, /WI-0577/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0577-scheduling-anomaly-report-summary-result-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

