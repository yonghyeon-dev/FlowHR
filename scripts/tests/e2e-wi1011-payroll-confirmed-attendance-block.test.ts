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
  const payrollHeaders = actorHeaders("payroll_operator", "PAY-WI1011-1001", input.organizationId);

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
    name: "WI-1011 Org"
  });
  const employee = await memoryDataAccess.employees.create({
    id: "EMP-WI1011-1001",
    organizationId: organization.id,
    name: "Kim WI1011"
  });

  await finalizePayrollForMonth(payrollPreviewRoute, payrollConfirmRoute, {
    employeeId: employee.id,
    organizationId: organization.id,
    periodStart: "2026-02-01T00:00:00+09:00",
    periodEnd: "2026-02-28T23:59:59+09:00"
  });

  const employeeHeaders = actorHeaders("employee", employee.id, organization.id);

  const blockedCreateResponse = await attendanceRecordsRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: employee.id,
        checkInAt: "2026-02-10T09:00:00+09:00",
        breakMinutes: 0,
        isHoliday: false,
        notes: "should be blocked"
      },
      employeeHeaders
    )
  );
  assert.equal(
    blockedCreateResponse.status,
    400,
    "attendance create should be blocked when payroll is confirmed"
  );
  const blockedCreateBody = await readJson<{ error: string }>(blockedCreateResponse);
  assert.equal(blockedCreateBody.error, "confirmed payroll period — attendance locked");

  const allowedCreateResponse = await attendanceRecordsRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: employee.id,
        checkInAt: "2026-03-10T09:00:00+09:00",
        breakMinutes: 0,
        isHoliday: false,
        notes: "allowed"
      },
      employeeHeaders
    )
  );
  assert.equal(
    allowedCreateResponse.status,
    201,
    "attendance create should succeed when payroll is not confirmed for that date"
  );
  const allowedCreateBody = await readJson<{ record: { id: string } }>(allowedCreateResponse);

  const blockedUpdateResponse = await attendanceRecordRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/attendance/records/${allowedCreateBody.record.id}`,
      {
        checkInAt: "2026-02-15T09:00:00+09:00",
        notes: "move into locked month"
      },
      employeeHeaders
    ),
    { params: Promise.resolve({ recordId: allowedCreateBody.record.id }) }
  );
  assert.equal(
    blockedUpdateResponse.status,
    400,
    "attendance update should be blocked when moving a record into a confirmed payroll period"
  );
  const blockedUpdateBody = await readJson<{ error: string }>(blockedUpdateResponse);
  assert.equal(blockedUpdateBody.error, "confirmed payroll period — attendance locked");
}

run()
  .then(() => {
    console.log("e2e-wi1011-payroll-confirmed-attendance-block.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
