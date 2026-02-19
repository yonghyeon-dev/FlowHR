import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

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
  const approvalTemplatesRoute = await import("../../src/app/api/approval/templates/route.ts");
  const approvalTemplateByIdRoute = await import(
    "../../src/app/api/approval/templates/[templateId]/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "FlowHR Approval Template Org" }, actorHeaders("admin", "ADM-9100"))
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const createEmployeeResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-APPROVAL-TEMPLATE-01",
        organizationId,
        name: "Approval Template Employee",
        active: true
      },
      actorHeaders("admin", "ADM-9100", organizationId)
    )
  );
  assert.equal(createEmployeeResponse.status, 201);

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
      actorHeaders("admin", "ADM-9100", organizationId)
    )
  );
  assert.equal(upsertPolicyResponse.status, 200);

  const createAttendanceA = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-APPROVAL-TEMPLATE-01",
        checkInAt: "2026-02-19T09:00:00+09:00",
        checkOutAt: "2026-02-19T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("manager", "MGR-9100", organizationId)
    )
  );
  assert.equal(createAttendanceA.status, 201);
  const createAttendanceABody = await readJson<{ record: { id: string } }>(createAttendanceA);
  const attendanceAId = createAttendanceABody.record.id;

  const managerDeniedBeforeTemplate = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceAId}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-9100", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceAId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(managerDeniedBeforeTemplate.status, 403);

  const managerCreateTemplateDenied = await approvalTemplatesRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/templates",
      {
        organizationId,
        name: "manager-attempt",
        domain: "ATTENDANCE",
        approverRoles: ["manager"]
      },
      actorHeaders("manager", "MGR-9100", organizationId)
    )
  );
  assert.equal(managerCreateTemplateDenied.status, 403);

  const createTemplateResponse = await approvalTemplatesRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/templates",
      {
        organizationId,
        name: "attendance-default-line",
        domain: "ATTENDANCE",
        approverRoles: ["manager", "admin"],
        active: true
      },
      actorHeaders("admin", "ADM-9100", organizationId)
    )
  );
  assert.equal(createTemplateResponse.status, 201);
  const createTemplateBody = await readJson<{ template: { id: string; active: boolean } }>(
    createTemplateResponse
  );
  const templateId = createTemplateBody.template.id;
  assert.equal(createTemplateBody.template.active, true);

  const duplicateActiveTemplateResponse = await approvalTemplatesRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/templates",
      {
        organizationId,
        name: "attendance-second-line",
        domain: "ATTENDANCE",
        approverRoles: ["manager"],
        active: true
      },
      actorHeaders("admin", "ADM-9100", organizationId)
    )
  );
  assert.equal(duplicateActiveTemplateResponse.status, 409);

  const managerApprovedWithTemplate = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceAId}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-9100", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceAId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(managerApprovedWithTemplate.status, 200);

  const deactivateTemplateResponse = await approvalTemplateByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/approval/templates/${templateId}`,
      { active: false },
      actorHeaders("admin", "ADM-9100", organizationId)
    ),
    { params: Promise.resolve({ templateId }) } as RouteContext<{ templateId: string }>
  );
  assert.equal(deactivateTemplateResponse.status, 200);

  const createAttendanceB = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-APPROVAL-TEMPLATE-01",
        checkInAt: "2026-02-20T09:00:00+09:00",
        checkOutAt: "2026-02-20T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("manager", "MGR-9100", organizationId)
    )
  );
  assert.equal(createAttendanceB.status, 201);
  const createAttendanceBBody = await readJson<{ record: { id: string } }>(createAttendanceB);
  const attendanceBId = createAttendanceBBody.record.id;

  const managerDeniedAfterDeactivate = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceBId}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-9100", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceBId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(managerDeniedAfterDeactivate.status, 403);

  const listTemplatesResponse = await approvalTemplatesRoute.GET(
    new Request(`http://localhost/api/approval/templates?organizationId=${organizationId}`, {
      method: "GET",
      headers: actorHeaders("admin", "ADM-9100", organizationId)
    })
  );
  assert.equal(listTemplatesResponse.status, 200);
  const listTemplatesBody = await readJson<{ templates: Array<{ id: string; active: boolean }> }>(
    listTemplatesResponse
  );
  assert.ok(
    listTemplatesBody.templates.some((template) => template.id === templateId && template.active === false)
  );

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("approval.template.created"));
  assert.ok(auditActions.includes("approval.template.updated"));

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("approval.template.created.v1"));
  assert.ok(eventNames.includes("approval.template.updated.v1"));

  console.log("e2e-wi0109-approval-line-template.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
