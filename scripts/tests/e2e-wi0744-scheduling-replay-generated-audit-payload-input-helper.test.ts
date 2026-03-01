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
    "WI-0744-scheduling-replay-generated-audit-payload-input-helper.md"
  );

  assert.match(
    service,
    /buildScheduleAnomalyIncidentReplayGeneratedAuditPayloadInputFromMetaAndSummary\(\{/
  );
  assert.match(
    replayHelpers,
    /export function buildScheduleAnomalyIncidentReplayGeneratedAuditPayloadInputFromMetaAndSummary/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");

  const input = module.buildScheduleAnomalyIncidentReplayGeneratedAuditPayloadInputFromMetaAndSummary(
    {
      replayMeta: {
        replayedAt: "2026-01-25T08:00:00.000Z",
        dryRun: false,
        includeArchived: true,
        fromIso: "2026-01-24T00:00:00.000Z",
        toIso: "2026-01-25T00:00:00.000Z",
        topN: 50,
        incidentIds: ["INC-1"],
        requested: 3
      },
      replaySummary: {
        replayed: 2,
        dryRunCount: 0,
        notFound: 1,
        failed: 0
      }
    }
  );

  assert.deepEqual(input, {
    replayedAt: "2026-01-25T08:00:00.000Z",
    dryRun: false,
    includeArchived: true,
    fromIso: "2026-01-24T00:00:00.000Z",
    toIso: "2026-01-25T00:00:00.000Z",
    topN: 50,
    incidentIds: ["INC-1"],
    requested: 3,
    summary: {
      replayed: 2,
      dryRunCount: 0,
      notFound: 1,
      failed: 0
    }
  });

  assert.match(workItem, /WI-0744/i);
  assert.match(workItem, /scheduling|replay|generated|audit|payload|input|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0744-scheduling-replay-generated-audit-payload-input-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
