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

function getRequest(path: string, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method: "GET",
    headers
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

type SlaResponse = {
  policy: {
    slaTargetMinutes: number;
    warningMinutes: number;
    includeResolved: boolean;
  };
  counts: {
    total: number;
    open: number;
    healthy: number;
    warning: number;
    breached: number;
    resolved: number;
  };
  items: Array<{
    incidentId: string;
    status: "HEALTHY" | "WARNING" | "BREACHED" | "RESOLVED";
    state: "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
    elapsedMinutes: number;
  }>;
};

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
  const incidentResolveRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/[incidentId]/resolve/route.ts"
  );
  const incidentSlaRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/sla/route.ts"
  );

  resetMemoryDataAccess();

  const orgAResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "Org-Incident-SLA-A" },
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
      { name: "Org-Incident-SLA-B" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(orgBResponse.status, 201);
  const orgBBody = await readJson<{ organization: { id: string } }>(orgBResponse);
  const organizationBId = orgBBody.organization.id;

  const managerAHeaders = actorHeaders("manager", "MGR-SLA-A", organizationAId);
  const managerBHeaders = actorHeaders("manager", "MGR-SLA-B", organizationBId);

  const incidentA = "INC-SLA-20260217-0001";
  const incidentB = "INC-SLA-20260217-0002";
  const incidentC = "INC-SLA-20260217-0003";

  const ackA = await incidentAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentA}/ack`,
      { note: "incident-a ack" },
      managerAHeaders
    ),
    { params: Promise.resolve({ incidentId: incidentA }) }
  );
  assert.equal(ackA.status, 200);

  const ackB = await incidentAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentB}/ack`,
      { note: "incident-b ack" },
      managerAHeaders
    ),
    { params: Promise.resolve({ incidentId: incidentB }) }
  );
  assert.equal(ackB.status, 200);

  const assignB = await incidentAssignRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentB}/assign`,
      { assigneeId: "OPS-SLA-1", note: "incident-b assigned" },
      managerAHeaders
    ),
    { params: Promise.resolve({ incidentId: incidentB }) }
  );
  assert.equal(assignB.status, 200);

  const ackC = await incidentAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentC}/ack`,
      { note: "incident-c ack" },
      managerAHeaders
    ),
    { params: Promise.resolve({ incidentId: incidentC }) }
  );
  assert.equal(ackC.status, 200);

  const resolveC = await incidentResolveRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentC}/resolve`,
      { resolutionCode: "MANUAL_CONFIRMED", note: "incident-c resolved" },
      managerAHeaders
    ),
    { params: Promise.resolve({ incidentId: incidentC }) }
  );
  assert.equal(resolveC.status, 200);

  const asOf = new Date(Date.now() + 120 * 60_000).toISOString();

  const warningResponse = await incidentSlaRoute.GET(
    getRequest(
      `/api/scheduling/anomalies/incidents/sla?slaTargetMinutes=180&warningMinutes=60&includeResolved=true&topN=20&asOf=${encodeURIComponent(asOf)}`,
      managerAHeaders
    )
  );
  assert.equal(warningResponse.status, 200);
  const warningBody = await readJson<SlaResponse>(warningResponse);
  assert.equal(warningBody.policy.slaTargetMinutes, 180);
  assert.equal(warningBody.policy.warningMinutes, 60);
  assert.equal(warningBody.policy.includeResolved, true);
  assert.equal(warningBody.counts.total, 3);
  assert.equal(warningBody.counts.open, 2);
  assert.equal(warningBody.counts.warning, 2);
  assert.equal(warningBody.counts.breached, 0);
  assert.equal(warningBody.counts.resolved, 1);
  const warningStatuses = new Map(
    warningBody.items.map((item) => [item.incidentId, item.status])
  );
  assert.equal(warningStatuses.get(incidentA), "WARNING");
  assert.equal(warningStatuses.get(incidentB), "WARNING");
  assert.equal(warningStatuses.get(incidentC), "RESOLVED");

  const breachedResponse = await incidentSlaRoute.GET(
    getRequest(
      `/api/scheduling/anomalies/incidents/sla?slaTargetMinutes=60&warningMinutes=30&topN=20&asOf=${encodeURIComponent(asOf)}`,
      managerAHeaders
    )
  );
  assert.equal(breachedResponse.status, 200);
  const breachedBody = await readJson<SlaResponse>(breachedResponse);
  assert.equal(breachedBody.counts.total, 2);
  assert.equal(breachedBody.counts.open, 2);
  assert.equal(breachedBody.counts.warning, 0);
  assert.equal(breachedBody.counts.breached, 2);
  assert.equal(breachedBody.counts.resolved, 0);
  assert.equal(breachedBody.items.length, 2);
  assert.ok(breachedBody.items.every((item) => item.status === "BREACHED"));
  assert.ok(breachedBody.items.every((item) => item.state !== "RESOLVED"));

  const invalidPolicyResponse = await incidentSlaRoute.GET(
    getRequest(
      "/api/scheduling/anomalies/incidents/sla?slaTargetMinutes=30&warningMinutes=30",
      managerAHeaders
    )
  );
  assert.equal(invalidPolicyResponse.status, 400);

  const employeeDenied = await incidentSlaRoute.GET(
    getRequest(
      "/api/scheduling/anomalies/incidents/sla",
      actorHeaders("employee", "EMP-SLA-1", organizationAId)
    )
  );
  assert.equal(employeeDenied.status, 403);

  const crossTenant = await incidentSlaRoute.GET(
    getRequest(
      "/api/scheduling/anomalies/incidents/sla?includeResolved=true",
      managerBHeaders
    )
  );
  assert.equal(crossTenant.status, 200);
  const crossTenantBody = await readJson<SlaResponse>(crossTenant);
  assert.equal(crossTenantBody.counts.total, 0);
  assert.equal(crossTenantBody.items.length, 0);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.anomaly.incident.sla.generated"));

  console.log("e2e-wi0076-scheduling-anomaly-incident-sla-monitoring.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
