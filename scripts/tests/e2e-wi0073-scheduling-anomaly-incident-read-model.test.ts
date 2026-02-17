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

function jsonRequest(method: string, path: string, payload: JsonPayload, headers: Record<string, string>) {
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
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const incidentAckRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/[incidentId]/ack/route.ts"
  );
  const incidentAssignRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/[incidentId]/assign/route.ts"
  );
  const incidentsRoute = await import("../../src/app/api/scheduling/anomalies/incidents/route.ts");
  const incidentDetailRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/[incidentId]/route.ts"
  );

  resetMemoryDataAccess();

  const orgAResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "Org-Incident-Read-Model-A" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgAResponse.status, 201);
  const orgABody = await readJson<{ organization: { id: string } }>(orgAResponse);
  const organizationAId = orgABody.organization.id;

  const orgBResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "Org-Incident-Read-Model-B" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgBResponse.status, 201);
  const orgBBody = await readJson<{ organization: { id: string } }>(orgBResponse);
  const organizationBId = orgBBody.organization.id;

  const managerAHeaders = actorHeaders("manager", "MGR-RM-A", organizationAId);
  const managerBHeaders = actorHeaders("manager", "MGR-RM-B", organizationBId);

  const incidentA = "INC-RM-20260217-0001";
  const incidentB = "INC-RM-20260217-0002";

  const ackAResponse = await incidentAckRoute.POST(
    jsonRequest("POST", `/api/scheduling/anomalies/incidents/${incidentA}/ack`, { note: "triage started" }, managerAHeaders),
    { params: Promise.resolve({ incidentId: incidentA }) }
  );
  assert.equal(ackAResponse.status, 200);

  const assignAResponse = await incidentAssignRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentA}/assign`,
      { assigneeId: "OPS-RM-1", note: "assigned to oncall" },
      managerAHeaders
    ),
    { params: Promise.resolve({ incidentId: incidentA }) }
  );
  assert.equal(assignAResponse.status, 200);

  const ackBResponse = await incidentAckRoute.POST(
    jsonRequest("POST", `/api/scheduling/anomalies/incidents/${incidentB}/ack`, {}, managerAHeaders),
    { params: Promise.resolve({ incidentId: incidentB }) }
  );
  assert.equal(ackBResponse.status, 200);

  const listAllResponse = await incidentsRoute.GET(
    new Request("http://localhost/api/scheduling/anomalies/incidents?topN=20", {
      method: "GET",
      headers: managerAHeaders
    })
  );
  assert.equal(listAllResponse.status, 200);
  const listAllBody = await readJson<{
    total: number;
    items: Array<{ incidentId: string; state: string; history: unknown[] }>;
  }>(listAllResponse);
  assert.equal(listAllBody.total, 2);
  assert.equal(listAllBody.items.length, 2);
  assert.ok(listAllBody.items.find((item) => item.incidentId === incidentA));
  assert.ok(listAllBody.items.find((item) => item.incidentId === incidentB));

  const listAssignedResponse = await incidentsRoute.GET(
    new Request("http://localhost/api/scheduling/anomalies/incidents?state=ASSIGNED", {
      method: "GET",
      headers: managerAHeaders
    })
  );
  assert.equal(listAssignedResponse.status, 200);
  const listAssignedBody = await readJson<{
    total: number;
    items: Array<{ incidentId: string; state: string; assigneeId: string | null }>;
  }>(listAssignedResponse);
  assert.equal(listAssignedBody.total, 1);
  assert.equal(listAssignedBody.items[0].incidentId, incidentA);
  assert.equal(listAssignedBody.items[0].state, "ASSIGNED");
  assert.equal(listAssignedBody.items[0].assigneeId, "OPS-RM-1");

  const incidentDetailResponse = await incidentDetailRoute.GET(
    new Request(`http://localhost/api/scheduling/anomalies/incidents/${incidentA}`, {
      method: "GET",
      headers: managerAHeaders
    }),
    { params: Promise.resolve({ incidentId: incidentA }) }
  );
  assert.equal(incidentDetailResponse.status, 200);
  const incidentDetailBody = await readJson<{
    incident: { incidentId: string; state: string; history: Array<{ action: string }> };
  }>(incidentDetailResponse);
  assert.equal(incidentDetailBody.incident.incidentId, incidentA);
  assert.equal(incidentDetailBody.incident.state, "ASSIGNED");
  assert.deepEqual(
    incidentDetailBody.incident.history.map((entry) => entry.action),
    ["ACKNOWLEDGE", "ASSIGN"]
  );

  const employeeDenied = await incidentsRoute.GET(
    new Request("http://localhost/api/scheduling/anomalies/incidents?topN=20", {
      method: "GET",
      headers: actorHeaders("employee", "EMP-RM-1", organizationAId)
    })
  );
  assert.equal(employeeDenied.status, 403);

  const crossTenantDenied = await incidentDetailRoute.GET(
    new Request(`http://localhost/api/scheduling/anomalies/incidents/${incidentA}`, {
      method: "GET",
      headers: managerBHeaders
    }),
    { params: Promise.resolve({ incidentId: incidentA }) }
  );
  assert.equal(crossTenantDenied.status, 404);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.anomaly.incident.listed"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.read"));

  console.log("e2e-wi0073-scheduling-anomaly-incident-read-model.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
