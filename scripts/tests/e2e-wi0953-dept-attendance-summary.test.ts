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

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

type DepartmentAttendanceSummaryRow = {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  totalWorkHours: number;
  avgWorkHoursPerEmployee: number;
  lateCount: number;
  absentCount: number;
  anomalyCount: number;
  attendanceRate: number;
};

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const summaryRoute = await import(
    "../../src/app/api/admin/reports/attendance/department-summary/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0953 Org"
  });

  const departmentSales = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0953-SALES",
    name: "Sales"
  });
  const departmentEngineering = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0953-ENG",
    name: "Engineering"
  });
  const departmentSupport = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0953-SUPPORT",
    name: "Support"
  });

  const salesEmployeeA = await memoryDataAccess.employees.create({
    id: "EMP-WI0953-SALES-A",
    organizationId: organization.id,
    departmentId: departmentSales.id,
    name: "Sales A",
    status: "ACTIVE"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0953-SALES-B",
    organizationId: organization.id,
    departmentId: departmentSales.id,
    name: "Sales B",
    status: "ACTIVE"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0953-ENG-A",
    organizationId: organization.id,
    departmentId: departmentEngineering.id,
    name: "Engineering A",
    status: "ACTIVE"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0953-SUPPORT-A",
    organizationId: organization.id,
    departmentId: departmentSupport.id,
    name: "Support A",
    status: "ACTIVE"
  });

  await memoryDataAccess.employees.create({
    id: "EMP-WI0953-SALES-ON-LEAVE",
    organizationId: organization.id,
    departmentId: departmentSales.id,
    name: "Sales On Leave",
    status: "ON_LEAVE"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0953-ENG-RESIGNED",
    organizationId: organization.id,
    departmentId: departmentEngineering.id,
    name: "Engineering Resigned",
    status: "RESIGNED"
  });

  await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0953-SALES-A",
    checkInAt: new Date("2026-03-01T09:00:00.000Z"),
    checkOutAt: new Date("2026-03-01T18:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "LATE_CLOCK_IN"
  });
  await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0953-SALES-A",
    checkInAt: new Date("2026-03-02T09:00:00.000Z"),
    checkOutAt: new Date("2026-03-02T17:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false
  });
  await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0953-SALES-A",
    checkInAt: new Date("2026-03-20T09:00:00.000Z"),
    checkOutAt: null,
    breakMinutes: 0,
    isHoliday: false,
    anomalyType: "ABSENT"
  });
  await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0953-SALES-A",
    checkInAt: new Date("2026-02-25T09:00:00.000Z"),
    checkOutAt: new Date("2026-02-25T18:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "LATE_CLOCK_IN"
  });

  await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0953-SALES-B",
    checkInAt: new Date("2026-03-01T09:00:00.000Z"),
    checkOutAt: null,
    breakMinutes: 0,
    isHoliday: false,
    anomalyType: "NO_SHOW"
  });

  await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0953-ENG-A",
    checkInAt: new Date("2026-03-01T08:00:00.000Z"),
    checkOutAt: new Date("2026-03-01T17:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "EARLY_CLOCK_OUT"
  });
  await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0953-ENG-A",
    checkInAt: new Date("2026-03-03T09:00:00.000Z"),
    checkOutAt: new Date("2026-03-03T18:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "LATE_CLOCK_IN"
  });

  await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0953-SALES-ON-LEAVE",
    checkInAt: new Date("2026-03-01T09:00:00.000Z"),
    checkOutAt: new Date("2026-03-01T18:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "LATE_CLOCK_IN"
  });
  await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0953-ENG-RESIGNED",
    checkInAt: new Date("2026-03-01T09:00:00.000Z"),
    checkOutAt: null,
    breakMinutes: 0,
    isHoliday: false,
    anomalyType: "ABSENT"
  });

  const rejectedRecord = await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0953-SALES-A",
    checkInAt: new Date("2026-03-05T09:00:00.000Z"),
    checkOutAt: new Date("2026-03-05T18:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "LATE_CLOCK_IN"
  });
  await memoryDataAccess.attendance.update(rejectedRecord.id, {
    state: "REJECTED"
  });

  const adminHeaders = actorHeaders("admin", "ADM-WI0953-1", organization.id);

  const summaryResponse = await summaryRoute.GET(
    new Request(
      "http://localhost/api/admin/reports/attendance/department-summary?startDate=2026-03-01&endDate=2026-03-31",
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(summaryResponse.status, 200, "department summary should return 200 for admin");

  const summaryRows = await readJson<DepartmentAttendanceSummaryRow[]>(summaryResponse);
  assert.equal(summaryRows.length, 3, "all departments should be listed including empty department");

  const summaryByDepartmentId = new Map(
    summaryRows.map((row) => [row.departmentId, row] as const)
  );

  const salesSummary = summaryByDepartmentId.get(departmentSales.id);
  assert.ok(salesSummary, "sales department summary should exist");
  assert.equal(salesSummary?.departmentName, "Sales");
  assert.equal(salesSummary?.employeeCount, 2, "only ACTIVE employees should be counted");
  assert.equal(salesSummary?.totalWorkHours, 15);
  assert.equal(salesSummary?.avgWorkHoursPerEmployee, 7.5);
  assert.equal(salesSummary?.lateCount, 1);
  assert.equal(salesSummary?.absentCount, 2);
  assert.equal(salesSummary?.anomalyCount, 3);
  assert.equal(salesSummary?.attendanceRate, 50, "attendanceRate should be attended/active * 100");

  const engineeringSummary = summaryByDepartmentId.get(departmentEngineering.id);
  assert.ok(engineeringSummary, "engineering department summary should exist");
  assert.equal(engineeringSummary?.departmentName, "Engineering");
  assert.equal(engineeringSummary?.employeeCount, 1);
  assert.equal(engineeringSummary?.totalWorkHours, 16);
  assert.equal(engineeringSummary?.avgWorkHoursPerEmployee, 16);
  assert.equal(engineeringSummary?.lateCount, 1);
  assert.equal(engineeringSummary?.absentCount, 0);
  assert.equal(engineeringSummary?.anomalyCount, 2);
  assert.equal(engineeringSummary?.attendanceRate, 100);

  const supportSummary = summaryByDepartmentId.get(departmentSupport.id);
  assert.ok(supportSummary, "support department summary should exist");
  assert.equal(supportSummary?.departmentName, "Support");
  assert.equal(supportSummary?.employeeCount, 1);
  assert.equal(supportSummary?.totalWorkHours, 0);
  assert.equal(supportSummary?.avgWorkHoursPerEmployee, 0);
  assert.equal(supportSummary?.lateCount, 0);
  assert.equal(supportSummary?.absentCount, 0);
  assert.equal(supportSummary?.anomalyCount, 0);
  assert.equal(supportSummary?.attendanceRate, 0, "empty department activity should produce zero rate");

  const dayRangeResponse = await summaryRoute.GET(
    new Request(
      "http://localhost/api/admin/reports/attendance/department-summary?startDate=2026-03-01&endDate=2026-03-01",
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(dayRangeResponse.status, 200, "date range filtered summary should return 200");

  const dayRangeRows = await readJson<DepartmentAttendanceSummaryRow[]>(dayRangeResponse);
  const dayRangeByDepartmentId = new Map(dayRangeRows.map((row) => [row.departmentId, row] as const));

  const salesDaySummary = dayRangeByDepartmentId.get(departmentSales.id);
  assert.equal(salesDaySummary?.totalWorkHours, 8, "date range should include only selected day");
  assert.equal(salesDaySummary?.avgWorkHoursPerEmployee, 4);
  assert.equal(salesDaySummary?.lateCount, 1);
  assert.equal(salesDaySummary?.absentCount, 1);
  assert.equal(salesDaySummary?.anomalyCount, 2);
  assert.equal(salesDaySummary?.attendanceRate, 50);

  const engineeringDaySummary = dayRangeByDepartmentId.get(departmentEngineering.id);
  assert.equal(engineeringDaySummary?.totalWorkHours, 8);
  assert.equal(engineeringDaySummary?.avgWorkHoursPerEmployee, 8);
  assert.equal(engineeringDaySummary?.lateCount, 0);
  assert.equal(engineeringDaySummary?.absentCount, 0);
  assert.equal(engineeringDaySummary?.anomalyCount, 1);
  assert.equal(engineeringDaySummary?.attendanceRate, 100);

  const nonAdminResponse = await summaryRoute.GET(
    new Request(
      "http://localhost/api/admin/reports/attendance/department-summary?startDate=2026-03-01&endDate=2026-03-31",
      {
        method: "GET",
        headers: actorHeaders("employee", salesEmployeeA.id, organization.id)
      }
    )
  );
  assert.equal(nonAdminResponse.status, 403, "non-admin actor should receive 403");
}

run()
  .then(() => {
    console.log("e2e-wi0953-dept-attendance-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
