import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const helpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-archive-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0751-scheduling-archive-actions-input-helper.md"
  );

  assert.match(service, /const archiveActionsInput = buildScheduleAnomalyIncidentArchiveActionsInput\(\{/);
  assert.match(service, /executeScheduleAnomalyIncidentArchiveActions\(archiveActionsInput\)/);
  assert.match(helpers, /export function buildScheduleAnomalyIncidentArchiveActionsInput/);

  const module = await import("../../src/features/scheduling/anomaly-incident-archive-helpers.ts");
  const deleteIncident = async ({ incidentId }: { incidentId: string }) => incidentId.length > 0;
  const onArchived = async () => undefined;
  const input = module.buildScheduleAnomalyIncidentArchiveActionsInput({
    candidates: [],
    dryRun: true,
    deleteIncident,
    onArchived
  });

  assert.equal(Array.isArray(input.candidates), true);
  assert.equal(input.dryRun, true);
  assert.equal(input.deleteIncident, deleteIncident);
  assert.equal(input.onArchived, onArchived);

  assert.match(workItem, /WI-0751/i);
  assert.match(workItem, /scheduling|archive|actions|input|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0751-scheduling-archive-actions-input-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
