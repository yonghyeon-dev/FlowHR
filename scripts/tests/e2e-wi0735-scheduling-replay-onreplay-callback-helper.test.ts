import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const replayHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-replay-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0735-scheduling-replay-onreplay-callback-helper.md"
  );

  assert.match(service, /mergeScheduleAnomalyIncidentReplayLastEscalationRequestedAt\(\{/);
  assert.match(
    replayHelpers,
    /export function mergeScheduleAnomalyIncidentReplayLastEscalationRequestedAt/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");

  const merged = module.mergeScheduleAnomalyIncidentReplayLastEscalationRequestedAt({
    upsertInput: {
      incidentId: "INC-REPLAY-1",
      state: "ASSIGNED",
      note: "restored"
    },
    lastEscalationRequestedAt: "2026-01-14T08:00:00.000Z"
  });

  assert.equal(merged.incidentId, "INC-REPLAY-1");
  assert.equal(merged.lastEscalationRequestedAt, "2026-01-14T08:00:00.000Z");

  const mergedWithoutExisting = module.mergeScheduleAnomalyIncidentReplayLastEscalationRequestedAt({
    upsertInput: {
      incidentId: "INC-REPLAY-2",
      state: "ACKNOWLEDGED"
    },
    lastEscalationRequestedAt: undefined
  });

  assert.equal(mergedWithoutExisting.lastEscalationRequestedAt, null);

  assert.match(workItem, /WI-0735/i);
  assert.match(workItem, /scheduling|replay|onreplay|callback|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0735-scheduling-replay-onreplay-callback-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
