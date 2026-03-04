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

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

function parseCsvLine(line: string): string[] {
  const columns: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      const isEscapedQuote = inQuotes && line[index + 1] === "\"";
      if (isEscapedQuote) {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      columns.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  columns.push(current);
  return columns;
}

function parseCsvTable(csvText: string): string[][] {
  const withoutBom = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;
  return withoutBom
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

async function readCsv(response: Response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.ok(bytes.length >= 3, "csv should include UTF-8 BOM bytes");
  assert.deepEqual(Array.from(bytes.slice(0, 3)), [0xef, 0xbb, 0xbf], "csv should start with UTF-8 BOM");
  return new TextDecoder("utf-8", { ignoreBOM: false }).decode(bytes);
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceExportRoute = await import(
    "../../src/app/api/admin/reports/attendance/export/route.ts"
  );
  const leaveExportRoute = await import("../../src/app/api/admin/reports/leave/export/route.ts");
  const payrollExportRoute = await import("../../src/app/api/admin/reports/payroll/export/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0928 Org" });
  const departmentA = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0928-A",
    name: "Ops"
  });
  const departmentB = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0928-B",
    name: "Dev"
  });

  const employeeA = await memoryDataAccess.employees.create({
    id: "EMP-WI0928-1001",
    organizationId: organization.id,
    departmentId: departmentA.id,
    name: "Kim WI0928",
    email: "kim.wi0928@example.com"
  });
  const employeeB = await memoryDataAccess.employees.create({
    id: "EMP-WI0928-1002",
    organizationId: organization.id,
    departmentId: departmentB.id,
    name: "Lee WI0928",
    email: "lee.wi0928@example.com"
  });

  await memoryDataAccess.attendance.create({
    employeeId: employeeA.id,
    checkInAt: new Date("2026-03-01T00:00:00.000Z"),
    checkOutAt: new Date("2026-03-01T09:30:00.000Z"),
    breakMinutes: 30,
    isHoliday: false,
    anomalyType: "LATE"
  });
  await memoryDataAccess.attendance.create({
    employeeId: employeeB.id,
    checkInAt: new Date("2026-03-02T00:00:00.000Z"),
    checkOutAt: new Date("2026-03-02T08:00:00.000Z"),
    breakMinutes: 30,
    isHoliday: false
  });

  await memoryDataAccess.leave.create({
    employeeId: employeeA.id,
    leaveType: "ANNUAL",
    startDate: new Date("2026-03-03T00:00:00.000Z"),
    endDate: new Date("2026-03-03T00:00:00.000Z"),
    unit: "FULL_DAY",
    days: 1,
    reason: "Family event"
  });
  await memoryDataAccess.leave.create({
    employeeId: employeeB.id,
    leaveType: "SICK",
    startDate: new Date("2026-03-04T00:00:00.000Z"),
    endDate: new Date("2026-03-04T00:00:00.000Z"),
    unit: "FULL_DAY",
    days: 1,
    reason: "Cold"
  });

  await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: employeeA.id,
    periodStart: new Date("2026-03-01T00:00:00.000Z"),
    periodEnd: new Date("2026-03-31T00:00:00.000Z"),
    grossPayKrw: 3500000,
    withholdingTaxKrw: 280000,
    socialInsuranceKrw: 240000,
    otherDeductionsKrw: 50000,
    totalDeductionsKrw: 570000,
    netPayKrw: 2930000,
    deductionBreakdown: {
      mode: "statutory_kr_baseline",
      additional: {
        overtimeKrw: 180000,
        components: {
          incomeTaxKrw: 250000,
          localIncomeTaxKrw: 25000,
          nationalPensionKrw: 150000,
          healthInsuranceKrw: 70000,
          employmentInsuranceKrw: 20000,
          industrialAccidentKrw: 8000
        }
      }
    },
    sourceRecordCount: 2
  });

  const adminHeaders = actorHeaders("admin", "ADM-WI0928-1", organization.id);
  const employeeHeaders = actorHeaders("employee", employeeA.id, organization.id);

  const attendanceResponse = await attendanceExportRoute.GET(
    new Request(
      `http://localhost/api/admin/reports/attendance/export?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z&departmentId=${departmentA.id}`,
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(attendanceResponse.status, 200, "attendance export should succeed");
  assert.match(attendanceResponse.headers.get("content-type") ?? "", /^text\/csv/i);
  const attendanceTable = parseCsvTable(await readCsv(attendanceResponse));
  assert.deepEqual(attendanceTable[0], [
    "employeeName",
    "date",
    "clockIn",
    "clockOut",
    "workHours",
    "overtime",
    "anomalyType"
  ]);
  assert.equal(attendanceTable.length, 2, "department filter should keep one attendance row");
  assert.equal(attendanceTable[1]?.[0], "Kim WI0928");

  const leaveResponse = await leaveExportRoute.GET(
    new Request(
      `http://localhost/api/admin/reports/leave/export?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z&departmentId=${departmentA.id}`,
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(leaveResponse.status, 200, "leave export should succeed");
  assert.match(leaveResponse.headers.get("content-type") ?? "", /^text\/csv/i);
  const leaveTable = parseCsvTable(await readCsv(leaveResponse));
  assert.deepEqual(leaveTable[0], [
    "employeeName",
    "leaveType",
    "startDate",
    "endDate",
    "days",
    "status",
    "reason"
  ]);
  assert.equal(leaveTable.length, 2, "department filter should keep one leave row");
  assert.equal(leaveTable[1]?.[0], "Kim WI0928");

  const payrollResponse = await payrollExportRoute.GET(
    new Request(
      "http://localhost/api/admin/reports/payroll/export?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z",
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(payrollResponse.status, 200, "payroll export should succeed");
  assert.match(payrollResponse.headers.get("content-type") ?? "", /^text\/csv/i);
  const payrollTable = parseCsvTable(await readCsv(payrollResponse));
  assert.deepEqual(payrollTable[0], [
    "employeeName",
    "basePay",
    "overtime",
    "totalDeductions",
    "nps",
    "nhi",
    "ei",
    "wci",
    "incomeTax",
    "localTax",
    "netPay"
  ]);
  assert.equal(payrollTable.length, 2, "payroll export should include one data row");
  assert.equal(payrollTable[1]?.[0], "Kim WI0928");
  assert.equal(payrollTable[1]?.[4], "150000");
  assert.equal(payrollTable[1]?.[8], "250000");
  assert.equal(payrollTable[1]?.[9], "25000");

  const forbiddenAttendance = await attendanceExportRoute.GET(
    new Request(
      "http://localhost/api/admin/reports/attendance/export?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z",
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(forbiddenAttendance.status, 403, "employee should be forbidden for attendance export");

  const forbiddenLeave = await leaveExportRoute.GET(
    new Request(
      "http://localhost/api/admin/reports/leave/export?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z",
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(forbiddenLeave.status, 403, "employee should be forbidden for leave export");

  const forbiddenPayroll = await payrollExportRoute.GET(
    new Request(
      "http://localhost/api/admin/reports/payroll/export?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z",
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(forbiddenPayroll.status, 403, "employee should be forbidden for payroll export");
}

run()
  .then(() => {
    console.log("e2e-wi0928-bulk-export.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

