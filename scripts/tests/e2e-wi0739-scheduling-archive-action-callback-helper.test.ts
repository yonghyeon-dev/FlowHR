import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const archiveHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-archive-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0739-scheduling-archive-action-callback-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentArchivedAuditAppender\(\{/);
  assert.match(service, /onArchived:\s*appendArchivedAudit/);
  assert.match(
    archiveHelpers,
    /export function buildScheduleAnomalyIncidentArchivedAuditAppender/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-archive-helpers.ts");

  const captured: Array<Record<string, unknown>> = [];
  const appendArchivedAudit = module.buildScheduleAnomalyIncidentArchivedAuditAppender({
    asOfIso: "2026-01-18T08:00:00.000Z",
    olderThanMinutes: 720,
    archiveReason: "cleanup",
    fallbackOrganizationId: "org-fallback",
    actorRole: "ADMIN",
    actorId: "actor-archive",
    appendAuditEntry: async (entry) => {
      captured.push(entry as unknown as Record<string, unknown>);
    }
  });

  await appendArchivedAudit({
    candidate: {
      incidentId: "INC-ARCHIVE-1",
      state: "RESOLVED",
      assigneeId: "manager-5",
      updatedAt: "2026-01-17T07:00:00.000Z",
      organizationId: "org-archive"
    },
    archivedAt: "2026-01-18T09:00:00.000Z"
  });

  assert.equal(captured.length, 1);
  assert.equal(captured[0].action, "scheduling.anomaly.incident.archived");
  assert.equal(captured[0].entityId, "INC-ARCHIVE-1");
  assert.equal(captured[0].organizationId, "org-archive");
  assert.equal((captured[0].payload as { reason: string }).reason, "cleanup");

  assert.match(workItem, /WI-0739/i);
  assert.match(workItem, /scheduling|archive|action|callback|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0739-scheduling-archive-action-callback-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
