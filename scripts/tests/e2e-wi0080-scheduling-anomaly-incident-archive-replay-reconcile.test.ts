import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.FLOWHR_TENANCY_V1 = "true";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type JsonPayload = Record<string, unknown>;

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
  };
}

function jsonRequest(
  method: string,
  path: string,
  payload: JsonPayload,
  headers: Record<string, string>
) {
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const incidentsRoute = await import("../../src/app/api/scheduling/anomalies/incidents/route.ts");
  const archiveRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/archive/route.ts"
  );
  const replayRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/replay/route.ts"
  );
  const reconcileRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/reconcile/route.ts"
  );
  const ackRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/[incidentId]/ack/route.ts"
  );
  const assignRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/[incidentId]/assign/route.ts"
  );
  const resolveRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/[incidentId]/resolve/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgAResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "Org-Incident-Archive-A" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(orgAResponse.status, 201);
  const orgABody = await readJson<{ organization: { id: string } }>(orgAResponse);
  const organizationAId = orgABody.organization.id;

  const orgBResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "Org-Incident-Archive-B" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(orgBResponse.status, 201);
  const orgBBody = await readJson<{ organization: { id: string } }>(orgBResponse);
  const organizationBId = orgBBody.organization.id;

  const managerAHeaders = actorHeaders("manager", "MGR-ARCHIVE-A", organizationAId);
  const managerBHeaders = actorHeaders("manager", "MGR-ARCHIVE-B", organizationBId);
  const incidentIds = ["INC-ARCHIVE-20260217-0001", "INC-ARCHIVE-20260217-0002"];

  for (const incidentId of incidentIds) {
    const ackResponse = await ackRoute.POST(
      jsonRequest(
        "POST",
        `/api/scheduling/anomalies/incidents/${incidentId}/ack`,
        { note: "ack" },
        managerAHeaders
      ),
      { params: Promise.resolve({ incidentId }) }
    );
    assert.equal(ackResponse.status, 200);

    const assignResponse = await assignRoute.POST(
      jsonRequest(
        "POST",
        `/api/scheduling/anomalies/incidents/${incidentId}/assign`,
        { assigneeId: "OPS-ARCHIVE-1", note: "assign" },
        managerAHeaders
      ),
      { params: Promise.resolve({ incidentId }) }
    );
    assert.equal(assignResponse.status, 200);

    const resolveResponse = await resolveRoute.POST(
      jsonRequest(
        "POST",
        `/api/scheduling/anomalies/incidents/${incidentId}/resolve`,
        { resolutionCode: "MANUAL_CONFIRMED", note: "resolve" },
        managerAHeaders
      ),
      { params: Promise.resolve({ incidentId }) }
    );
    assert.equal(resolveResponse.status, 200);
  }

  const archiveDryRunResponse = await archiveRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/archive",
      {
        olderThanMinutes: 0,
        includeNonResolved: false,
        topN: 20,
        dryRun: true,
        reason: "retention-dry-run"
      },
      managerAHeaders
    )
  );
  assert.equal(archiveDryRunResponse.status, 200);
  const archiveDryRunBody = await readJson<{
    counts: { candidates: number; archived: number; dryRun: number; failed: number };
  }>(archiveDryRunResponse);
  assert.equal(archiveDryRunBody.counts.candidates, 2);
  assert.equal(archiveDryRunBody.counts.archived, 0);
  assert.equal(archiveDryRunBody.counts.dryRun, 2);
  assert.equal(archiveDryRunBody.counts.failed, 0);

  const archiveApplyResponse = await archiveRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/archive",
      {
        olderThanMinutes: 0,
        includeNonResolved: false,
        topN: 20,
        dryRun: false,
        reason: "retention-apply"
      },
      managerAHeaders
    )
  );
  assert.equal(archiveApplyResponse.status, 200);
  const archiveApplyBody = await readJson<{
    counts: { candidates: number; archived: number; dryRun: number; failed: number };
  }>(archiveApplyResponse);
  assert.equal(archiveApplyBody.counts.candidates, 2);
  assert.equal(archiveApplyBody.counts.archived, 2);
  assert.equal(archiveApplyBody.counts.dryRun, 0);
  assert.equal(archiveApplyBody.counts.failed, 0);

  const archivedListResponse = await incidentsRoute.GET(
    new Request("http://localhost/api/scheduling/anomalies/incidents?topN=20", {
      method: "GET",
      headers: managerAHeaders
    })
  );
  assert.equal(archivedListResponse.status, 200);
  const archivedListBody = await readJson<{ total: number }>(archivedListResponse);
  assert.equal(archivedListBody.total, 0);

  const replayArchivedExcludedResponse = await replayRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/replay",
      {
        incidentIds,
        includeArchived: false,
        dryRun: false
      },
      managerAHeaders
    )
  );
  assert.equal(replayArchivedExcludedResponse.status, 200);
  const replayArchivedExcludedBody = await readJson<{
    counts: { requested: number; replayed: number; notFound: number; failed: number };
  }>(replayArchivedExcludedResponse);
  assert.equal(replayArchivedExcludedBody.counts.requested, 2);
  assert.equal(replayArchivedExcludedBody.counts.replayed, 0);
  assert.equal(replayArchivedExcludedBody.counts.notFound, 2);
  assert.equal(replayArchivedExcludedBody.counts.failed, 0);

  const replayArchivedIncludedResponse = await replayRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/replay",
      {
        incidentIds,
        includeArchived: true,
        dryRun: false
      },
      managerAHeaders
    )
  );
  assert.equal(replayArchivedIncludedResponse.status, 200);
  const replayArchivedIncludedBody = await readJson<{
    counts: { requested: number; replayed: number; notFound: number; failed: number };
  }>(replayArchivedIncludedResponse);
  assert.equal(replayArchivedIncludedBody.counts.requested, 2);
  assert.equal(replayArchivedIncludedBody.counts.replayed, 2);
  assert.equal(replayArchivedIncludedBody.counts.notFound, 0);
  assert.equal(replayArchivedIncludedBody.counts.failed, 0);

  const replayedListResponse = await incidentsRoute.GET(
    new Request("http://localhost/api/scheduling/anomalies/incidents?topN=20", {
      method: "GET",
      headers: managerAHeaders
    })
  );
  assert.equal(replayedListResponse.status, 200);
  const replayedListBody = await readJson<{ total: number }>(replayedListResponse);
  assert.equal(replayedListBody.total, 2);

  const reconcileMatchedResponse = await reconcileRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/reconcile",
      { includeMatching: true, topN: 20 },
      managerAHeaders
    )
  );
  assert.equal(reconcileMatchedResponse.status, 200);
  const reconcileMatchedBody = await readJson<{
    counts: { total: number; match: number; fieldMismatch: number };
  }>(reconcileMatchedResponse);
  assert.equal(reconcileMatchedBody.counts.total, 2);
  assert.equal(reconcileMatchedBody.counts.match, 2);
  assert.equal(reconcileMatchedBody.counts.fieldMismatch, 0);

  const incidentToTamper = await memoryDataAccess.scheduling.findIncidentByIncidentId(incidentIds[0]);
  assert.ok(incidentToTamper);
  await memoryDataAccess.scheduling.upsertIncident({
    incidentId: incidentToTamper.incidentId,
    organizationId: incidentToTamper.organizationId,
    state: "ASSIGNED",
    assigneeId: incidentToTamper.assigneeId,
    resolutionCode: incidentToTamper.resolutionCode,
    note: "tampered",
    updatedAt: new Date().toISOString(),
    updatedByActorId: "OPS-TAMPER",
    updatedByActorRole: "manager",
    lastEscalationRequestedAt: incidentToTamper.lastEscalationRequestedAt,
    history: incidentToTamper.history
  });

  const reconcileMismatchResponse = await reconcileRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/reconcile",
      { includeMatching: false, topN: 20 },
      managerAHeaders
    )
  );
  assert.equal(reconcileMismatchResponse.status, 200);
  const reconcileMismatchBody = await readJson<{
    counts: { fieldMismatch: number };
    items: Array<{ incidentId: string; status: string }>;
  }>(reconcileMismatchResponse);
  assert.ok(reconcileMismatchBody.counts.fieldMismatch >= 1);
  assert.ok(
    reconcileMismatchBody.items.some(
      (item) => item.incidentId === incidentIds[0] && item.status === "FIELD_MISMATCH"
    )
  );

  const tenantBArchiveResponse = await archiveRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/archive",
      { olderThanMinutes: 0, topN: 20, dryRun: false },
      managerBHeaders
    )
  );
  assert.equal(tenantBArchiveResponse.status, 200);
  const tenantBArchiveBody = await readJson<{ counts: { total: number; candidates: number } }>(
    tenantBArchiveResponse
  );
  assert.equal(tenantBArchiveBody.counts.total, 0);
  assert.equal(tenantBArchiveBody.counts.candidates, 0);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.anomaly.incident.archive.generated"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.archived"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.replay.generated"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.reconciliation.generated"));

  console.log("e2e-wi0080-scheduling-anomaly-incident-archive-replay-reconcile.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
