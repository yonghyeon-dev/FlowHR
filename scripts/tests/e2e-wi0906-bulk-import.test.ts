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

async function readJson(response: Response) {
  return (await response.json()) as unknown;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const employeeBulkImportRoute = await import("../../src/app/api/people/employees/bulk-import/route.ts");
  const employeesRoute = await import("../../src/app/api/people/employees/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0906 Org" });
  const department = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "ENG",
    name: "Engineering",
    active: true
  });
  const position = await memoryDataAccess.positions.create({
    organizationId: organization.id,
    code: "STAFF",
    name: "Staff",
    active: true
  });

  const adminHeaders = actorHeaders("admin", "ADM-WI0906-1", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0906-SELF", organization.id);

  const bulkImportResponse = await employeeBulkImportRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees/bulk-import",
      {
        employees: [
          {
            name: "Kim Hana",
            email: "hana.wi0906@flowhr.dev",
            departmentId: department.id,
            positionId: position.id,
            hireDate: "2026-03-01"
          },
          {
            name: "Park Min",
            email: "min.wi0906@flowhr.dev",
            departmentId: department.id,
            positionId: position.id,
            hireDate: "2026-03-02"
          },
          {
            name: "Lee Jun",
            email: "jun.wi0906@flowhr.dev",
            departmentId: department.id,
            positionId: position.id,
            hireDate: "2026-03-03"
          }
        ]
      },
      adminHeaders
    )
  );
  assert.equal(bulkImportResponse.status, 200, "admin bulk import should succeed");
  const bulkImportBody = (await readJson(bulkImportResponse)) as {
    imported: number;
    failed: number;
    errors: string[];
  };
  assert.equal(bulkImportBody.imported, 3, "three employees should be imported");
  assert.equal(bulkImportBody.failed, 0, "bulk import should not fail for valid rows");
  assert.equal(bulkImportBody.errors.length, 0, "bulk import should not return errors");

  const listEmployeesResponse = await employeesRoute.GET(
    new Request(`http://localhost/api/people/employees?organizationId=${encodeURIComponent(organization.id)}`, {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(listEmployeesResponse.status, 200, "admin should list employees after bulk import");
  const listEmployeesBody = (await readJson(listEmployeesResponse)) as {
    employees: Array<{
      name: string | null;
      email: string | null;
      departmentId: string | null;
      positionId: string | null;
    }>;
  };
  assert.equal(listEmployeesBody.employees.length, 3, "employee list should contain three imported employees");
  assert.ok(
    listEmployeesBody.employees.every((employee) => employee.departmentId === department.id),
    "all imported employees should keep department id"
  );
  assert.ok(
    listEmployeesBody.employees.every((employee) => employee.positionId === position.id),
    "all imported employees should keep position id"
  );

  const forbiddenResponse = await employeeBulkImportRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees/bulk-import",
      {
        employees: [
          {
            name: "Employee Forbidden",
            email: "forbidden.wi0906@flowhr.dev",
            departmentId: department.id,
            positionId: position.id,
            hireDate: "2026-03-04"
          }
        ]
      },
      employeeHeaders
    )
  );
  assert.equal(forbiddenResponse.status, 403, "employee role should be forbidden from bulk import");
}

run()
  .then(() => {
    console.log("e2e-wi0906-bulk-import.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
