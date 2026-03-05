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

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const overtimeReportRoute = await import("../../src/app/api/admin/reports/overtime/route.ts");
  const overtimeExportRoute = await import("../../src/app/api/admin/reports/overtime/export/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0942 Org" });
  const departmentOps = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0942-OPS",
    name: "Operations"
  });
  const departmentProduct = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0942-PROD",
    name: "Product"
  });

  const employeeA = await memoryDataAccess.employees.create({
    id: "EMP-WI0942-1001",
    organizationId: organization.id,
    departmentId: departmentOps.id,
    name: "Kim WI0942"
  });
  const employeeB = await memoryDataAccess.employees.create({
    id: "EMP-WI0942-1002",
    organizationId: organization.id,
    departmentId: departmentProduct.id,
    name: "Lee WI0942"
  });

  await memoryDataAccess.attendance.create({
    employeeId: employeeA.id,
    checkInAt: new Date("2026-01-05T00:00:00.000Z"),
    checkOutAt: new Date("2026-01-05T10:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false
  });
  await memoryDataAccess.attendance.create({
    employeeId: employeeA.id,
    checkInAt: new Date("2026-02-02T00:00:00.000Z"),
    checkOutAt: new Date("2026-02-02T09:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false
  });
  await memoryDataAccess.attendance.create({
    employeeId: employeeA.id,
    checkInAt: new Date("2026-03-02T00:00:00.000Z"),
    checkOutAt: new Date("2026-03-02T10:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false
  });
  await memoryDataAccess.attendance.create({
    employeeId: employeeA.id,
    checkInAt: new Date("2026-03-03T00:00:00.000Z"),
    checkOutAt: new Date("2026-03-03T11:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false
  });
  await memoryDataAccess.attendance.create({
    employeeId: employeeA.id,
    checkInAt: new Date("2026-03-09T00:00:00.000Z"),
    checkOutAt: new Date("2026-03-09T09:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false
  });
  const rejectedRecord = await memoryDataAccess.attendance.create({
    employeeId: employeeA.id,
    checkInAt: new Date("2026-03-10T00:00:00.000Z"),
    checkOutAt: new Date("2026-03-10T13:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false
  });
  await memoryDataAccess.attendance.update(rejectedRecord.id, {
    state: "REJECTED"
  });

  for (let day = 2; day <= 6; day += 1) {
    await memoryDataAccess.attendance.create({
      employeeId: employeeB.id,
      checkInAt: new Date(`2026-03-${String(day).padStart(2, "0")}T00:00:00.000Z`),
      checkOutAt: new Date(`2026-03-${String(day).padStart(2, "0")}T14:00:00.000Z`),
      breakMinutes: 60,
      isHoliday: false
    });
  }
  await memoryDataAccess.attendance.create({
    employeeId: employeeB.id,
    checkInAt: new Date("2026-03-16T00:00:00.000Z"),
    checkOutAt: new Date("2026-03-16T09:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false
  });

  const adminHeaders = actorHeaders("admin", "ADM-WI0942-1", organization.id);
  const employeeHeaders = actorHeaders("employee", employeeA.id, organization.id);

  const monthlyResponse = await overtimeReportRoute.GET(
    new Request("http://localhost/api/admin/reports/overtime?period=monthly&year=2026&month=3", {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(monthlyResponse.status, 200, "monthly overtime report should succeed");
  const monthlyBody = await readJson<{
    items: Array<{
      employeeId: string;
      regularHours: number;
      overtimeHours: number;
      totalHours: number;
      weeklyAverage: number;
      exceededWeeks: number;
      departmentName: string;
    }>;
    total: number;
    period: { type: string; year: number; month?: number };
  }>(monthlyResponse);

  assert.equal(monthlyBody.total, 2, "monthly report should include two employees");
  assert.deepEqual(monthlyBody.period, { type: "monthly", year: 2026, month: 3 });
  const monthlyByEmployeeId = new Map(monthlyBody.items.map((item) => [item.employeeId, item] as const));

  const employeeAMonthly = monthlyByEmployeeId.get(employeeA.id);
  assert.ok(employeeAMonthly, "monthly report should include employee A");
  assert.equal(employeeAMonthly?.regularHours, 24);
  assert.equal(employeeAMonthly?.overtimeHours, 3);
  assert.equal(employeeAMonthly?.totalHours, 27);
  assert.equal(employeeAMonthly?.weeklyAverage, 13.5);
  assert.equal(employeeAMonthly?.exceededWeeks, 0);
  assert.equal(employeeAMonthly?.departmentName, "Operations");

  const employeeBMonthly = monthlyByEmployeeId.get(employeeB.id);
  assert.ok(employeeBMonthly, "monthly report should include employee B");
  assert.equal(employeeBMonthly?.regularHours, 48);
  assert.equal(employeeBMonthly?.overtimeHours, 25);
  assert.equal(employeeBMonthly?.totalHours, 73);
  assert.equal(employeeBMonthly?.weeklyAverage, 36.5);
  assert.equal(employeeBMonthly?.exceededWeeks, 1);
  assert.equal(employeeBMonthly?.departmentName, "Product");

  const quarterlyResponse = await overtimeReportRoute.GET(
    new Request("http://localhost/api/admin/reports/overtime?period=quarterly&year=2026&quarter=1", {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(quarterlyResponse.status, 200, "quarterly overtime report should succeed");
  const quarterlyBody = await readJson<{
    items: Array<{
      employeeId: string;
      regularHours: number;
      overtimeHours: number;
      totalHours: number;
      weeklyAverage: number;
      exceededWeeks: number;
    }>;
    total: number;
    period: { type: string; year: number; quarter?: number };
  }>(quarterlyResponse);

  assert.equal(quarterlyBody.total, 2, "quarterly report should include two employees");
  assert.deepEqual(quarterlyBody.period, { type: "quarterly", year: 2026, quarter: 1 });
  const quarterlyByEmployeeId = new Map(
    quarterlyBody.items.map((item) => [item.employeeId, item] as const)
  );

  const employeeAQuarterly = quarterlyByEmployeeId.get(employeeA.id);
  assert.ok(employeeAQuarterly, "quarterly report should include employee A");
  assert.equal(employeeAQuarterly?.regularHours, 40);
  assert.equal(employeeAQuarterly?.overtimeHours, 4);
  assert.equal(employeeAQuarterly?.totalHours, 44);
  assert.equal(employeeAQuarterly?.weeklyAverage, 11);
  assert.equal(employeeAQuarterly?.exceededWeeks, 0);

  const employeeBQuarterly = quarterlyByEmployeeId.get(employeeB.id);
  assert.ok(employeeBQuarterly, "quarterly report should include employee B");
  assert.equal(employeeBQuarterly?.regularHours, 48);
  assert.equal(employeeBQuarterly?.overtimeHours, 25);
  assert.equal(employeeBQuarterly?.totalHours, 73);
  assert.equal(employeeBQuarterly?.weeklyAverage, 36.5);
  assert.equal(employeeBQuarterly?.exceededWeeks, 1);

  const exportResponse = await overtimeExportRoute.GET(
    new Request(
      "http://localhost/api/admin/reports/overtime/export?period=monthly&year=2026&month=3",
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(exportResponse.status, 200, "overtime csv export should succeed");
  assert.match(exportResponse.headers.get("content-type") ?? "", /^text\/csv/i);

  const exportTable = parseCsvTable(await readCsv(exportResponse));
  assert.deepEqual(exportTable[0], [
    "employeeId",
    "employeeName",
    "departmentName",
    "regularHours",
    "overtimeHours",
    "totalHours",
    "weeklyAverage",
    "exceededWeeks"
  ]);
  assert.equal(exportTable.length, 3, "csv should include header plus two employee rows");
  assert.equal(exportTable[1]?.[0], employeeB.id, "first row should be highest overtime employee");
  assert.equal(exportTable[1]?.[4], "25.00");
  assert.equal(exportTable[2]?.[0], employeeA.id);
  assert.equal(exportTable[2]?.[4], "3.00");

  const forbiddenReportResponse = await overtimeReportRoute.GET(
    new Request("http://localhost/api/admin/reports/overtime?period=monthly&year=2026&month=3", {
      method: "GET",
      headers: employeeHeaders
    })
  );
  assert.equal(forbiddenReportResponse.status, 403, "employee role must be forbidden for overtime report");

  const forbiddenExportResponse = await overtimeExportRoute.GET(
    new Request(
      "http://localhost/api/admin/reports/overtime/export?period=monthly&year=2026&month=3",
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(forbiddenExportResponse.status, 403, "employee role must be forbidden for overtime export");
}

run()
  .then(() => {
    console.log("e2e-wi0942-overtime-report.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

