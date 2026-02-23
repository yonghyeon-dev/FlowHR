import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

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

function jsonRequest(method: string, urlPath: string, payload: unknown, headers: Record<string, string>) {
  return new Request(`http://localhost${urlPath}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

function getRequest(urlPath: string, headers: Record<string, string>) {
  return new Request(`http://localhost${urlPath}`, {
    method: "GET",
    headers
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );

  const leaveRequestRoute = await import("../../src/app/api/leave/requests/route.ts");
  const approveRoute = await import("../../src/app/api/leave/requests/[requestId]/approve/route.ts");
  const leaveCalendarRoute = await import("../../src/app/api/leave/calendar/route.ts");

  resetMemoryDataAccess();

  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const leaveCalendarPageSource = readUtf8("src", "app", "admin", "leave-calendar", "page.tsx");
  const leaveCalendarConsoleSource = readUtf8("src", "components", "leave-calendar", "LeaveCalendarConsole.tsx");
  const leaveCalendarCopySource = readUtf8("src", "components", "leave-calendar", "copy.ts");
  const leaveApiSpec = readUtf8("specs", "leave", "api.yaml");
  const leaveContract = readUtf8("specs", "leave", "contract.yaml");

  assert.match(adminLayoutSource, /\/admin\/leave-calendar/, "admin nav should include leave calendar route");
  assert.match(
    leaveCalendarPageSource,
    /LeaveCalendarConsole/,
    "admin leave calendar page should render dedicated console component"
  );
  assert.match(
    leaveCalendarConsoleSource,
    /leaveCalendarCopyByLocale/,
    "leave calendar console should wire locale copy map"
  );
  assert.match(
    leaveCalendarConsoleSource,
    /copy\.title/,
    "leave calendar console should render title from locale copy"
  );
  assert.match(
    leaveCalendarCopySource,
    /title:\s*"Leave Calendar"/,
    "leave calendar copy should include english heading text"
  );
  assert.match(leaveApiSpec, /\/leave\/calendar:/, "leave api spec should document leave calendar endpoint");
  assert.match(
    leaveContract,
    /path: \/leave\/calendar/,
    "leave contract should include leave calendar endpoint"
  );

  const organization = await memoryDataAccess.organizations.create({ name: "Org Calendar" });
  const engDepartment = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "ENG",
    name: "Engineering"
  });
  const hrDepartment = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "HR",
    name: "HR"
  });

  await memoryDataAccess.employees.create({
    id: "EMP-CAL-1001",
    organizationId: organization.id,
    departmentId: engDepartment.id,
    name: "Calendar A"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-CAL-1002",
    organizationId: organization.id,
    departmentId: engDepartment.id,
    name: "Calendar B"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-CAL-2001",
    organizationId: organization.id,
    departmentId: hrDepartment.id,
    name: "Calendar HR"
  });

  const createPayload = {
    leaveType: "ANNUAL" as const,
    startDate: "2026-03-10T00:00:00+09:00",
    endDate: "2026-03-10T23:00:00+09:00",
    unit: "FULL_DAY" as const
  };

  const createOne = await leaveRequestRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        ...createPayload,
        employeeId: "EMP-CAL-1001"
      },
      actorHeaders("admin", "ADM-1001", organization.id)
    )
  );
  assert.equal(createOne.status, 201, "first leave request should be created");
  const createOneBody = await readJson<{ request: { id: string } }>(createOne);

  const createTwo = await leaveRequestRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        ...createPayload,
        employeeId: "EMP-CAL-1002"
      },
      actorHeaders("admin", "ADM-1001", organization.id)
    )
  );
  assert.equal(createTwo.status, 201, "second leave request should be created");
  const createTwoBody = await readJson<{ request: { id: string } }>(createTwo);

  const createPending = await leaveRequestRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        ...createPayload,
        employeeId: "EMP-CAL-2001"
      },
      actorHeaders("admin", "ADM-1001", organization.id)
    )
  );
  assert.equal(createPending.status, 201, "pending leave request should be created");

  const approveOne = await approveRoute.POST(
    jsonRequest("POST", `/api/leave/requests/${createOneBody.request.id}/approve`, {}, actorHeaders("admin", "ADM-1001", organization.id)),
    { params: Promise.resolve({ requestId: createOneBody.request.id }) }
  );
  assert.equal(approveOne.status, 200, "first leave request should be approved");

  const approveTwo = await approveRoute.POST(
    jsonRequest("POST", `/api/leave/requests/${createTwoBody.request.id}/approve`, {}, actorHeaders("admin", "ADM-1001", organization.id)),
    { params: Promise.resolve({ requestId: createTwoBody.request.id }) }
  );
  assert.equal(approveTwo.status, 200, "second leave request should be approved");

  const orgCalendarResponse = await leaveCalendarRoute.GET(
    getRequest(
      `/api/leave/calendar?from=${encodeURIComponent("2026-03-01T00:00:00+09:00")}&to=${encodeURIComponent("2026-03-15T00:00:00+09:00")}&organizationId=${encodeURIComponent(organization.id)}&includePending=false&overlapWarningThreshold=2`,
      actorHeaders("payroll_operator", "PAY-1001", organization.id)
    )
  );
  assert.equal(orgCalendarResponse.status, 200, "organization leave calendar query should succeed");
  const orgCalendarBody = await readJson<{
    summary: { approvedEntryCount: number; pendingEntryCount: number; warningDayCount: number };
    days: Array<{ date: string; approvedCount: number; pendingCount: number; warning: boolean }>;
  }>(orgCalendarResponse);
  assert.equal(orgCalendarBody.summary.approvedEntryCount, 2, "approved entries should be counted");
  assert.equal(orgCalendarBody.summary.pendingEntryCount, 0, "pending entries should be excluded by default");
  assert.equal(orgCalendarBody.summary.warningDayCount, 1, "one overlap warning day is expected");
  const warningDay = orgCalendarBody.days.find((day) => day.date === "2026-03-10");
  assert.ok(warningDay, "warning day should be present");
  assert.equal(warningDay?.approvedCount, 2, "warning day approved count should be 2");
  assert.equal(warningDay?.pendingCount, 0, "warning day pending count should be 0");
  assert.equal(warningDay?.warning, true, "warning day should be flagged");

  const departmentCalendarResponse = await leaveCalendarRoute.GET(
    getRequest(
      `/api/leave/calendar?from=${encodeURIComponent("2026-03-01T00:00:00+09:00")}&to=${encodeURIComponent("2026-03-15T00:00:00+09:00")}&organizationId=${encodeURIComponent(organization.id)}&departmentId=${encodeURIComponent(hrDepartment.id)}&includePending=true&overlapWarningThreshold=1`,
      actorHeaders("admin", "ADM-1001", organization.id)
    )
  );
  assert.equal(departmentCalendarResponse.status, 200, "department leave calendar query should succeed");
  const departmentCalendarBody = await readJson<{
    summary: { approvedEntryCount: number; pendingEntryCount: number; warningDayCount: number };
    entries: Array<{ employeeId: string; state: string }>;
  }>(departmentCalendarResponse);
  assert.equal(departmentCalendarBody.summary.approvedEntryCount, 0, "department filter should exclude approved ENG entries");
  assert.equal(departmentCalendarBody.summary.pendingEntryCount, 1, "department filter should include pending HR entry");
  assert.equal(departmentCalendarBody.summary.warningDayCount, 1, "pending-inclusive threshold should produce warning");
  assert.equal(departmentCalendarBody.entries.length, 1, "department query should return one entry");
  assert.equal(departmentCalendarBody.entries[0]?.employeeId, "EMP-CAL-2001", "department query should return HR employee");
  assert.equal(departmentCalendarBody.entries[0]?.state, "PENDING", "department query should include pending state");

  const unauthorizedResponse = await leaveCalendarRoute.GET(
    getRequest(
      `/api/leave/calendar?from=${encodeURIComponent("2026-03-01T00:00:00+09:00")}&to=${encodeURIComponent("2026-03-15T00:00:00+09:00")}&organizationId=${encodeURIComponent(organization.id)}`,
      actorHeaders("employee", "EMP-CAL-1001", organization.id)
    )
  );
  assert.equal(unauthorizedResponse.status, 403, "employee role should not read organization leave calendar");
}

run()
  .then(() => {
    console.log("e2e-wi0183-leave-calendar-integration-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
