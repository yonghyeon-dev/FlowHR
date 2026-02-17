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
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
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

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "Org-Incident-Lifecycle" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const incidentId = "INC-ANOMALY-20260217-0001";
  const managerHeaders = actorHeaders("manager", "MGR-INCIDENT-1", organizationId);

  const ackResponse = await incidentAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentId}/ack`,
      { note: "review started by ops" },
      managerHeaders
    ),
    { params: Promise.resolve({ incidentId }) }
  );
  assert.equal(ackResponse.status, 200);
  const ackBody = await readJson<{
    incident: {
      action: string;
      state: string;
      note: string | null;
      assigneeId: string | null;
    };
  }>(ackResponse);
  assert.equal(ackBody.incident.action, "ACKNOWLEDGE");
  assert.equal(ackBody.incident.state, "ACKNOWLEDGED");
  assert.equal(ackBody.incident.note, "review started by ops");
  assert.equal(ackBody.incident.assigneeId, null);

  const assignResponse = await incidentAssignRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentId}/assign`,
      { assigneeId: "OPS-ONCALL-1", note: "owner assigned" },
      managerHeaders
    ),
    { params: Promise.resolve({ incidentId }) }
  );
  assert.equal(assignResponse.status, 200);
  const assignBody = await readJson<{
    incident: {
      action: string;
      state: string;
      assigneeId: string | null;
    };
  }>(assignResponse);
  assert.equal(assignBody.incident.action, "ASSIGN");
  assert.equal(assignBody.incident.state, "ASSIGNED");
  assert.equal(assignBody.incident.assigneeId, "OPS-ONCALL-1");

  const resolveResponse = await incidentResolveRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentId}/resolve`,
      { resolutionCode: "ATTENDANCE_CORRECTED", note: "attendance data fixed" },
      managerHeaders
    ),
    { params: Promise.resolve({ incidentId }) }
  );
  assert.equal(resolveResponse.status, 200);
  const resolveBody = await readJson<{
    incident: {
      action: string;
      state: string;
      resolutionCode: string | null;
    };
  }>(resolveResponse);
  assert.equal(resolveBody.incident.action, "RESOLVE");
  assert.equal(resolveBody.incident.state, "RESOLVED");
  assert.equal(resolveBody.incident.resolutionCode, "ATTENDANCE_CORRECTED");

  const employeeDenied = await incidentAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentId}/ack`,
      {},
      actorHeaders("employee", "EMP-INCIDENT-1", organizationId)
    ),
    { params: Promise.resolve({ incidentId }) }
  );
  assert.equal(employeeDenied.status, 403);

  const invalidAssign = await incidentAssignRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentId}/assign`,
      { note: "missing assignee" },
      managerHeaders
    ),
    { params: Promise.resolve({ incidentId }) }
  );
  assert.equal(invalidAssign.status, 400);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.anomaly.incident.acknowledged"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.assigned"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.resolved"));

  const incidentEvents = getRuntimeMemoryDomainEvents().filter(
    (event) => event.name === "scheduling.anomaly.incident.updated.v1"
  );
  assert.equal(incidentEvents.length, 3, "three lifecycle actions should emit incident.updated event");
  assert.deepEqual(
    incidentEvents.map((event) => (event.payload as { action: string }).action),
    ["ACKNOWLEDGE", "ASSIGN", "RESOLVE"]
  );

  console.log("e2e-wi0072-scheduling-anomaly-incident-lifecycle.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
