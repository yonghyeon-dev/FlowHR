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
  const { resetMemoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");

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
  const payrollPreviewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
  const payrollConfirmRoute = await import("../../src/app/api/payroll/runs/[runId]/confirm/route.ts");

  resetMemoryDataAccess();

  const orgResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "FlowHR Approval Conditional Org" },
      actorHeaders("admin", "ADM-9113")
    )
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const createEmployeeResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-APPROVAL-COND-01",
        organizationId,
        name: "Approval Conditional Employee",
        active: true
      },
      actorHeaders("admin", "ADM-9113", organizationId)
    )
  );
  assert.equal(createEmployeeResponse.status, 201);

  const upsertPolicyResponse = await approvalPolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/approval/policy",
      {
        organizationId,
        attendanceApproverRole: "manager",
        leaveApproverRole: "manager",
        payrollApproverRole: "payroll_operator"
      },
      actorHeaders("admin", "ADM-9113", organizationId)
    )
  );
  assert.equal(upsertPolicyResponse.status, 200);

  const createAttendanceA = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-APPROVAL-COND-01",
        checkInAt: "2026-02-21T09:00:00+09:00",
        checkOutAt: "2026-02-21T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-APPROVAL-COND-01", organizationId)
    )
  );
  assert.equal(createAttendanceA.status, 201);
  const createAttendanceABody = await readJson<{ record: { id: string } }>(createAttendanceA);

  const approveAttendanceA = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createAttendanceABody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-9113", organizationId)
    }),
    { params: Promise.resolve({ recordId: createAttendanceABody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveAttendanceA.status, 200);

  const previewHighResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-APPROVAL-COND-01",
        hourlyRateKrw: 12000
      },
      actorHeaders("payroll_operator", "PAY-9113", organizationId)
    )
  );
  assert.equal(previewHighResponse.status, 200);
  const previewHighBody = await readJson<{ run: { id: string; grossPayKrw: number } }>(previewHighResponse);
  assert.equal(previewHighBody.run.grossPayKrw, 96000);

  const createTemplateResponse = await approvalTemplatesRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/templates",
      {
        organizationId,
        name: "payroll-high-amount-admin-line",
        domain: "PAYROLL",
        approverRoles: ["admin"],
        payrollGrossPayMinKrw: 90000,
        active: true
      },
      actorHeaders("admin", "ADM-9113", organizationId)
    )
  );
  assert.equal(createTemplateResponse.status, 201);
  const createTemplateBody = await readJson<{
    template: {
      id: string;
      payrollGrossPayMinKrw: number | null;
      payrollGrossPayMaxKrw: number | null;
    };
  }>(createTemplateResponse);
  const templateId = createTemplateBody.template.id;
  assert.equal(createTemplateBody.template.payrollGrossPayMinKrw, 90000);
  assert.equal(createTemplateBody.template.payrollGrossPayMaxKrw, null);

  const operatorDeniedConfirmHigh = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${previewHighBody.run.id}/confirm`, {
      method: "POST",
      headers: actorHeaders("payroll_operator", "PAY-9113", organizationId)
    }),
    { params: Promise.resolve({ runId: previewHighBody.run.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(operatorDeniedConfirmHigh.status, 403);

  const adminConfirmHigh = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${previewHighBody.run.id}/confirm`, {
      method: "POST",
      headers: actorHeaders("admin", "ADM-9113", organizationId)
    }),
    { params: Promise.resolve({ runId: previewHighBody.run.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(adminConfirmHigh.status, 200);

  const createAttendanceB = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-APPROVAL-COND-01",
        checkInAt: "2026-02-22T09:00:00+09:00",
        checkOutAt: "2026-02-22T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-APPROVAL-COND-01", organizationId)
    )
  );
  assert.equal(createAttendanceB.status, 201);
  const createAttendanceBBody = await readJson<{ record: { id: string } }>(createAttendanceB);

  const approveAttendanceB = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createAttendanceBBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-9113", organizationId)
    }),
    { params: Promise.resolve({ recordId: createAttendanceBBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveAttendanceB.status, 200);

  const previewLowResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview",
      {
        periodStart: "2026-02-22T00:00:00+09:00",
        periodEnd: "2026-02-22T23:59:59+09:00",
        employeeId: "EMP-APPROVAL-COND-01",
        hourlyRateKrw: 10000
      },
      actorHeaders("payroll_operator", "PAY-9113", organizationId)
    )
  );
  assert.equal(previewLowResponse.status, 200);
  const previewLowBody = await readJson<{ run: { id: string; grossPayKrw: number } }>(previewLowResponse);
  assert.equal(previewLowBody.run.grossPayKrw, 80000);

  const operatorConfirmLow = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${previewLowBody.run.id}/confirm`, {
      method: "POST",
      headers: actorHeaders("payroll_operator", "PAY-9113", organizationId)
    }),
    { params: Promise.resolve({ runId: previewLowBody.run.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(
    operatorConfirmLow.status,
    200,
    "when template condition is not met, gate should fallback to policy role"
  );

  const invalidAttendanceTemplateWithPayrollCondition = await approvalTemplatesRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/templates",
      {
        organizationId,
        name: "invalid-attendance-template-with-payroll-condition",
        domain: "ATTENDANCE",
        approverRoles: ["manager"],
        payrollGrossPayMinKrw: 1000
      },
      actorHeaders("admin", "ADM-9113", organizationId)
    )
  );
  assert.equal(invalidAttendanceTemplateWithPayrollCondition.status, 400);

  const patchTemplateDomainResponse = await approvalTemplateByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/approval/templates/${templateId}`,
      {
        domain: "ATTENDANCE",
        approverRoles: ["manager"]
      },
      actorHeaders("admin", "ADM-9113", organizationId)
    ),
    { params: Promise.resolve({ templateId }) } as RouteContext<{ templateId: string }>
  );
  assert.equal(patchTemplateDomainResponse.status, 200);
  const patchTemplateDomainBody = await readJson<{
    template: {
      domain: "ATTENDANCE" | "LEAVE" | "PAYROLL";
      payrollGrossPayMinKrw: number | null;
      payrollGrossPayMaxKrw: number | null;
    };
  }>(patchTemplateDomainResponse);
  assert.equal(patchTemplateDomainBody.template.domain, "ATTENDANCE");
  assert.equal(patchTemplateDomainBody.template.payrollGrossPayMinKrw, null);
  assert.equal(patchTemplateDomainBody.template.payrollGrossPayMaxKrw, null);

  console.log("e2e-wi0113-approval-template-payroll-conditional-routing.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
