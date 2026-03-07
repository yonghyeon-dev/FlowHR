import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_TENANCY_V1 = "true";
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

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceRecordRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");

  resetMemoryDataAccess();

  const orgA = await memoryDataAccess.organizations.create({ name: "WI-1027 Org A" });
  const orgB = await memoryDataAccess.organizations.create({ name: "WI-1027 Org B" });

  const employeeA = "EMP-WI1027-A";
  const employeeB = "EMP-WI1027-B";
  await memoryDataAccess.employees.create({ id: employeeA, organizationId: orgA.id });
  await memoryDataAccess.employees.create({ id: employeeB, organizationId: orgB.id });

  const createResponse = await attendanceRecordsRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: employeeA,
        checkInAt: "2026-03-07T09:00:00+09:00",
        checkOutAt: "2026-03-07T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false,
        notes: "WI-1027 seed"
      },
      actorHeaders("employee", employeeA, orgA.id)
    )
  );
  assert.equal(createResponse.status, 201, "attendance seed create should succeed");
  const createBody = await readJson<{ record: { id: string; employeeId: string; notes: string | null } }>(
    createResponse
  );

  const readResponse = await attendanceRecordRoute.GET(
    new Request(`http://localhost/api/attendance/records/${createBody.record.id}`, {
      method: "GET",
      headers: actorHeaders("employee", employeeA, orgA.id)
    }),
    { params: Promise.resolve({ recordId: createBody.record.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(readResponse.status, 200, "employee should read own attendance record");
  const readBody = await readJson<{ record: { id: string; employeeId: string; notes: string | null } }>(
    readResponse
  );
  assert.equal(readBody.record.id, createBody.record.id, "read should return the requested record");
  assert.equal(readBody.record.employeeId, employeeA, "read should remain scoped to the record employee");
  assert.equal(readBody.record.notes, "WI-1027 seed", "read should return persisted fields");

  const missingResponse = await attendanceRecordRoute.GET(
    new Request("http://localhost/api/attendance/records/AR-MISSING", {
      method: "GET",
      headers: actorHeaders("employee", employeeA, orgA.id)
    }),
    { params: Promise.resolve({ recordId: "AR-MISSING" }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(missingResponse.status, 404, "missing attendance record should return 404");

  const crossTenantResponse = await attendanceRecordRoute.GET(
    new Request(`http://localhost/api/attendance/records/${createBody.record.id}`, {
      method: "GET",
      headers: actorHeaders("manager", "MGR-WI1027-B", orgB.id)
    }),
    { params: Promise.resolve({ recordId: createBody.record.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(crossTenantResponse.status, 404, "cross-tenant record read should return 404");

  const unauthenticatedResponse = await attendanceRecordRoute.GET(
    new Request(`http://localhost/api/attendance/records/${createBody.record.id}`, {
      method: "GET"
    }),
    { params: Promise.resolve({ recordId: createBody.record.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(unauthenticatedResponse.status, 401, "unauthenticated record read should return 401");
}

run()
  .then(() => {
    console.log("e2e-wi1027-attendance-record-get-handler.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
