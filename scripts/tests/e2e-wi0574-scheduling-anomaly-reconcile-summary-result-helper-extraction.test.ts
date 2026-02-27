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
  const helper = readUtf8("src", "features", "scheduling", "anomaly-incident-reconcile-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0574-scheduling-anomaly-reconcile-summary-result-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload/);
  assert.match(service, /buildScheduleAnomalyIncidentReconcileResult/);
  assert.match(
    service,
    /payload: buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload\(\{/
  );
  assert.match(service, /return buildScheduleAnomalyIncidentReconcileResult\(\{/);
  assert.doesNotMatch(
    service,
    /payload:\s*\{\s*reconciledAt,\s*topN,\s*includeMatching,\s*compared:\s*compared\.length/
  );

  assert.match(helper, /export function buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload/);
  assert.match(helper, /export function buildScheduleAnomalyIncidentReconcileResult/);
  assert.ok(countLines(service) <= 3710, `service.ts should stay <= 3710 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 220,
    `anomaly-incident-reconcile-helpers.ts should stay <= 220 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0574/i);
  assert.match(workItem, /scheduling|anomaly|reconcile|summary|result|helper|extraction/i);
  assert.match(roadmap, /WI-0574/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0574-scheduling-anomaly-reconcile-summary-result-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
