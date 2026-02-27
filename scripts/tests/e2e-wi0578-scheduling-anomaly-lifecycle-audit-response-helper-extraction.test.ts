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
  const helper = readUtf8("src", "features", "scheduling", "anomaly-incident-core-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0578-scheduling-anomaly-lifecycle-audit-response-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /buildAnomalyIncidentLifecycleAuditPayload/);
  assert.match(service, /buildAnomalyIncidentLifecycleResponse/);
  assert.match(service, /const payload = buildAnomalyIncidentLifecycleAuditPayload\(\{/);
  assert.match(service, /return buildAnomalyIncidentLifecycleResponse\(incidentId, lifecycleUpdate\.historyEntry\)/);
  assert.doesNotMatch(service, /const payload = \{\s*\.\.\.lifecycleUpdate\.payload,\s*incidentId/);

  assert.match(helper, /export function buildAnomalyIncidentLifecycleAuditPayload/);
  assert.match(helper, /export function buildAnomalyIncidentLifecycleResponse/);
  assert.ok(countLines(service) <= 3695, `service.ts should stay <= 3695 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(helper) <= 280,
    `anomaly-incident-core-helpers.ts should stay <= 280 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0578/i);
  assert.match(workItem, /scheduling|anomaly|lifecycle|audit|response|helper|extraction/i);
  assert.match(roadmap, /WI-0578/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0578-scheduling-anomaly-lifecycle-audit-response-helper-extraction.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

