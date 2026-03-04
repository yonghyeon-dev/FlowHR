import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type JsonPayload = Record<string, unknown>;

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

function jsonRequest(path: string, payload: JsonPayload, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function seedFiftyHours(
  attendanceRoute: { POST: (request: Request) => Promise<Response> },
  employeeId: string,
  organizationId: string
) {
  for (let day = 2; day <= 6; day += 1) {
    const createResponse = await attendanceRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: `2026-03-${String(day).padStart(2, "0")}T09:00:00+09:00`,
          checkOutAt: `2026-03-${String(day).padStart(2, "0")}T19:00:00+09:00`,
          breakMinutes: 0,
          isHoliday: false
        },
        actorHeaders("employee", employeeId, organizationId)
      )
    );
    assert.equal(createResponse.status, 201, `seed attendance for day ${day} should succeed`);
  }
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess, getMemoryAuditEntries } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceRoute = await import("../../src/app/api/attendance/records/route.ts");
  const weeklyHoursRoute = await import(
    "../../src/app/api/admin/attendance/weekly-hours/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0936 Weekly Hour Limit Org"
  });
  const employeeA = "EMP-WI0936-1001";
  const employeeB = "EMP-WI0936-1002";
  const adminId = "ADMIN-WI0936-1001";

  await memoryDataAccess.employees.create({
    id: employeeA,
    organizationId: organization.id
  });
  await memoryDataAccess.employees.create({
    id: employeeB,
    organizationId: organization.id
  });

  await seedFiftyHours(attendanceRoute, employeeA, organization.id);
  await seedFiftyHours(attendanceRoute, employeeB, organization.id);

  const exceedResponse = await attendanceRoute.POST(
    jsonRequest(
      "/api/attendance/records",
      {
        employeeId: employeeA,
        checkInAt: "2026-03-07T09:00:00+09:00",
        checkOutAt: "2026-03-07T12:00:00+09:00",
        breakMinutes: 0,
        isHoliday: false
      },
      actorHeaders("employee", employeeA, organization.id)
    )
  );
  assert.equal(exceedResponse.status, 400, "50h + 3h should be rejected");
  const exceedBody = await readJson<{ error: string }>(exceedResponse);
  assert.equal(exceedBody.error, "Weekly work hour limit (52h) would be exceeded");

  const withinLimitResponse = await attendanceRoute.POST(
    jsonRequest(
      "/api/attendance/records",
      {
        employeeId: employeeB,
        checkInAt: "2026-03-07T09:00:00+09:00",
        checkOutAt: "2026-03-07T10:00:00+09:00",
        breakMinutes: 0,
        isHoliday: false
      },
      actorHeaders("employee", employeeB, organization.id)
    )
  );
  assert.equal(withinLimitResponse.status, 201, "50h + 1h should be allowed");

  const forceOverrideResponse = await attendanceRoute.POST(
    jsonRequest(
      "/api/attendance/records?force=true",
      {
        employeeId: employeeA,
        checkInAt: "2026-03-07T13:00:00+09:00",
        checkOutAt: "2026-03-07T16:00:00+09:00",
        breakMinutes: 0,
        isHoliday: false
      },
      actorHeaders("admin", adminId, organization.id)
    )
  );
  assert.equal(forceOverrideResponse.status, 201, "admin force override should allow exceeding record");
  const forceOverrideBody = await readJson<{ record: { id: string } }>(forceOverrideResponse);
  assert.ok(forceOverrideBody.record.id, "force override should create a record");

  const overrideAudit = getMemoryAuditEntries().find(
    (entry) =>
      entry.action === "attendance.weekly_limit_override" &&
      entry.entityId === forceOverrideBody.record.id
  );
  assert.ok(overrideAudit, "force override should append an audit entry");

  const weeklyHoursResponse = await weeklyHoursRoute.GET(
    new Request(
      `http://localhost/api/admin/attendance/weekly-hours?employeeId=${employeeA}&weekOf=2026-03-02`,
      {
        method: "GET",
        headers: actorHeaders("admin", adminId, organization.id)
      }
    )
  );
  assert.equal(weeklyHoursResponse.status, 200, "admin should read weekly-hours summary");
  const weeklyHoursBody = await readJson<{
    employeeId: string;
    weekOf: string;
    regularHours: number;
    overtimeHours: number;
    totalHours: number;
    limit: number;
    exceeded: boolean;
  }>(weeklyHoursResponse);
  assert.equal(weeklyHoursBody.employeeId, employeeA);
  assert.equal(weeklyHoursBody.weekOf, "2026-03-02");
  assert.equal(weeklyHoursBody.regularHours, 40);
  assert.equal(weeklyHoursBody.overtimeHours, 13);
  assert.equal(weeklyHoursBody.totalHours, 53);
  assert.equal(weeklyHoursBody.limit, 52);
  assert.equal(weeklyHoursBody.exceeded, true);

  const employeeDeniedResponse = await weeklyHoursRoute.GET(
    new Request(
      `http://localhost/api/admin/attendance/weekly-hours?employeeId=${employeeA}&weekOf=2026-03-02`,
      {
        method: "GET",
        headers: actorHeaders("employee", employeeA, organization.id)
      }
    )
  );
  assert.equal(employeeDeniedResponse.status, 403, "employee role should be forbidden");
}

run()
  .then(() => {
    console.log("e2e-wi0936-weekly-hour-limit.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
