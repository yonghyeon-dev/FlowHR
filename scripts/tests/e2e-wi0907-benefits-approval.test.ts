import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

type JsonPayload = Record<string, unknown>;

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

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

async function readJson(response: Response) {
  return (await response.json()) as unknown;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const benefitRequestsRoute = await import("../../src/app/api/benefits/requests/route.ts");
  const benefitDecisionRoute = await import(
    "../../src/app/api/benefits/requests/[requestId]/decision/route.ts"
  );
  const approvalExecutionsRoute = await import("../../src/app/api/approval/executions/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0907 Org" });
  const employeeId = "EMP-WI0907-1";
  const managerId = "MGR-WI0907-1";

  await memoryDataAccess.employees.create({ id: employeeId, organizationId: organization.id });
  await memoryDataAccess.employees.create({ id: managerId, organizationId: organization.id });

  const benefit = await memoryDataAccess.benefits.createCatalogItem({
    organizationId: organization.id,
    name: "WI-0907 Test Benefit",
    description: "approval execution integration",
    annualLimitKrw: 300000,
    status: "ACTIVE"
  });

  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);
  const managerHeaders = actorHeaders("manager", managerId, organization.id);

  const createResponse = await benefitRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/benefits/requests",
      {
        organizationId: organization.id,
        benefitId: benefit.id,
        employeeId,
        amountKrw: 120000,
        reason: "wi-0907 approval queue integration"
      },
      employeeHeaders
    )
  );

  assert.equal(createResponse.status, 201, "benefit request create should succeed");
  const createBody = (await readJson(createResponse)) as {
    request: { id: string; status: string; employeeId: string };
  };
  assert.ok(createBody.request.id, "benefit request id should exist");
  assert.equal(createBody.request.status, "SUBMITTED");
  assert.equal(createBody.request.employeeId, employeeId);

  const queueResponse = await approvalExecutionsRoute.GET(
    new Request(
      `http://localhost/api/approval/executions?organizationId=${encodeURIComponent(
        organization.id
      )}&state=PENDING`,
      {
        method: "GET",
        headers: managerHeaders
      }
    )
  );
  assert.equal(queueResponse.status, 200, "approval execution queue should be readable by manager");
  const queueBody = (await readJson(queueResponse)) as {
    executions: Array<{
      id: string;
      state: string;
      domain: string;
      targetEntityType: string;
      targetEntityId: string;
    }>;
  };

  const benefitExecution = queueBody.executions.find(
    (execution) =>
      execution.targetEntityType === "BENEFIT_REQUEST" &&
      execution.targetEntityId === createBody.request.id &&
      execution.state === "PENDING"
  );
  assert.ok(benefitExecution, "pending BENEFIT_REQUEST execution should be present in approval queue");

  const approveResponse = await benefitDecisionRoute.POST(
    jsonRequest(
      "POST",
      `/api/benefits/requests/${createBody.request.id}/decision`,
      {
        decision: "APPROVED",
        reviewNote: "approved by wi-0907 test"
      },
      managerHeaders
    ),
    { params: Promise.resolve({ requestId: createBody.request.id }) } as RouteContext<{
      requestId: string;
    }>
  );
  assert.equal(approveResponse.status, 200, "manager benefit approval should succeed");
  const approveBody = (await readJson(approveResponse)) as {
    request: { id: string; status: string };
  };
  assert.equal(approveBody.request.id, createBody.request.id);
  assert.equal(approveBody.request.status, "APPROVED");

  const approvedExecutionResponse = await approvalExecutionsRoute.GET(
    new Request(
      `http://localhost/api/approval/executions?organizationId=${encodeURIComponent(
        organization.id
      )}&targetEntityType=BENEFIT_REQUEST&targetEntityId=${encodeURIComponent(
        createBody.request.id
      )}`,
      {
        method: "GET",
        headers: managerHeaders
      }
    )
  );
  assert.equal(approvedExecutionResponse.status, 200, "approved execution should be queryable");
  const approvedExecutionBody = (await readJson(approvedExecutionResponse)) as {
    executions: Array<{ targetEntityId: string; state: string }>;
  };
  assert.ok(
    approvedExecutionBody.executions.some(
      (execution) => execution.targetEntityId === createBody.request.id && execution.state === "APPROVED"
    ),
    "benefit approval execution should be updated to APPROVED"
  );

  const approvedListResponse = await benefitRequestsRoute.GET(
    new Request(
      `http://localhost/api/benefits/requests?organizationId=${encodeURIComponent(
        organization.id
      )}&employeeId=${encodeURIComponent(employeeId)}&status=APPROVED`,
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(approvedListResponse.status, 200, "employee should be able to read approved benefit requests");
  const approvedListBody = (await readJson(approvedListResponse)) as {
    requests: Array<{ id: string; status: string }>;
  };
  assert.ok(
    approvedListBody.requests.some(
      (request) => request.id === createBody.request.id && request.status === "APPROVED"
    ),
    "approved benefit request should be listed after decision"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0907-benefits-approval.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
