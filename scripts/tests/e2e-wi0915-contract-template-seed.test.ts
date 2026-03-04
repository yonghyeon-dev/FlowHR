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

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
  };
}

function postRequest(path: string, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers,
    body: "{}"
  });
}

function getRequest(path: string, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
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
  const seedDefaultsRoute = await import("../../src/app/api/contracts/templates/seed-defaults/route.ts");
  const templatesRoute = await import("../../src/app/api/contracts/templates/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0915 Org" });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0915-1001",
    organizationId: organization.id,
    name: "Employee WI0915"
  });

  const adminHeaders = actorHeaders("admin", "ADM-WI0915-1001", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0915-1001", organization.id);

  const firstSeedResponse = await seedDefaultsRoute.POST(
    postRequest("/api/contracts/templates/seed-defaults", adminHeaders)
  );
  assert.equal(firstSeedResponse.status, 200);
  const firstSeedBody = await readJson<{
    summary: { createdCount: number; skippedCount: number; totalSeededTemplates: number };
  }>(firstSeedResponse);
  assert.equal(firstSeedBody.summary.createdCount, 3);
  assert.equal(firstSeedBody.summary.skippedCount, 0);
  assert.equal(firstSeedBody.summary.totalSeededTemplates, 3);

  const firstListResponse = await templatesRoute.GET(
    getRequest(`/api/contracts/templates?organizationId=${encodeURIComponent(organization.id)}`, adminHeaders)
  );
  assert.equal(firstListResponse.status, 200);
  const firstListBody = await readJson<{
    templates: Array<{
      name: string;
      category: string;
      status: string;
      body: string;
    }>;
  }>(firstListResponse);
  assert.equal(firstListBody.templates.length, 3);

  const expectedTemplateNames = new Set([
    "정규직 근로계약서 (PERMANENT)",
    "계약직 근로계약서 (CONTRACT)",
    "인턴 근로계약서 (INTERN)"
  ]);
  for (const template of firstListBody.templates) {
    assert.ok(expectedTemplateNames.has(template.name), `unexpected template name: ${template.name}`);
    assert.equal(template.category, "employment");
    assert.equal(template.status, "ACTIVE");
    assert.match(template.body, /근무 장소/);
    assert.match(template.body, /업무 내용/);
    assert.match(template.body, /근무 시간/);
    assert.match(template.body, /급여/);
    assert.match(template.body, /휴가/);
    assert.match(template.body, /계약 기간/);
  }

  const secondSeedResponse = await seedDefaultsRoute.POST(
    postRequest("/api/contracts/templates/seed-defaults", adminHeaders)
  );
  assert.equal(secondSeedResponse.status, 200);
  const secondSeedBody = await readJson<{
    summary: { createdCount: number; skippedCount: number; totalSeededTemplates: number };
  }>(secondSeedResponse);
  assert.equal(secondSeedBody.summary.createdCount, 0);
  assert.equal(secondSeedBody.summary.skippedCount, 3);
  assert.equal(secondSeedBody.summary.totalSeededTemplates, 3);

  const secondListResponse = await templatesRoute.GET(
    getRequest(`/api/contracts/templates?organizationId=${encodeURIComponent(organization.id)}`, adminHeaders)
  );
  assert.equal(secondListResponse.status, 200);
  const secondListBody = await readJson<{ templates: Array<{ id: string }> }>(secondListResponse);
  assert.equal(secondListBody.templates.length, 3);

  const employeeForbiddenResponse = await seedDefaultsRoute.POST(
    postRequest("/api/contracts/templates/seed-defaults", employeeHeaders)
  );
  assert.equal(employeeForbiddenResponse.status, 403);
}

run()
  .then(() => {
    console.log("e2e-wi0915-contract-template-seed.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
