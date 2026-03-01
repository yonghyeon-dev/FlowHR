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
    "WI-0728-scheduling-archive-side-effect-callback-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentArchivedAuditEntry\(/);
  assert.doesNotMatch(service, /ANOMALY_INCIDENT_ARCHIVE_AUDIT_ACTION/);
  assert.match(archiveHelpers, /export function buildScheduleAnomalyIncidentArchivedAuditEntry/);

  const module = await import("../../src/features/scheduling/anomaly-incident-archive-helpers.ts");

  const auditEntry = module.buildScheduleAnomalyIncidentArchivedAuditEntry({
    candidate: {
      incidentId: "INC-ARCH-1",
      state: "RESOLVED",
      assigneeId: "admin-1",
      updatedAt: "2026-01-10T08:00:00.000Z",
      organizationId: null
    },
    archivedAt: "2026-01-10T09:00:00.000Z",
    asOfIso: "2026-01-10T09:00:00.000Z",
    olderThanMinutes: 120,
    archiveReason: "cleanup",
    fallbackOrganizationId: "org-fallback",
    actorRole: "ADMIN",
    actorId: "admin-1"
  });

  assert.equal(auditEntry.action, "scheduling.anomaly.incident.archived");
  assert.equal(auditEntry.entityId, "INC-ARCH-1");
  assert.equal(auditEntry.organizationId, "org-fallback");
  assert.equal(auditEntry.payload.reason, "cleanup");

  assert.match(workItem, /WI-0728/i);
  assert.match(workItem, /scheduling|archive|side|effect|callback|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0728-scheduling-archive-side-effect-callback-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
