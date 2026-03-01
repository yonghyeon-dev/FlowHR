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
    "WI-0740-scheduling-replay-existing-state-helper.md"
  );

  assert.match(service, /const replayOnReplay = buildScheduleAnomalyIncidentReplayOnReplayCallback\(\{/);
  assert.match(service, /onReplay:\s*replayOnReplay/);
  assert.match(
    replayHelpers,
    /export function buildScheduleAnomalyIncidentReplayOnReplayCallback/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");

  const captured: {
    upsertInput?: Record<string, unknown>;
    auditEntry?: Record<string, unknown>;
  } = {};

  const replayOnReplay = module.buildScheduleAnomalyIncidentReplayOnReplayCallback({
    includeArchived: true,
    fallbackOrganizationId: "org-fallback",
    actorRole: "ADMIN",
    actorId: "actor-1",
    findIncidentByIncidentId: async () => ({
      lastEscalationRequestedAt: "2026-01-20T08:00:00.000Z"
    }),
    upsertIncident: async (upsertInput) => {
      captured.upsertInput = upsertInput as Record<string, unknown>;
    },
    appendAuditEntry: async (auditEntry) => {
      captured.auditEntry = auditEntry as unknown as Record<string, unknown>;
    },
    toUpsertInput: (replayModel) => ({
      state: replayModel.state,
      assigneeId: replayModel.assigneeId
    })
  });

  await replayOnReplay({
    incidentId: "INC-0740",
    replayModel: {
      organizationId: "org-replay",
      state: "ASSIGNED",
      assigneeId: "manager-2",
      resolutionCode: null,
      note: "replayed",
      updatedAt: "2026-01-20T09:00:00.000Z",
      updatedBy: {
        actorId: "actor-1",
        actorRole: "ADMIN"
      },
      history: []
    }
  });

  assert.equal(captured.upsertInput?.state, "ASSIGNED");
  assert.equal(
    captured.upsertInput?.lastEscalationRequestedAt,
    "2026-01-20T08:00:00.000Z"
  );
  assert.equal(captured.auditEntry?.action, "scheduling.anomaly.incident.replayed");
  assert.equal(captured.auditEntry?.entityId, "INC-0740");

  assert.match(workItem, /WI-0740/i);
  assert.match(workItem, /scheduling|replay|existing|state|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0740-scheduling-replay-existing-state-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
