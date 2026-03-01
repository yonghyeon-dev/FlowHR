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
    "WI-0734-scheduling-archive-meta-helper.md"
  );

  assert.match(service, /resolveScheduleAnomalyIncidentArchiveMeta\(\{/);
  assert.match(service, /buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload\(\{\s*\.\.\.archiveMeta,/);
  assert.match(service, /buildScheduleAnomalyIncidentArchiveResult\(\{\s*\.\.\.archiveMeta,/);
  assert.match(archiveHelpers, /export function resolveScheduleAnomalyIncidentArchiveMeta/);

  const module = await import("../../src/features/scheduling/anomaly-incident-archive-helpers.ts");

  const meta = module.resolveScheduleAnomalyIncidentArchiveMeta({
    archivedAt: "2026-01-13T09:00:00.000Z",
    dryRun: false,
    asOfIso: "2026-01-13T08:30:00.000Z",
    olderThanMinutes: 180,
    includeNonResolved: true,
    stateFilter: "RESOLVED",
    assigneeFilter: "admin-1",
    topN: 25,
    archiveReason: "cleanup",
    total: 12,
    eligible: 5,
    candidates: 3
  });

  assert.equal(meta.asOfIso, "2026-01-13T08:30:00.000Z");
  assert.equal(meta.includeNonResolved, true);
  assert.equal(meta.candidates, 3);

  assert.match(workItem, /WI-0734/i);
  assert.match(workItem, /scheduling|archive|meta|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0734-scheduling-archive-meta-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
