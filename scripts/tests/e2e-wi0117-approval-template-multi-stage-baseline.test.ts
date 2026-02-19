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
  const approvalGatePreviewRoute = await import(
    "../../src/app/api/approval/policy/gate-preview/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "FlowHR Multi Stage Org" }, actorHeaders("admin", "ADM-9170"))
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const createEmployeeResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-MULTI-STAGE-01",
        organizationId,
        name: "Multi Stage Employee",
        active: true
      },
      actorHeaders("admin", "ADM-9170", organizationId)
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
      actorHeaders("admin", "ADM-9170", organizationId)
    )
  );
  assert.equal(upsertPolicyResponse.status, 200);

  const createTemplateResponse = await approvalTemplatesRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/templates",
      {
        organizationId,
        name: "attendance-multi-stage",
        domain: "ATTENDANCE",
        approvalStages: [
          {
            stageIndex: 1,
            label: "manager-review",
            approverRoles: ["manager"],
            minApprovals: 1
          },
          {
            stageIndex: 2,
            label: "admin-final",
            approverRoles: ["admin"],
            minApprovals: 1
          }
        ],
        active: true
      },
      actorHeaders("admin", "ADM-9170", organizationId)
    )
  );
  assert.equal(createTemplateResponse.status, 201);
  const createTemplateBody = await readJson<{
    template: {
      id: string;
      approverRoles: string[];
      approvalStages: Array<{
        stageIndex: number;
        label: string;
        approverRoles: string[];
        minApprovals: number;
      }>;
    };
  }>(createTemplateResponse);
  const templateId = createTemplateBody.template.id;
  assert.deepEqual(createTemplateBody.template.approverRoles, ["manager"]);
  assert.equal(createTemplateBody.template.approvalStages.length, 2);
  assert.equal(createTemplateBody.template.approvalStages[0].label, "manager-review");

  const createAttendanceA = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-MULTI-STAGE-01",
        checkInAt: "2026-02-20T09:00:00+09:00",
        checkOutAt: "2026-02-20T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("manager", "MGR-9170", organizationId)
    )
  );
  assert.equal(createAttendanceA.status, 201);
  const createAttendanceABody = await readJson<{ record: { id: string } }>(createAttendanceA);
  const attendanceAId = createAttendanceABody.record.id;

  const managerApprovedWithStage1 = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceAId}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-9170", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceAId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(managerApprovedWithStage1.status, 200);

  const previewManagerBeforeUpdate = await approvalGatePreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/policy/gate-preview",
      {
        organizationId,
        domain: "ATTENDANCE",
        actorRole: "manager",
        actorId: "MGR-9170"
      },
      actorHeaders("admin", "ADM-9170", organizationId)
    )
  );
  assert.equal(previewManagerBeforeUpdate.status, 200);
  const previewManagerBeforeUpdateBody = await readJson<{
    preview: {
      allowed: boolean;
      expectedRoles: string[];
      matchedTemplates: Array<{ approvalStages: Array<{ stageIndex: number }> }>;
    };
  }>(previewManagerBeforeUpdate);
  assert.equal(previewManagerBeforeUpdateBody.preview.allowed, true);
  assert.deepEqual(previewManagerBeforeUpdateBody.preview.expectedRoles, ["manager"]);
  assert.equal(previewManagerBeforeUpdateBody.preview.matchedTemplates[0].approvalStages.length, 2);

  const updateTemplateResponse = await approvalTemplateByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/approval/templates/${templateId}`,
      {
        approvalStages: [
          {
            stageIndex: 1,
            label: "admin-review",
            approverRoles: ["admin"],
            minApprovals: 1
          },
          {
            stageIndex: 2,
            label: "manager-final",
            approverRoles: ["manager"],
            minApprovals: 1
          }
        ]
      },
      actorHeaders("admin", "ADM-9170", organizationId)
    ),
    { params: Promise.resolve({ templateId }) } as RouteContext<{ templateId: string }>
  );
  assert.equal(updateTemplateResponse.status, 200);
  const updateTemplateBody = await readJson<{
    template: {
      approverRoles: string[];
      approvalStages: Array<{ label: string }>;
    };
  }>(updateTemplateResponse);
  assert.deepEqual(updateTemplateBody.template.approverRoles, ["admin"]);
  assert.equal(updateTemplateBody.template.approvalStages[0].label, "admin-review");

  const createAttendanceB = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-MULTI-STAGE-01",
        checkInAt: "2026-02-21T09:00:00+09:00",
        checkOutAt: "2026-02-21T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("manager", "MGR-9170", organizationId)
    )
  );
  assert.equal(createAttendanceB.status, 201);
  const createAttendanceBBody = await readJson<{ record: { id: string } }>(createAttendanceB);
  const attendanceBId = createAttendanceBBody.record.id;

  const managerDeniedAfterUpdate = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceBId}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-9170", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceBId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(managerDeniedAfterUpdate.status, 403);

  const adminApprovedAfterUpdate = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceBId}/approve`, {
      method: "POST",
      headers: actorHeaders("admin", "ADM-9170", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceBId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(adminApprovedAfterUpdate.status, 200);

  const listTemplatesResponse = await approvalTemplatesRoute.GET(
    new Request(`http://localhost/api/approval/templates?organizationId=${organizationId}`, {
      method: "GET",
      headers: actorHeaders("admin", "ADM-9170", organizationId)
    })
  );
  assert.equal(listTemplatesResponse.status, 200);
  const listTemplatesBody = await readJson<{
    templates: Array<{
      id: string;
      approverRoles: string[];
      approvalStages: Array<{ stageIndex: number; approverRoles: string[] }>;
    }>;
  }>(listTemplatesResponse);
  const listed = listTemplatesBody.templates.find((template) => template.id === templateId);
  assert.ok(listed);
  assert.deepEqual(listed?.approverRoles, ["admin"]);
  assert.equal(listed?.approvalStages.length, 2);
  assert.deepEqual(listed?.approvalStages[0].approverRoles, ["admin"]);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("approval.template.created"));
  assert.ok(auditActions.includes("approval.template.updated"));

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("approval.template.created.v1"));
  assert.ok(eventNames.includes("approval.template.updated.v1"));

  console.log("e2e-wi0117-approval-template-multi-stage-baseline.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
