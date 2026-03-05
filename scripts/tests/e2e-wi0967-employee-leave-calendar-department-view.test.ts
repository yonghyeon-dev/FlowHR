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
  const rejectRoute = await import("../../src/app/api/leave/requests/[requestId]/reject/route.ts");
  const employeeCalendarRoute = await import("../../src/app/api/leave/calendar/employee/route.ts");

  resetMemoryDataAccess();

  const pageActionHelpers = readUtf8("src", "app", "employee", "page-action-helpers.ts");
  const leaveCalendarPanel = readUtf8("src", "components", "employee-dashboard", "EmployeeLeaveCalendarPanel.tsx");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const localeHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  const leaveApiSpec = readUtf8("specs", "leave", "api.yaml");
  const leaveContract = readUtf8("specs", "leave", "contract.yaml");
  const leaveTestCases = readUtf8("specs", "leave", "test-cases.md");
  const workItem = readUtf8("work-items", "WI-0967-leave-calendar-employee.md");

  assert.match(pageActionHelpers, /\/api\/leave\/calendar\/employee/);
  assert.match(leaveCalendarPanel, /teamScopeHint/);
  assert.match(leaveCalendarPanel, /leave-day-event/);
  assert.match(leaveCalendarPanel, /leave-calendar-status-badge/);
  assert.match(globalsCss, /\.leave-day-event\.state-pending/);
  assert.match(globalsCss, /\.leave-day-event\.state-approved/);
  assert.match(globalsCss, /\.leave-day-event\.state-rejected/);
  assert.match(localeHelpers, /leaveDepartmentCalendar/);
  assert.match(localeHelpers, /teamScopeHint/);
  assert.match(leaveApiSpec, /\/leave\/calendar\/employee:/);
  assert.match(leaveContract, /path: \/leave\/calendar\/employee/);
  assert.match(leaveTestCases, /\/leave\/calendar\/employee/);
  assert.match(workItem, /WI-0967/i);
  assert.match(workItem, /같은 부서/);
  assert.match(workItem, /대기:\s*노랑/);
  assert.match(workItem, /승인:\s*초록/);
  assert.match(workItem, /반려:\s*빨강/);

  const organization = await memoryDataAccess.organizations.create({ name: "Org WI0967" });
  const departmentA = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "DEV",
    name: "개발팀"
  });
  const departmentB = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "FIN",
    name: "재무팀"
  });

  await memoryDataAccess.employees.create({
    id: "EMP-WI0967-ME",
    organizationId: organization.id,
    departmentId: departmentA.id,
    name: "나직원"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0967-COL",
    organizationId: organization.id,
    departmentId: departmentA.id,
    name: "동료직원"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0967-OTHER",
    organizationId: organization.id,
    departmentId: departmentB.id,
    name: "타부서직원"
  });

  const createMine = await leaveRequestRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: "EMP-WI0967-ME",
        leaveType: "ANNUAL",
        startDate: "2026-04-07T00:00:00+09:00",
        endDate: "2026-04-07T23:59:59+09:00",
        unit: "FULL_DAY"
      },
      actorHeaders("admin", "ADM-WI0967", organization.id)
    )
  );
  assert.equal(createMine.status, 201);

  const createApproved = await leaveRequestRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: "EMP-WI0967-COL",
        leaveType: "ANNUAL",
        startDate: "2026-04-08T00:00:00+09:00",
        endDate: "2026-04-08T23:59:59+09:00",
        unit: "FULL_DAY"
      },
      actorHeaders("admin", "ADM-WI0967", organization.id)
    )
  );
  assert.equal(createApproved.status, 201);
  const createApprovedBody = await readJson<{ request: { id: string } }>(createApproved);

  const approve = await approveRoute.POST(
    jsonRequest("POST", `/api/leave/requests/${createApprovedBody.request.id}/approve`, {}, actorHeaders("admin", "ADM-WI0967", organization.id)),
    { params: Promise.resolve({ requestId: createApprovedBody.request.id }) }
  );
  assert.equal(approve.status, 200);

  const createRejected = await leaveRequestRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: "EMP-WI0967-COL",
        leaveType: "SICK",
        startDate: "2026-04-09T00:00:00+09:00",
        endDate: "2026-04-09T23:59:59+09:00",
        unit: "FULL_DAY"
      },
      actorHeaders("admin", "ADM-WI0967", organization.id)
    )
  );
  assert.equal(createRejected.status, 201);
  const createRejectedBody = await readJson<{ request: { id: string } }>(createRejected);

  const reject = await rejectRoute.POST(
    jsonRequest(
      "POST",
      `/api/leave/requests/${createRejectedBody.request.id}/reject`,
      { reason: "사유 미충분" },
      actorHeaders("admin", "ADM-WI0967", organization.id)
    ),
    { params: Promise.resolve({ requestId: createRejectedBody.request.id }) }
  );
  assert.equal(reject.status, 200);

  const createOtherDepartment = await leaveRequestRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: "EMP-WI0967-OTHER",
        leaveType: "ANNUAL",
        startDate: "2026-04-10T00:00:00+09:00",
        endDate: "2026-04-10T23:59:59+09:00",
        unit: "FULL_DAY"
      },
      actorHeaders("admin", "ADM-WI0967", organization.id)
    )
  );
  assert.equal(createOtherDepartment.status, 201);
  const createOtherDepartmentBody = await readJson<{ request: { id: string } }>(createOtherDepartment);

  const approveOtherDepartment = await approveRoute.POST(
    jsonRequest("POST", `/api/leave/requests/${createOtherDepartmentBody.request.id}/approve`, {}, actorHeaders("admin", "ADM-WI0967", organization.id)),
    { params: Promise.resolve({ requestId: createOtherDepartmentBody.request.id }) }
  );
  assert.equal(approveOtherDepartment.status, 200);

  const employeeCalendarResponse = await employeeCalendarRoute.GET(
    getRequest(
      `/api/leave/calendar/employee?from=${encodeURIComponent("2026-04-01T00:00:00+09:00")}&to=${encodeURIComponent("2026-05-01T00:00:00+09:00")}`,
      actorHeaders("employee", "EMP-WI0967-ME", organization.id)
    )
  );
  assert.equal(employeeCalendarResponse.status, 200);
  const employeeCalendarBody = await readJson<{
    summary: {
      entryCount: number;
      approvedEntryCount: number;
      pendingEntryCount: number;
      rejectedEntryCount: number;
      coworkerCount: number;
    };
    entries: Array<{ employeeId: string; isMine: boolean; state: "PENDING" | "APPROVED" | "REJECTED" }>;
    days: Array<{ date: string; approvedCount: number; pendingCount: number; rejectedCount: number }>;
  }>(employeeCalendarResponse);

  assert.equal(employeeCalendarBody.summary.entryCount, 3);
  assert.equal(employeeCalendarBody.summary.approvedEntryCount, 1);
  assert.equal(employeeCalendarBody.summary.pendingEntryCount, 1);
  assert.equal(employeeCalendarBody.summary.rejectedEntryCount, 1);
  assert.equal(employeeCalendarBody.summary.coworkerCount, 1);
  assert.equal(
    employeeCalendarBody.entries.some((entry) => entry.employeeId === "EMP-WI0967-OTHER"),
    false,
    "other department leave entries should not be exposed"
  );
  assert.equal(
    employeeCalendarBody.entries.some((entry) => entry.isMine),
    true,
    "my leave entry should be included"
  );
  assert.deepEqual(
    new Set(employeeCalendarBody.entries.map((entry) => entry.state)),
    new Set(["PENDING", "APPROVED", "REJECTED"])
  );
  const approvedDay = employeeCalendarBody.days.find((day) => day.date === "2026-04-08");
  assert.ok(approvedDay);
  assert.equal(approvedDay?.approvedCount, 1);
  const pendingDay = employeeCalendarBody.days.find((day) => day.date === "2026-04-07");
  assert.ok(pendingDay);
  assert.equal(pendingDay?.pendingCount, 1);
  const rejectedDay = employeeCalendarBody.days.find((day) => day.date === "2026-04-09");
  assert.ok(rejectedDay);
  assert.equal(rejectedDay?.rejectedCount, 1);

  const forbiddenManagerResponse = await employeeCalendarRoute.GET(
    getRequest(
      `/api/leave/calendar/employee?from=${encodeURIComponent("2026-04-01T00:00:00+09:00")}&to=${encodeURIComponent("2026-05-01T00:00:00+09:00")}`,
      actorHeaders("manager", "MGR-WI0967", organization.id)
    )
  );
  assert.equal(forbiddenManagerResponse.status, 403);
}

run()
  .then(() => {
    console.log("e2e-wi0967-employee-leave-calendar-department-view.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
