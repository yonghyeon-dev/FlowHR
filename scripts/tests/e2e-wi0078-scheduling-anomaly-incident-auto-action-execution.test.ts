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

type AutoActionResponse = {
  dryRun: boolean;
  policy: {
    escalationChannel: string;
    autoAssigneeId: string;
    autoAssignMode: "ASSIGN_IF_UNASSIGNED" | "FORCE_ASSIGN";
    autoAssignNote: string | null;
  };
  counts: {
    candidates: number;
    escalated: number;
    assigned: number;
    skippedEscalation: number;
    skippedAssigned: number;
    failed: number;
    dryRun: number;
  };
  items: Array<{
    incidentId: string;
    decision:
      | "ASSIGNED"
      | "SKIPPED_ESCALATION"
      | "SKIPPED_ALREADY_ASSIGNED"
      | "SKIPPED_SAME_ASSIGNEE"
      | "FAILED"
      | "DRY_RUN";
    assignedAssigneeId: string | null;
    previousAssigneeId: string | null;
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
  const incidentDetailRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/[incidentId]/route.ts"
  );
  const incidentAutoActionRoute = await import(
    "../../src/app/api/scheduling/anomalies/incidents/auto-actions/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgAResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "Org-Incident-Auto-Action-A" },
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
      { name: "Org-Incident-Auto-Action-B" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(orgBResponse.status, 201);
  const orgBBody = await readJson<{ organization: { id: string } }>(orgBResponse);
  const organizationBId = orgBBody.organization.id;

  const managerAHeaders = actorHeaders("manager", "MGR-AUTO-A", organizationAId);
  const managerBHeaders = actorHeaders("manager", "MGR-AUTO-B", organizationBId);

  const incidentA = "INC-AUTO-20260217-0001";
  const incidentB = "INC-AUTO-20260217-0002";
  const incidentC = "INC-AUTO-20260217-0003";
  const incidentD = "INC-AUTO-20260217-0004";

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
      { assigneeId: "OPS-EXISTING-1", note: "incident-b assigned" },
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
  const autoActionPayload = {
    topN: 20,
    includeResolved: true,
    includeWarning: false,
    slaTargetMinutes: 60,
    warningMinutes: 30,
    cooldownMinutes: 300,
    asOf,
    escalationChannel: "ops-pager",
    autoAssigneeId: "OPS-AUTO-1",
    autoAssignMode: "ASSIGN_IF_UNASSIGNED",
    autoAssignNote: "auto-assigned by incident automation",
    dryRun: false
  };

  const firstAutoActionResponse = await incidentAutoActionRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/auto-actions",
      autoActionPayload,
      managerAHeaders
    )
  );
  assert.equal(firstAutoActionResponse.status, 200);
  const firstAutoActionBody = await readJson<AutoActionResponse>(firstAutoActionResponse);
  assert.equal(firstAutoActionBody.dryRun, false);
  assert.equal(firstAutoActionBody.policy.escalationChannel, "ops-pager");
  assert.equal(firstAutoActionBody.policy.autoAssigneeId, "OPS-AUTO-1");
  assert.equal(firstAutoActionBody.policy.autoAssignMode, "ASSIGN_IF_UNASSIGNED");
  assert.equal(firstAutoActionBody.counts.candidates, 2);
  assert.equal(firstAutoActionBody.counts.escalated, 2);
  assert.equal(firstAutoActionBody.counts.assigned, 1);
  assert.equal(firstAutoActionBody.counts.skippedEscalation, 0);
  assert.equal(firstAutoActionBody.counts.skippedAssigned, 1);
  assert.equal(firstAutoActionBody.counts.failed, 0);
  assert.equal(firstAutoActionBody.counts.dryRun, 0);

  const incidentAItem = firstAutoActionBody.items.find((item) => item.incidentId === incidentA);
  assert.ok(incidentAItem);
  assert.equal(incidentAItem?.decision, "ASSIGNED");
  assert.equal(incidentAItem?.assignedAssigneeId, "OPS-AUTO-1");

  const incidentBItem = firstAutoActionBody.items.find((item) => item.incidentId === incidentB);
  assert.ok(incidentBItem);
  assert.equal(incidentBItem?.decision, "SKIPPED_ALREADY_ASSIGNED");
  assert.equal(incidentBItem?.previousAssigneeId, "OPS-EXISTING-1");

  const incidentADetail = await incidentDetailRoute.GET(
    new Request(`http://localhost/api/scheduling/anomalies/incidents/${incidentA}`, {
      method: "GET",
      headers: managerAHeaders
    }),
    { params: Promise.resolve({ incidentId: incidentA }) }
  );
  assert.equal(incidentADetail.status, 200);
  const incidentADetailBody = await readJson<{ incident: { assigneeId: string | null } }>(incidentADetail);
  assert.equal(incidentADetailBody.incident.assigneeId, "OPS-AUTO-1");

  const autoActionEvents = getRuntimeMemoryDomainEvents().filter(
    (event) => event.name === "scheduling.anomaly.incident.auto_action.executed.v1"
  );
  assert.equal(autoActionEvents.length, 1);

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

  const dryRunResponse = await incidentAutoActionRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/auto-actions",
      {
        ...autoActionPayload,
        dryRun: true
      },
      managerAHeaders
    )
  );
  assert.equal(dryRunResponse.status, 200);
  const dryRunBody = await readJson<AutoActionResponse>(dryRunResponse);
  assert.equal(dryRunBody.dryRun, true);
  assert.equal(dryRunBody.counts.candidates, 3);
  assert.equal(dryRunBody.counts.escalated, 1);
  assert.equal(dryRunBody.counts.assigned, 0);
  assert.equal(dryRunBody.counts.skippedEscalation, 2);
  assert.equal(dryRunBody.counts.skippedAssigned, 0);
  assert.equal(dryRunBody.counts.failed, 0);
  assert.equal(dryRunBody.counts.dryRun, 1);
  const incidentDItem = dryRunBody.items.find((item) => item.incidentId === incidentD);
  assert.ok(incidentDItem);
  assert.equal(incidentDItem?.decision, "DRY_RUN");
  assert.equal(incidentDItem?.assignedAssigneeId, "OPS-AUTO-1");

  const incidentDDetail = await incidentDetailRoute.GET(
    new Request(`http://localhost/api/scheduling/anomalies/incidents/${incidentD}`, {
      method: "GET",
      headers: managerAHeaders
    }),
    { params: Promise.resolve({ incidentId: incidentD }) }
  );
  assert.equal(incidentDDetail.status, 200);
  const incidentDDetailBody = await readJson<{ incident: { assigneeId: string | null } }>(incidentDDetail);
  assert.equal(incidentDDetailBody.incident.assigneeId, null);

  const crossTenantResponse = await incidentAutoActionRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/auto-actions",
      autoActionPayload,
      managerBHeaders
    )
  );
  assert.equal(crossTenantResponse.status, 200);
  const crossTenantBody = await readJson<AutoActionResponse>(crossTenantResponse);
  assert.equal(crossTenantBody.counts.candidates, 0);
  assert.equal(crossTenantBody.items.length, 0);

  const invalidPayloadResponse = await incidentAutoActionRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/auto-actions",
      {
        ...autoActionPayload,
        autoAssigneeId: ""
      },
      managerAHeaders
    )
  );
  assert.equal(invalidPayloadResponse.status, 400);

  const employeeDenied = await incidentAutoActionRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/anomalies/incidents/auto-actions",
      autoActionPayload,
      actorHeaders("employee", "EMP-AUTO-1", organizationAId)
    )
  );
  assert.equal(employeeDenied.status, 403);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.anomaly.incident.auto_action.generated"));
  assert.ok(auditActions.includes("scheduling.anomaly.incident.auto_action.notified"));

  console.log("e2e-wi0078-scheduling-anomaly-incident-auto-action-execution.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
