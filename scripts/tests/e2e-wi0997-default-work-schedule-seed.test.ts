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

function toIsoRangeCurrentMonthInKst() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mm = String(month).padStart(2, "0");
  const dd = String(lastDay).padStart(2, "0");
  return {
    from: `${year}-${mm}-01T00:00:00+09:00`,
    to: `${year}-${mm}-${dd}T23:59:59+09:00`
  };
}

function weekdayInKst(isoDateTime: string) {
  const base = new Date(isoDateTime);
  const shifted = new Date(base.getTime() + 9 * 60 * 60 * 1000);
  const day = shifted.getUTCDay();
  return day === 0 ? 7 : day;
}

function timeInKst(isoDateTime: string) {
  const base = new Date(isoDateTime);
  const shifted = new Date(base.getTime() + 9 * 60 * 60 * 1000);
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const peopleEmployeesRoute = await import("../../src/app/api/people/employees/route.ts");
  const employeeStatusRoute = await import("../../src/app/api/employees/[id]/status/route.ts");
  const schedulesRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const seedDefaultsRoute = await import("../../src/app/api/scheduling/schedules/seed-defaults/route.ts");

  resetMemoryDataAccess();

  const org = await memoryDataAccess.organizations.create({ name: "WI-0997 Org" });
  const adminHeaders = actorHeaders("admin", "ADM-WI0997-1001", org.id);
  const monthRange = toIsoRangeCurrentMonthInKst();

  const activeEmployeeId = "EMP-WI0997-ACTIVE-1001";
  const createActiveResponse = await peopleEmployeesRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: activeEmployeeId,
        organizationId: org.id,
        name: "Default Schedule Active Employee",
        status: "ACTIVE"
      },
      adminHeaders
    )
  );
  assert.equal(createActiveResponse.status, 201, "ACTIVE employee create should succeed");

  const activeSchedulesResponse = await schedulesRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=${encodeURIComponent(monthRange.from)}&to=${encodeURIComponent(
        monthRange.to
      )}&employeeId=${encodeURIComponent(activeEmployeeId)}`,
      { method: "GET", headers: adminHeaders }
    )
  );
  assert.equal(activeSchedulesResponse.status, 200, "admin schedule query should succeed");
  const activeSchedulesBody = await readJson<{
    schedules: Array<{
      id: string;
      employeeId: string;
      startAt: string;
      endAt: string;
      breakMinutes: number;
      isHoliday: boolean;
    }>;
  }>(activeSchedulesResponse);
  assert.ok(
    activeSchedulesBody.schedules.length > 0,
    "ACTIVE employee should receive default schedules in the current month"
  );
  assert.ok(
    activeSchedulesBody.schedules.every((schedule) => weekdayInKst(schedule.startAt) >= 1 && weekdayInKst(schedule.startAt) <= 5),
    "default schedules should be assigned on weekdays only"
  );
  assert.ok(
    activeSchedulesBody.schedules.every(
      (schedule) =>
        timeInKst(schedule.startAt) === "09:00" &&
        timeInKst(schedule.endAt) === "18:00" &&
        schedule.breakMinutes === 60 &&
        !schedule.isHoliday
    ),
    "default schedules should be Mon-Fri 09:00-18:00 with 60m break"
  );

  const employeeSchedulesResponse = await schedulesRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=${encodeURIComponent(monthRange.from)}&to=${encodeURIComponent(
        monthRange.to
      )}`,
      {
        method: "GET",
        headers: actorHeaders("employee", activeEmployeeId, org.id)
      }
    )
  );
  assert.equal(employeeSchedulesResponse.status, 200, "employee schedule page API should succeed");
  const employeeSchedulesBody = await readJson<{ schedules: Array<{ employeeId: string }> }>(employeeSchedulesResponse);
  assert.ok(employeeSchedulesBody.schedules.length > 0, "employee schedule page should return seeded schedules");
  assert.ok(
    employeeSchedulesBody.schedules.every((schedule) => schedule.employeeId === activeEmployeeId),
    "employee schedule page should only return current employee schedules"
  );

  const onLeaveEmployeeId = "EMP-WI0997-LEAVE-1002";
  const createOnLeaveResponse = await peopleEmployeesRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: onLeaveEmployeeId,
        organizationId: org.id,
        name: "On Leave Employee",
        status: "ON_LEAVE"
      },
      adminHeaders
    )
  );
  assert.equal(createOnLeaveResponse.status, 201, "ON_LEAVE employee create should succeed");

  const onLeaveBeforeResponse = await schedulesRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=${encodeURIComponent(monthRange.from)}&to=${encodeURIComponent(
        monthRange.to
      )}&employeeId=${encodeURIComponent(onLeaveEmployeeId)}`,
      { method: "GET", headers: adminHeaders }
    )
  );
  const onLeaveBeforeBody = await readJson<{ schedules: Array<{ id: string }> }>(onLeaveBeforeResponse);
  assert.equal(onLeaveBeforeBody.schedules.length, 0, "ON_LEAVE employee should not receive default schedules");

  const activateResponse = await employeeStatusRoute.PATCH(
    jsonRequest("PATCH", `/api/employees/${onLeaveEmployeeId}/status`, { status: "ACTIVE" }, adminHeaders),
    { params: Promise.resolve({ id: onLeaveEmployeeId }) } as RouteContext<{ id: string }>
  );
  assert.equal(activateResponse.status, 200, "ON_LEAVE -> ACTIVE transition should succeed");

  const onLeaveAfterResponse = await schedulesRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=${encodeURIComponent(monthRange.from)}&to=${encodeURIComponent(
        monthRange.to
      )}&employeeId=${encodeURIComponent(onLeaveEmployeeId)}`,
      { method: "GET", headers: adminHeaders }
    )
  );
  const onLeaveAfterBody = await readJson<{ schedules: Array<{ id: string }> }>(onLeaveAfterResponse);
  assert.ok(onLeaveAfterBody.schedules.length > 0, "employee activation should seed default schedules");

  const seedOrg = await memoryDataAccess.organizations.create({ name: "WI-0997 Empty Org" });
  const seedAdminHeaders = actorHeaders("admin", "ADM-WI0997-2001", seedOrg.id);
  await memoryDataAccess.employees.create({
    id: "EMP-WI0997-SEED-2001",
    organizationId: seedOrg.id,
    status: "ACTIVE"
  });

  const seedStateBefore = await seedDefaultsRoute.GET(
    new Request("http://localhost/api/scheduling/schedules/seed-defaults", {
      method: "GET",
      headers: seedAdminHeaders
    })
  );
  assert.equal(seedStateBefore.status, 200, "seed-defaults status should load");
  const seedStateBeforeBody = await readJson<{ showSeedDefaultsAction: boolean }>(seedStateBefore);
  assert.equal(seedStateBeforeBody.showSeedDefaultsAction, true, "button should show when no schedules exist");

  const seedRunResponse = await seedDefaultsRoute.POST(
    new Request("http://localhost/api/scheduling/schedules/seed-defaults", {
      method: "POST",
      headers: seedAdminHeaders
    })
  );
  assert.equal(seedRunResponse.status, 200, "seed-defaults action should succeed");
  const seedRunBody = await readJson<{ createdSchedules: number }>(seedRunResponse);
  assert.ok(seedRunBody.createdSchedules > 0, "seed-defaults should create schedules");

  const seedStateAfter = await seedDefaultsRoute.GET(
    new Request("http://localhost/api/scheduling/schedules/seed-defaults", {
      method: "GET",
      headers: seedAdminHeaders
    })
  );
  const seedStateAfterBody = await readJson<{ showSeedDefaultsAction: boolean }>(seedStateAfter);
  assert.equal(seedStateAfterBody.showSeedDefaultsAction, false, "button should hide after schedules exist");
}

run()
  .then(() => {
    console.log("e2e-wi0997-default-work-schedule-seed.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
