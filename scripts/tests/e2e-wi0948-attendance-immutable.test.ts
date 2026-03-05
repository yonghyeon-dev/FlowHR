import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

type JsonPayload = Record<string, unknown>;

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
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

async function createAttendanceRecord(
  attendanceRecordsRoute: { POST: (request: Request) => Promise<Response> },
  input: {
    employeeId: string;
    organizationId: string;
    checkInAt: string;
  }
) {
  const employeeHeaders = actorHeaders("employee", input.employeeId, input.organizationId);
  const response = await attendanceRecordsRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: input.employeeId,
        checkInAt: input.checkInAt,
        breakMinutes: 0,
        isHoliday: false,
        notes: "WI-0948 seed"
      },
      employeeHeaders
    )
  );
  assert.equal(response.status, 201, "attendance create should succeed");
  const body = await readJson<{ record: { id: string } }>(response);
  return body.record.id;
}

async function finalizePayrollForMonth(
  payrollPreviewRoute: { POST: (request: Request) => Promise<Response> },
  payrollConfirmRoute: {
    POST: (
      request: Request,
      context: RouteContext<{ runId: string }>
    ) => Promise<Response>;
  },
  input: {
    employeeId: string;
    organizationId: string;
    periodStart: string;
    periodEnd: string;
  }
) {
  const payrollHeaders = actorHeaders("payroll_operator", "PAY-WI0948-1001", input.organizationId);

  const previewResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview",
      {
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        employeeId: input.employeeId,
        hourlyRateKrw: 20000
      },
      payrollHeaders
    )
  );
  assert.equal(previewResponse.status, 200, "payroll preview should succeed");
  const previewBody = await readJson<{ run: { id: string } }>(previewResponse);

  const confirmResponse = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${previewBody.run.id}/confirm`, {
      method: "POST",
      headers: payrollHeaders
    }),
    {
      params: Promise.resolve({ runId: previewBody.run.id })
    }
  );
  assert.equal(confirmResponse.status, 200, "payroll confirm should succeed");
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceRecordRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");
  const payrollPreviewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
  const payrollConfirmRoute = await import(
    "../../src/app/api/payroll/runs/[runId]/confirm/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0948 Org"
  });
  const employee = await memoryDataAccess.employees.create({
    id: "EMP-WI0948-1001",
    organizationId: organization.id,
    name: "Kim WI0948"
  });

  const firstAttendanceId = await createAttendanceRecord(attendanceRecordsRoute, {
    employeeId: employee.id,
    organizationId: organization.id,
    checkInAt: "2026-02-10T09:00:00+09:00"
  });
  const secondAttendanceId = await createAttendanceRecord(attendanceRecordsRoute, {
    employeeId: employee.id,
    organizationId: organization.id,
    checkInAt: "2026-02-11T09:00:00+09:00"
  });

  await finalizePayrollForMonth(payrollPreviewRoute, payrollConfirmRoute, {
    employeeId: employee.id,
    organizationId: organization.id,
    periodStart: "2026-02-01T00:00:00+09:00",
    periodEnd: "2026-02-28T23:59:59+09:00"
  });

  const employeeHeaders = actorHeaders("employee", employee.id, organization.id);

  const patchBlockedResponse = await attendanceRecordRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/attendance/records/${firstAttendanceId}`,
      {
        checkOutAt: "2026-02-10T18:00:00+09:00",
        breakMinutes: 60,
        notes: "should be blocked"
      },
      employeeHeaders
    ),
    { params: Promise.resolve({ recordId: firstAttendanceId }) }
  );
  assert.equal(
    patchBlockedResponse.status,
    409,
    "attendance update should be blocked when payroll is finalized"
  );
  const patchBlockedBody = await readJson<{ error: string }>(patchBlockedResponse);
  assert.match(
    patchBlockedBody.error,
    /finalized.*payroll|payroll.*finalized/i,
    "update error should mention finalized payroll"
  );

  const deleteBlockedResponse = await attendanceRecordRoute.DELETE(
    new Request(`http://localhost/api/attendance/records/${secondAttendanceId}`, {
      method: "DELETE",
      headers: employeeHeaders
    }),
    { params: Promise.resolve({ recordId: secondAttendanceId }) }
  );
  assert.equal(
    deleteBlockedResponse.status,
    409,
    "attendance delete should be blocked when payroll is finalized"
  );
  const deleteBlockedBody = await readJson<{ error: string }>(deleteBlockedResponse);
  assert.match(
    deleteBlockedBody.error,
    /finalized.*payroll|payroll.*finalized/i,
    "delete error should mention finalized payroll"
  );

  const mutableAttendanceId = await createAttendanceRecord(attendanceRecordsRoute, {
    employeeId: employee.id,
    organizationId: organization.id,
    checkInAt: "2026-03-12T09:00:00+09:00"
  });
  const patchAllowedResponse = await attendanceRecordRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/attendance/records/${mutableAttendanceId}`,
      {
        checkOutAt: "2026-03-12T18:00:00+09:00",
        breakMinutes: 60,
        notes: "allowed"
      },
      employeeHeaders
    ),
    { params: Promise.resolve({ recordId: mutableAttendanceId }) }
  );
  assert.equal(
    patchAllowedResponse.status,
    200,
    "attendance update should succeed when no finalized payroll exists for that month"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0948-attendance-immutable.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
