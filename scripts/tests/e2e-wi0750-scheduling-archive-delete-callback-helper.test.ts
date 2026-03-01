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
    "WI-0750-scheduling-archive-delete-callback-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentArchiveDeleteIncidentCallback\(\{/);
  assert.match(service, /deleteIncident:\s*deleteArchivedIncident/);
  assert.match(
    helpers,
    /export function buildScheduleAnomalyIncidentArchiveDeleteIncidentCallback/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-archive-helpers.ts");
  const calls: Array<{ incidentId: string; organizationId: string | undefined }> = [];

  const callback = module.buildScheduleAnomalyIncidentArchiveDeleteIncidentCallback({
    organizationId: "org-archive",
    deleteIncident: async (input) => {
      calls.push(input);
      return true;
    }
  });

  const deleted = await callback({ incidentId: "INC-ARCHIVE-2" });
  assert.equal(deleted, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    incidentId: "INC-ARCHIVE-2",
    organizationId: "org-archive"
  });

  assert.match(workItem, /WI-0750/i);
  assert.match(workItem, /scheduling|archive|delete|callback|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0750-scheduling-archive-delete-callback-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
