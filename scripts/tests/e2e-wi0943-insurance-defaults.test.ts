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
runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

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

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const insuranceRatesRoute = await import("../../src/app/api/admin/insurance/rates/route.ts");
  const payrollPreviewRoute = await import("../../src/app/api/payroll/preview/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0943 Org" });
  const employeeId = "EMP-WI0943-1001";
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: organization.id });

  const adminHeaders = actorHeaders("admin", "ADM-WI0943-1001", organization.id);
  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);
  const payrollHeaders = actorHeaders("payroll_operator", "PAY-WI0943-1001", organization.id);

  const getDefaultsResponse = await insuranceRatesRoute.GET(
    new Request("http://localhost/api/admin/insurance/rates", {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(getDefaultsResponse.status, 200, "admin should read insurance default rates");
  const defaultsBody = await readJson<{
    nps: number;
    nhi: number;
    ei: number;
    wci: number | null;
    effectiveYear: number;
  }>(getDefaultsResponse);
  assert.deepEqual(defaultsBody, {
    nps: 0.045,
    nhi: 0.03545,
    ei: 0.009,
    wci: null,
    effectiveYear: 2026
  });

  const putResponse = await insuranceRatesRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/admin/insurance/rates",
      {
        nps: 0.05,
        nhi: 0.04,
        ei: 0.01,
        wci: 0.02
      },
      adminHeaders
    )
  );
  assert.equal(putResponse.status, 200, "admin should update organization insurance rates");
  const putBody = await readJson<{
    nps: number;
    nhi: number;
    ei: number;
    wci: number | null;
    effectiveYear: number;
  }>(putResponse);
  assert.deepEqual(putBody, {
    nps: 0.05,
    nhi: 0.04,
    ei: 0.01,
    wci: 0.02,
    effectiveYear: 2026
  });

  const getAfterPutResponse = await insuranceRatesRoute.GET(
    new Request("http://localhost/api/admin/insurance/rates", {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(getAfterPutResponse.status, 200, "admin should read updated insurance rates");
  const afterPutBody = await readJson<{
    nps: number;
    nhi: number;
    ei: number;
    wci: number | null;
    effectiveYear: number;
  }>(getAfterPutResponse);
  assert.deepEqual(afterPutBody, putBody);

  const employeeDeniedResponse = await insuranceRatesRoute.GET(
    new Request("http://localhost/api/admin/insurance/rates", {
      method: "GET",
      headers: employeeHeaders
    })
  );
  assert.equal(employeeDeniedResponse.status, 403, "employee role should be forbidden");

  const createAttendanceResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId,
        checkInAt: "2026-02-14T09:00:00+09:00",
        checkOutAt: "2026-02-14T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      employeeHeaders
    )
  );
  assert.equal(createAttendanceResponse.status, 201, "attendance creation should succeed");
  const createdAttendanceBody = await readJson<{ record: { id: string } }>(createAttendanceResponse);

  const approveAttendanceResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdAttendanceBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-WI0943-1001", organization.id)
    }),
    { params: Promise.resolve({ recordId: createdAttendanceBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveAttendanceResponse.status, 200, "attendance approval should succeed");

  const previewResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/preview",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId,
        hourlyRateKrw: 12000
      },
      payrollHeaders
    )
  );
  assert.equal(previewResponse.status, 200, "payroll preview should succeed");
  const previewBody = await readJson<{
    summary: {
      deductionMode: "manual" | "profile" | "statutory_kr_baseline";
      socialInsuranceKrw: number;
      insuranceBreakdown: {
        nps: number;
        nhi: number;
        ei: number;
        wci: number;
      } | null;
      deductionBreakdown: {
        additional?: {
          insuranceBreakdown?: {
            nps: number;
            nhi: number;
            ei: number;
            wci: number;
          };
        };
      };
    };
  }>(previewResponse);
  assert.equal(previewBody.summary.deductionMode, "statutory_kr_baseline");
  assert.equal(previewBody.summary.socialInsuranceKrw, 12017);
  assert.deepEqual(previewBody.summary.insuranceBreakdown, {
    nps: 4800,
    nhi: 3840,
    ei: 960,
    wci: 1920
  });
  assert.deepEqual(previewBody.summary.deductionBreakdown.additional?.insuranceBreakdown, {
    nps: 4800,
    nhi: 3840,
    ei: 960,
    wci: 1920
  });
}

run()
  .then(() => {
    console.log("e2e-wi0943-insurance-defaults.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
