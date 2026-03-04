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
  const anomalyListRoute = await import("../../src/app/api/admin/attendance/anomalies/route.ts");
  const anomalyExportRoute = await import("../../src/app/api/admin/attendance/anomalies/export/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0933 Org" });
  const departmentA = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0933-A",
    name: "Ops"
  });
  const departmentB = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0933-B",
    name: "Product"
  });

  const employeeA = await memoryDataAccess.employees.create({
    id: "EMP-WI0933-1001",
    organizationId: organization.id,
    departmentId: departmentA.id,
    name: "Kim WI0933"
  });
  const employeeB = await memoryDataAccess.employees.create({
    id: "EMP-WI0933-1002",
    organizationId: organization.id,
    departmentId: departmentA.id,
    name: "Lee WI0933"
  });
  const employeeC = await memoryDataAccess.employees.create({
    id: "EMP-WI0933-1003",
    organizationId: organization.id,
    departmentId: departmentB.id,
    name: "Park WI0933"
  });

  await memoryDataAccess.attendance.create({
    employeeId: employeeA.id,
    checkInAt: new Date("2026-03-01T09:30:00.000Z"),
    checkOutAt: new Date("2026-03-01T18:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "LATE_CLOCK_IN"
  });
  await memoryDataAccess.attendance.create({
    employeeId: employeeA.id,
    checkInAt: new Date("2026-03-02T09:00:00.000Z"),
    checkOutAt: new Date("2026-03-02T16:30:00.000Z"),
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "EARLY_CLOCK_OUT"
  });
  await memoryDataAccess.attendance.create({
    employeeId: employeeB.id,
    checkInAt: new Date("2026-03-03T09:00:00.000Z"),
    checkOutAt: null,
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "MISSING_CLOCK_OUT"
  });
  await memoryDataAccess.attendance.create({
    employeeId: employeeB.id,
    checkInAt: new Date("2026-03-04T09:00:00.000Z"),
    checkOutAt: new Date("2026-03-04T18:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "AUTO_CLOSED"
  });
  await memoryDataAccess.attendance.create({
    employeeId: employeeC.id,
    checkInAt: new Date("2026-03-05T08:00:00.000Z"),
    checkOutAt: new Date("2026-03-05T20:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false,
    anomalyType: "OVERTIME"
  });
  await memoryDataAccess.attendance.create({
    employeeId: employeeC.id,
    checkInAt: new Date("2026-03-06T09:00:00.000Z"),
    checkOutAt: new Date("2026-03-06T18:00:00.000Z"),
    breakMinutes: 60,
    isHoliday: false
  });

  const adminHeaders = actorHeaders("admin", "ADM-WI0933-1", organization.id);
  const employeeHeaders = actorHeaders("employee", employeeA.id, organization.id);

  const listResponse = await anomalyListRoute.GET(
    new Request(
      "http://localhost/api/admin/attendance/anomalies?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z",
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(listResponse.status, 200, "admin should list attendance anomalies");
  const listBody = await readJson<{
    items: Array<{ employeeId: string; anomalyType?: string }>;
    total: number;
    summary: { totalAnomalies: number; byType: Record<string, number> };
  }>(listResponse);
  assert.equal(listBody.total, 5, "five anomaly records should be listed");
  assert.equal(listBody.items.length, 5, "default limit should include all seeded anomaly records");
  assert.equal(listBody.summary.totalAnomalies, 5, "summary total should match anomalies");
  assert.equal(listBody.summary.byType.LATE_CLOCK_IN, 1);
  assert.equal(listBody.summary.byType.EARLY_CLOCK_OUT, 1);
  assert.equal(listBody.summary.byType.MISSING_CLOCK_OUT, 1);
  assert.equal(listBody.summary.byType.AUTO_CLOSED, 1);
  assert.equal(listBody.summary.byType.OVERTIME, 1);

  const typeFilteredResponse = await anomalyListRoute.GET(
    new Request(
      "http://localhost/api/admin/attendance/anomalies?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z&anomalyType=MISSING_CLOCK_OUT",
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(typeFilteredResponse.status, 200, "anomaly type filter should succeed");
  const typeFilteredBody = await readJson<{
    items: Array<{ employeeId: string; anomalyType?: string }>;
    total: number;
    summary: { totalAnomalies: number; byType: Record<string, number> };
  }>(typeFilteredResponse);
  assert.equal(typeFilteredBody.total, 1, "type filter should return one item");
  assert.equal(typeFilteredBody.items[0]?.employeeId, employeeB.id);
  assert.equal(typeFilteredBody.items[0]?.anomalyType, "MISSING_CLOCK_OUT");
  assert.equal(typeFilteredBody.summary.totalAnomalies, 1);
  assert.equal(typeFilteredBody.summary.byType.MISSING_CLOCK_OUT, 1);

  const departmentFilteredResponse = await anomalyListRoute.GET(
    new Request(
      `http://localhost/api/admin/attendance/anomalies?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z&departmentId=${departmentA.id}&employeeId=${employeeA.id}`,
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(departmentFilteredResponse.status, 200, "department and employee filters should succeed");
  const departmentFilteredBody = await readJson<{
    items: Array<{ employeeId: string; anomalyType?: string }>;
    total: number;
    summary: { totalAnomalies: number; byType: Record<string, number> };
  }>(departmentFilteredResponse);
  assert.equal(departmentFilteredBody.total, 2, "combined filters should return two employeeA anomalies");
  assert.equal(departmentFilteredBody.items.length, 2);
  assert.ok(
    departmentFilteredBody.items.every((item) => item.employeeId === employeeA.id),
    "all filtered items should belong to employeeA"
  );

  const pagedListResponse = await anomalyListRoute.GET(
    new Request(
      "http://localhost/api/admin/attendance/anomalies?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z&limit=2&offset=1",
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(pagedListResponse.status, 200, "pagination query should succeed");
  const pagedListBody = await readJson<{
    items: Array<{ employeeId: string; anomalyType?: string }>;
    total: number;
    summary: { totalAnomalies: number; byType: Record<string, number> };
  }>(pagedListResponse);
  assert.equal(pagedListBody.total, 5, "pagination should not change total");
  assert.equal(pagedListBody.items.length, 2, "limit should cap returned rows");

  const exportResponse = await anomalyExportRoute.GET(
    new Request(
      `http://localhost/api/admin/attendance/anomalies/export?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z&departmentId=${departmentA.id}`,
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(exportResponse.status, 200, "admin should export anomaly csv");
  assert.match(exportResponse.headers.get("content-type") ?? "", /^text\/csv/i);
  const exportTable = parseCsvTable(await readCsv(exportResponse));
  assert.deepEqual(exportTable[0], [
    "employeeName",
    "date",
    "clockIn",
    "clockOut",
    "anomalyType",
    "workHours"
  ]);
  assert.equal(exportTable.length, 5, "department filter should keep four anomaly rows plus header");
  assert.equal(exportTable[1]?.[0], "Kim WI0933");
  assert.equal(exportTable[1]?.[4], "LATE_CLOCK_IN");
  assert.equal(exportTable[4]?.[0], "Lee WI0933");
  assert.equal(exportTable[4]?.[4], "AUTO_CLOSED");

  const forbiddenList = await anomalyListRoute.GET(
    new Request(
      "http://localhost/api/admin/attendance/anomalies?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z",
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(forbiddenList.status, 403, "employee should be forbidden from anomaly list");

  const forbiddenExport = await anomalyExportRoute.GET(
    new Request(
      "http://localhost/api/admin/attendance/anomalies/export?from=2026-03-01T00:00:00.000Z&to=2026-03-31T23:59:59.999Z",
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(forbiddenExport.status, 403, "employee should be forbidden from anomaly export");
}

run()
  .then(() => {
    console.log("e2e-wi0933-anomaly-report.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
