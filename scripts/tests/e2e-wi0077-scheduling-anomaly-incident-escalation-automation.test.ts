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

type EscalationResponse = {
  dryRun: boolean;
  policy: {
    slaTargetMinutes: number;
    warningMinutes: number;
    includeResolved: boolean;
    includeWarning: boolean;
    cooldownMinutes: number;
    escalationChannel: string;
  };
  counts: {
    candidates: number;
    requested: number;
    skippedCooldown: number;
    failed: number;
  };
  items: Array<{
    incidentId: string;
    decision: "REQUESTED" | "SKIPPED_COOLDOWN" | "FAILED" | "DRY_RUN";
    status: "HEALTHY" | "WARNING" | "BREACHED" | "RESOLVED";
  }>;
};

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
  const incidentEscalateRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/escalate/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgAResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "Org-Incident-Escalation-A" },
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
      { name: "Org-Incident-Escalation-B" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(orgBResponse.status, 201);
  const orgBBody = await readJson<{ organization: { id: string } }>(orgBResponse);
  const organizationBId = orgBBody.organization.id;

  const managerAHeaders = actorHeaders("manager", "MGR-ESC-A", organizationAId);
  const managerBHeaders = actorHeaders("manager", "MGR-ESC-B", organizationBId);

  const incidentA = "INC-ESC-20260217-0001";
  const incidentB = "INC-ESC-20260217-0002";
  const incidentC = "INC-ESC-20260217-0003";
  const incidentD = "INC-ESC-20260217-0004";

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
      { assigneeId: "OPS-ESC-1", note: "incident-b assigned" },
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
  const escalationPayload = {
    topN: 20,
    includeResolved: true,
    includeWarning: false,
    slaTargetMinutes: 60,
    warningMinutes: 30,
    cooldownMinutes: 300,
    asOf,
    escalationChannel: "ops-pager",
    dryRun: false
  };

  const firstEscalationResponse = await incidentEscalateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/escalate",
      escalationPayload,
      managerAHeaders
    )
  );
  assert.equal(firstEscalationResponse.status, 200);
  const firstEscalationBody = await readJson<EscalationResponse>(firstEscalationResponse);
  assert.equal(firstEscalationBody.dryRun, false);
  assert.equal(firstEscalationBody.policy.escalationChannel, "ops-pager");
  assert.equal(firstEscalationBody.policy.cooldownMinutes, 300);
  assert.equal(firstEscalationBody.counts.candidates, 2);
  assert.equal(firstEscalationBody.counts.requested, 2);
  assert.equal(firstEscalationBody.counts.skippedCooldown, 0);
  assert.equal(firstEscalationBody.counts.failed, 0);
  assert.equal(firstEscalationBody.items.length, 2);
  assert.ok(firstEscalationBody.items.every((item) => item.decision === "REQUESTED"));

  const escalationEvents = getRuntimeMemoryDomainEvents().filter(
    (event) => event.name === "scheduling.anomaly.incident.escalation.requested.v1"
  );
  assert.equal(escalationEvents.length, 2);
  const eventIncidentIds = escalationEvents.map((event) => event.entityId).sort();
  assert.deepEqual(eventIncidentIds, [incidentA, incidentB]);

  const secondEscalationResponse = await incidentEscalateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/escalate",
      escalationPayload,
      managerAHeaders
    )
  );
  assert.equal(secondEscalationResponse.status, 200);
  const secondEscalationBody = await readJson<EscalationResponse>(secondEscalationResponse);
  assert.equal(secondEscalationBody.counts.candidates, 2);
  assert.equal(secondEscalationBody.counts.requested, 0);
  assert.equal(secondEscalationBody.counts.skippedCooldown, 2);
  assert.equal(secondEscalationBody.counts.failed, 0);
  assert.ok(
    secondEscalationBody.items.every((item) => item.decision === "SKIPPED_COOLDOWN")
  );

  const ackD = await incidentAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/anomalies/incidents/${incidentD}/ack`,
      { note: "incident-d ack" },
      managerAHeaders
    ),
    { params: Promise.resolve({ incidentId: incidentD }) }
  );
  assert.equal(ackD.status, 200);

  const dryRunResponse = await incidentEscalateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/escalate",
      {
        ...escalationPayload,
        dryRun: true
      },
      managerAHeaders
    )
  );
  assert.equal(dryRunResponse.status, 200);
  const dryRunBody = await readJson<EscalationResponse>(dryRunResponse);
  assert.equal(dryRunBody.dryRun, true);
  assert.equal(dryRunBody.counts.candidates, 3);
  assert.equal(dryRunBody.counts.requested, 0);
  assert.equal(dryRunBody.counts.skippedCooldown, 2);
  assert.equal(dryRunBody.counts.failed, 0);
  const incidentDItem = dryRunBody.items.find((item) => item.incidentId === incidentD);
  assert.ok(incidentDItem);
  assert.equal(incidentDItem?.decision, "DRY_RUN");

  const invalidPayloadResponse = await incidentEscalateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/escalate",
      {
        slaTargetMinutes: 30,
        warningMinutes: 30
      },
      managerAHeaders
    )
  );
  assert.equal(invalidPayloadResponse.status, 400);

  const employeeDenied = await incidentEscalateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/escalate",
      {},
      actorHeaders("employee", "EMP-ESC-1", organizationAId)
    )
  );
  assert.equal(employeeDenied.status, 403);

  const crossTenantResponse = await incidentEscalateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/escalate",
      escalationPayload,
      managerBHeaders
    )
  );
  assert.equal(crossTenantResponse.status, 200);
  const crossTenantBody = await readJson<EscalationResponse>(crossTenantResponse);
  assert.equal(crossTenantBody.counts.candidates, 0);
  assert.equal(crossTenantBody.counts.requested, 0);
  assert.equal(crossTenantBody.items.length, 0);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.anomaly.incident.escalation.generated"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.escalation.requested"));

  console.log("e2e-wi0077-scheduling-anomaly-incident-escalation-automation.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
