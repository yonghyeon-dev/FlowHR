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
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
  };
  if (organizationId) {
    headers["x-actor-organization-id"] = organizationId;
  }
  return headers;
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
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const attendanceRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const approvalPolicyRoute = await import("../../src/app/api/approval/policy/route.ts");
  const approvalDelegationsRoute = await import("../../src/app/api/approval/delegations/route.ts");
  const approvalDelegationByIdRoute = await import(
    "../../src/app/api/approval/delegations/[delegationId]/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "FlowHR QA Org" }, actorHeaders("admin", "ADM-1"))
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = (await readJson(orgResponse)) as { organization: { id: string } };
  const organizationId = orgBody.organization.id;

  const createEmployeeResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-APPROVAL-01",
        organizationId,
        name: "Approval Employee",
        active: true
      },
      actorHeaders("admin", "ADM-1", organizationId)
    )
  );
  assert.equal(createEmployeeResponse.status, 201);

  const readDefaultPolicyResponse = await approvalPolicyRoute.GET(
    new Request(`http://localhost/api/approval/policy?organizationId=${organizationId}`, {
      method: "GET",
      headers: actorHeaders("manager", "MGR-1", organizationId)
    })
  );
  assert.equal(readDefaultPolicyResponse.status, 200);
  const readDefaultPolicyBody = (await readJson(readDefaultPolicyResponse)) as {
    configured: boolean;
    policy: { attendanceApproverRole: string };
  };
  assert.equal(readDefaultPolicyBody.configured, false);
  assert.equal(readDefaultPolicyBody.policy.attendanceApproverRole, "manager");

  const upsertPolicyResponse = await approvalPolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/approval/policy",
      {
        organizationId,
        attendanceApproverRole: "admin",
        leaveApproverRole: "manager",
        payrollApproverRole: "payroll_operator"
      },
      actorHeaders("admin", "ADM-1", organizationId)
    )
  );
  assert.equal(upsertPolicyResponse.status, 200, "policy upsert should succeed");

  const createAttendanceRecordA = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-APPROVAL-01",
        checkInAt: "2026-02-18T09:00:00+09:00",
        checkOutAt: "2026-02-18T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("manager", "MGR-1", organizationId)
    )
  );
  assert.equal(createAttendanceRecordA.status, 201);
  const createAttendanceBodyA = (await readJson(createAttendanceRecordA)) as {
    record: { id: string };
  };
  const attendanceIdA = createAttendanceBodyA.record.id;

  const managerApproveDenied = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceIdA}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceIdA }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(managerApproveDenied.status, 403, "manager should be denied without delegation");

  const createDelegationResponse = await approvalDelegationsRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/delegations",
      {
        organizationId,
        domain: "ATTENDANCE",
        delegatorRole: "admin",
        delegateActorId: "MGR-1",
        startsAt: "2026-02-01T00:00:00+09:00",
        endsAt: "2026-12-31T23:59:59+09:00",
        reason: "admin vacation coverage"
      },
      actorHeaders("admin", "ADM-1", organizationId)
    )
  );
  assert.equal(createDelegationResponse.status, 201, "delegation create should succeed");
  const createDelegationBody = (await readJson(createDelegationResponse)) as {
    delegation: { id: string; active: boolean };
  };
  assert.equal(createDelegationBody.delegation.active, true);
  const delegationId = createDelegationBody.delegation.id;

  const createAttendanceRecordB = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-APPROVAL-01",
        checkInAt: "2026-02-19T09:00:00+09:00",
        checkOutAt: "2026-02-19T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("manager", "MGR-1", organizationId)
    )
  );
  assert.equal(createAttendanceRecordB.status, 201);
  const createAttendanceBodyB = (await readJson(createAttendanceRecordB)) as {
    record: { id: string };
  };
  const attendanceIdB = createAttendanceBodyB.record.id;

  const managerApproveAllowed = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceIdB}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceIdB }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(managerApproveAllowed.status, 200, "delegated manager should be allowed");

  const deactivateDelegationResponse = await approvalDelegationByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/approval/delegations/${delegationId}`,
      { active: false },
      actorHeaders("admin", "ADM-1", organizationId)
    ),
    { params: Promise.resolve({ delegationId }) } as RouteContext<{ delegationId: string }>
  );
  assert.equal(deactivateDelegationResponse.status, 200, "delegation deactivate should succeed");

  const createAttendanceRecordC = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-APPROVAL-01",
        checkInAt: "2026-02-20T09:00:00+09:00",
        checkOutAt: "2026-02-20T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("manager", "MGR-1", organizationId)
    )
  );
  assert.equal(createAttendanceRecordC.status, 201);
  const createAttendanceBodyC = (await readJson(createAttendanceRecordC)) as {
    record: { id: string };
  };
  const attendanceIdC = createAttendanceBodyC.record.id;

  const managerApproveDeniedAfterDeactivate = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceIdC}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceIdC }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(
    managerApproveDeniedAfterDeactivate.status,
    403,
    "manager should be denied after delegation deactivation"
  );

  const listDelegationsResponse = await approvalDelegationsRoute.GET(
    new Request(`http://localhost/api/approval/delegations?organizationId=${organizationId}`, {
      method: "GET",
      headers: actorHeaders("admin", "ADM-1", organizationId)
    })
  );
  assert.equal(listDelegationsResponse.status, 200);
  const listDelegationsBody = (await readJson(listDelegationsResponse)) as {
    delegations: Array<{ id: string; active: boolean }>;
  };
  assert.ok(
    listDelegationsBody.delegations.some(
      (delegation) => delegation.id === delegationId && delegation.active === false
    ),
    "delegation list should include deactivated delegation"
  );

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("approval.policy.updated"), "audit should include approval.policy.updated");
  assert.ok(auditActions.includes("approval.delegation.created"), "audit should include approval.delegation.created");
  assert.ok(auditActions.includes("approval.delegation.updated"), "audit should include approval.delegation.updated");

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("approval.policy.updated.v1"), "event should include approval.policy.updated.v1");
  assert.ok(
    eventNames.includes("approval.delegation.created.v1"),
    "event should include approval.delegation.created.v1"
  );
  assert.ok(
    eventNames.includes("approval.delegation.updated.v1"),
    "event should include approval.delegation.updated.v1"
  );

  console.log("e2e-wi0103-approval-policy-delegation.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
