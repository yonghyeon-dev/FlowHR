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

type CsvExportRow = {
  date: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
  actorId: string;
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

function parseCsvTable(csv: string): string[][] {
  const withoutBom = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  const lines = withoutBom
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  return lines.map(parseCsvLine);
}

function toRowObject(columns: string[]): CsvExportRow {
  return {
    date: columns[0] ?? "",
    action: columns[1] ?? "",
    field: columns[2] ?? "",
    oldValue: columns[3] ?? "",
    newValue: columns[4] ?? "",
    actorId: columns[5] ?? ""
  };
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const employeeByIdRoute = await import("../../src/app/api/people/employees/[employeeId]/route.ts");
  const employeeHistoryExportRoute = await import(
    "../../src/app/api/people/employees/[employeeId]/history/export/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0916 Org" });
  const departmentA = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0916-A",
    name: "Dept A"
  });
  const departmentB = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "WI0916-B",
    name: "Dept B"
  });

  const employeeId = "EMP-WI0916-1001";
  const adminHeaders = actorHeaders("admin", "ADM-WI0916-1", organization.id);
  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);

  const createResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: employeeId,
        organizationId: organization.id,
        departmentId: departmentA.id,
        name: "Kim WI0916",
        email: "kim.wi0916@example.com",
        active: true
      },
      adminHeaders
    )
  );
  assert.equal(createResponse.status, 201, "employee should be created");

  const namePatchResponse = await employeeByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/people/employees/${employeeId}`,
      {
        name: "Kim Updated WI0916"
      },
      adminHeaders
    ),
    { params: Promise.resolve({ employeeId }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(namePatchResponse.status, 200, "name patch should succeed");

  const departmentPatchResponse = await employeeByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/people/employees/${employeeId}`,
      {
        departmentId: departmentB.id
      },
      adminHeaders
    ),
    { params: Promise.resolve({ employeeId }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(departmentPatchResponse.status, 200, "department patch should succeed");

  const exportResponse = await employeeHistoryExportRoute.GET(
    new Request(`http://localhost/api/people/employees/${employeeId}/history/export`, {
      method: "GET",
      headers: adminHeaders
    }),
    { params: Promise.resolve({ employeeId }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(exportResponse.status, 200, "admin should export employee history csv");

  const contentType = exportResponse.headers.get("content-type") ?? "";
  assert.match(contentType, /^text\/csv/i, "csv export content type should be text/csv");

  const csvBytes = new Uint8Array(await exportResponse.arrayBuffer());
  assert.ok(csvBytes.length >= 3, "csv should include UTF-8 BOM bytes");
  assert.deepEqual(
    Array.from(csvBytes.slice(0, 3)),
    [0xef, 0xbb, 0xbf],
    "csv should start with UTF-8 BOM bytes"
  );
  const csv = new TextDecoder("utf-8", { ignoreBOM: false }).decode(csvBytes);

  const table = parseCsvTable(csv);
  assert.ok(table.length >= 2, "csv should include header and at least one data row");
  assert.deepEqual(table[0], ["date", "action", "field", "oldValue", "newValue", "actorId"]);

  const rows = table.slice(1).map(toRowObject);
  assert.ok(rows.length >= 2, "csv should include multiple history rows");
  assert.ok(
    rows.some(
      (row) =>
        row.action === "employee.profile.updated" &&
        row.field === "name" &&
        row.oldValue === "Kim WI0916" &&
        row.newValue === "Kim Updated WI0916"
    ),
    "csv should include name change row"
  );
  assert.ok(
    rows.some(
      (row) =>
        row.action === "employee.profile.updated" &&
        row.field === "departmentId" &&
        row.oldValue === departmentA.id &&
        row.newValue === departmentB.id
    ),
    "csv should include department change row"
  );

  const forbiddenResponse = await employeeHistoryExportRoute.GET(
    new Request(`http://localhost/api/people/employees/${employeeId}/history/export`, {
      method: "GET",
      headers: employeeHeaders
    }),
    { params: Promise.resolve({ employeeId }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(forbiddenResponse.status, 403, "employee role should be forbidden from csv export");

  console.log("e2e-wi0916-history-export.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
