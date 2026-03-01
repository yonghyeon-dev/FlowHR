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
    "WI-0727-scheduling-archive-generated-audit-entry-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentArchiveGeneratedAuditEntry\(/);
  assert.doesNotMatch(service, /action: "scheduling\.anomaly\.incident\.archive\.generated"/);
  assert.match(archiveHelpers, /export function buildScheduleAnomalyIncidentArchiveGeneratedAuditEntry/);

  const module = await import("../../src/features/scheduling/anomaly-incident-archive-helpers.ts");

  const payload = module.buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload({
    archivedAt: "2026-01-09T09:00:00.000Z",
    dryRun: false,
    asOfIso: "2026-01-09T08:30:00.000Z",
    olderThanMinutes: 120,
    includeNonResolved: false,
    stateFilter: "RESOLVED",
    assigneeFilter: "admin-1",
    topN: 25,
    archiveReason: "cleanup",
    total: 8,
    eligible: 5,
    candidates: 3,
    summary: { archived: 2, dryRunCount: 0, failed: 1 },
    skippedState: 2,
    skippedRecent: 1
  });

  const auditEntry = module.buildScheduleAnomalyIncidentArchiveGeneratedAuditEntry({
    organizationId: "org-1",
    actorRole: "ADMIN",
    actorId: "admin-1",
    payload
  });

  assert.equal(auditEntry.action, "scheduling.anomaly.incident.archive.generated");
  assert.equal(auditEntry.entityType, "WorkSchedule");
  assert.equal(auditEntry.organizationId, "org-1");
  assert.equal(auditEntry.payload.archived, 2);

  assert.match(workItem, /WI-0727/i);
  assert.match(workItem, /scheduling|archive|generated|audit|entry|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0727-scheduling-archive-generated-audit-entry-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
