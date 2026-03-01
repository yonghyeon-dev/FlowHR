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
    "WI-0729-scheduling-replay-notification-audit-payload-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentReplayedAuditEntry\(/);
  assert.match(service, /buildScheduleAnomalyIncidentReplayGeneratedAuditEntry\(/);
  assert.doesNotMatch(service, /action: "scheduling\.anomaly\.incident\.replay\.generated"/);
  assert.match(replayHelpers, /export function buildScheduleAnomalyIncidentReplayedAuditEntry/);
  assert.match(replayHelpers, /export function buildScheduleAnomalyIncidentReplayGeneratedAuditEntry/);

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");

  const replayedEntry = module.buildScheduleAnomalyIncidentReplayedAuditEntry({
    incidentId: "INC-REPLAY-1",
    replayModel: {
      organizationId: null,
      state: "ACKNOWLEDGED",
      assigneeId: "admin-1",
      resolutionCode: null,
      note: "restored",
      updatedAt: "2026-01-11T08:00:00.000Z",
      updatedBy: {
        actorId: "admin-1",
        actorRole: "ADMIN"
      },
      history: []
    },
    includeArchived: true,
    replayedAt: "2026-01-11T09:00:00.000Z",
    fallbackOrganizationId: "org-fallback",
    actorRole: "ADMIN",
    actorId: "admin-1"
  });

  assert.equal(replayedEntry.action, "scheduling.anomaly.incident.replayed");
  assert.equal(replayedEntry.organizationId, "org-fallback");
  assert.equal(replayedEntry.entityId, "INC-REPLAY-1");

  const generatedPayload = module.buildScheduleAnomalyIncidentReplayGeneratedAuditPayload({
    replayedAt: "2026-01-11T09:00:00.000Z",
    dryRun: false,
    includeArchived: true,
    fromIso: null,
    toIso: null,
    topN: 50,
    incidentIds: ["INC-REPLAY-1"],
    requested: 1,
    summary: {
      replayed: 1,
      dryRunCount: 0,
      notFound: 0,
      failed: 0
    }
  });

  const generatedEntry = module.buildScheduleAnomalyIncidentReplayGeneratedAuditEntry({
    organizationId: "org-1",
    actorRole: "ADMIN",
    actorId: "admin-1",
    payload: generatedPayload
  });

  assert.equal(generatedEntry.action, "scheduling.anomaly.incident.replay.generated");
  assert.equal(generatedEntry.payload.replayed, 1);

  assert.match(workItem, /WI-0729/i);
  assert.match(workItem, /scheduling|replay|notification|audit|payload|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0729-scheduling-replay-notification-audit-payload-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
