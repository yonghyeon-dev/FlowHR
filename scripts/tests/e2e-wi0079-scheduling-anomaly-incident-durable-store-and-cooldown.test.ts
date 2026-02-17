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
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const incidentsRoute = await import("../../src/app/api/scheduling/anomalies/incidents/route.ts");
  const incidentDetailRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/[incidentId]/route.ts"
  );
  const incidentSlaRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/sla/route.ts"
  );
  const incidentEscalateRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/escalate/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgAResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "Org-Incident-Store-A" },
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
      { name: "Org-Incident-Store-B" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(orgBResponse.status, 201);
  const orgBBody = await readJson<{ organization: { id: string } }>(orgBResponse);
  const organizationBId = orgBBody.organization.id;

  const managerAHeaders = actorHeaders("manager", "MGR-STORE-A", organizationAId);
  const managerBHeaders = actorHeaders("manager", "MGR-STORE-B", organizationBId);

  const incidentId = "INC-STORE-20260217-0001";
  const seedUpdatedAt = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
  const seedEscalationRequestedAt = new Date(Date.now()).toISOString();

  await memoryDataAccess.scheduling.upsertIncident({
    incidentId,
    organizationId: organizationAId,
    state: "ACKNOWLEDGED",
    assigneeId: null,
    resolutionCode: null,
    note: "seeded-by-store",
    updatedAt: seedUpdatedAt,
    updatedByActorId: "OPS-SEED-1",
    updatedByActorRole: "manager",
    lastEscalationRequestedAt: seedEscalationRequestedAt,
    history: [
      {
        action: "ACKNOWLEDGE",
        state: "ACKNOWLEDGED",
        assigneeId: null,
        resolutionCode: null,
        note: "seeded-by-store",
        updatedAt: seedUpdatedAt,
        updatedByActorId: "OPS-SEED-1",
        updatedByActorRole: "manager"
      }
    ]
  });

  const detailResponse = await incidentDetailRoute.GET(
    new Request(`http://localhost/api/scheduling/anomalies/incidents/${incidentId}`, {
      method: "GET",
      headers: managerAHeaders
    }),
    { params: Promise.resolve({ incidentId }) }
  );
  assert.equal(detailResponse.status, 200);
  const detailBody = await readJson<{
    incident: {
      incidentId: string;
      state: string;
      history: Array<{ action: string }>;
      updatedBy: { actorId: string | null };
    };
  }>(detailResponse);
  assert.equal(detailBody.incident.incidentId, incidentId);
  assert.equal(detailBody.incident.state, "ACKNOWLEDGED");
  assert.equal(detailBody.incident.history.length, 1);
  assert.equal(detailBody.incident.updatedBy.actorId, "OPS-SEED-1");

  const listResponse = await incidentsRoute.GET(
    new Request("http://localhost/api/scheduling/anomalies/incidents?topN=20", {
      method: "GET",
      headers: managerAHeaders
    })
  );
  assert.equal(listResponse.status, 200);
  const listBody = await readJson<{ total: number; items: Array<{ incidentId: string }> }>(listResponse);
  assert.equal(listBody.total, 1);
  assert.equal(listBody.items[0].incidentId, incidentId);

  const asOf = new Date(Date.now() + 120 * 60_000).toISOString();
  const slaResponse = await incidentSlaRoute.GET(
    new Request(
      `http://localhost/api/scheduling/anomalies/incidents/sla?topN=20&slaTargetMinutes=60&warningMinutes=30&asOf=${encodeURIComponent(asOf)}`,
      {
        method: "GET",
        headers: managerAHeaders
      }
    )
  );
  assert.equal(slaResponse.status, 200);
  const slaBody = await readJson<{
    counts: { breached: number; warning: number };
    items: Array<{ incidentId: string; status: string }>;
  }>(slaResponse);
  assert.equal(slaBody.counts.breached, 1);
  assert.equal(slaBody.items[0].incidentId, incidentId);
  assert.equal(slaBody.items[0].status, "BREACHED");

  const escalationResponse = await incidentEscalateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/escalate",
      {
        topN: 20,
        includeResolved: false,
        includeWarning: false,
        slaTargetMinutes: 60,
        warningMinutes: 30,
        cooldownMinutes: 300,
        asOf,
        escalationChannel: "ops-pager",
        dryRun: false
      },
      managerAHeaders
    )
  );
  assert.equal(escalationResponse.status, 200);
  const escalationBody = await readJson<{
    counts: { candidates: number; requested: number; skippedCooldown: number; failed: number };
    items: Array<{ incidentId: string; decision: string }>;
  }>(escalationResponse);
  assert.equal(escalationBody.counts.candidates, 1);
  assert.equal(escalationBody.counts.requested, 0);
  assert.equal(escalationBody.counts.skippedCooldown, 1);
  assert.equal(escalationBody.counts.failed, 0);
  assert.equal(escalationBody.items[0].incidentId, incidentId);
  assert.equal(escalationBody.items[0].decision, "SKIPPED_COOLDOWN");

  const detailCrossTenant = await incidentDetailRoute.GET(
    new Request(`http://localhost/api/scheduling/anomalies/incidents/${incidentId}`, {
      method: "GET",
      headers: managerBHeaders
    }),
    { params: Promise.resolve({ incidentId }) }
  );
  assert.equal(detailCrossTenant.status, 404);

  const incidentEscalationEvents = getRuntimeMemoryDomainEvents().filter(
    (event) => event.name === "scheduling.anomaly.incident.escalation.requested.v1"
  );
  assert.equal(incidentEscalationEvents.length, 0);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.anomaly.incident.listed"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.read"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.sla.generated"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.escalation.generated"));

  console.log("e2e-wi0079-scheduling-anomaly-incident-durable-store-and-cooldown.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
