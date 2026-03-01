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
    "WI-0738-scheduling-replay-persistence-input-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentReplayPersistenceInput\(\{/);
  assert.match(service, /replayPersistence\.upsertInput/);
  assert.match(service, /replayPersistence\.auditEntry/);
  assert.match(
    replayHelpers,
    /export function buildScheduleAnomalyIncidentReplayPersistenceInput/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");

  const replayedAt = "2026-01-17T11:00:00.000Z";
  const persistence = module.buildScheduleAnomalyIncidentReplayPersistenceInput({
    incidentId: "INC-REPLAY-PERSIST-1",
    replayModel: {
      incidentId: "INC-REPLAY-PERSIST-1",
      organizationId: "org-replay",
      state: "ASSIGNED",
      assigneeId: "manager-7",
      resolutionCode: null,
      note: "restored from audit",
      updatedAt: "2026-01-17T10:00:00.000Z",
      updatedBy: {
        actorId: "actor-1",
        actorRole: "ADMIN"
      },
      history: [
        {
          action: "ACKNOWLEDGE",
          state: "ACKNOWLEDGED",
          assigneeId: "manager-7",
          resolutionCode: null,
          note: "acknowledged",
          updatedAt: "2026-01-17T09:30:00.000Z",
          updatedBy: {
            actorId: "actor-1",
            actorRole: "ADMIN"
          }
        }
      ]
    },
    includeArchived: true,
    replayedAt,
    lastEscalationRequestedAt: "2026-01-17T09:00:00.000Z",
    fallbackOrganizationId: "fallback-org",
    actorRole: "ADMIN",
    actorId: "actor-1",
    toUpsertInput: (replayModel) => ({
      incidentId: replayModel.incidentId,
      state: replayModel.state,
      assigneeId: replayModel.assigneeId
    })
  });

  assert.equal(persistence.upsertInput.incidentId, "INC-REPLAY-PERSIST-1");
  assert.equal(
    persistence.upsertInput.lastEscalationRequestedAt,
    "2026-01-17T09:00:00.000Z"
  );
  assert.equal(
    persistence.auditEntry.action,
    "scheduling.anomaly.incident.replayed"
  );
  assert.equal(persistence.auditEntry.entityId, "INC-REPLAY-PERSIST-1");
  assert.equal(persistence.auditEntry.payload.replayedAt, replayedAt);

  assert.match(workItem, /WI-0738/i);
  assert.match(workItem, /scheduling|replay|persistence|input|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0738-scheduling-replay-persistence-input-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
