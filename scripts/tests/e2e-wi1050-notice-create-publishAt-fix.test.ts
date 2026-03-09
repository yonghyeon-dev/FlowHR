import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

process.env.FLOWHR_DATA_ACCESS = "memory";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const noticesRoute = readUtf8("src", "app", "api", "notices", "route.ts");
  const noticeSchemas = readUtf8("src", "features", "notices", "schemas.ts");
  const workItem = readUtf8("work-items", "WI-1050-notice-create-publishAt-fix.md");
  const contract = readUtf8("specs", "people", "contract.yaml");
  const testCases = readUtf8("specs", "people", "test-cases.md");

  assert.match(
    workspace,
    /\.\.\.\(hasEditingTarget \|\| publishIso !== null \? \{ publishAt: publishIso \} : \{\}\)/,
    "notice create should omit blank publishAt while preserving PATCH null-clearing"
  );
  assert.doesNotMatch(
    workspace,
    /targetDepartmentIds: selectedDepartmentIds,\s*publishAt: publishIso/,
    "notice create payload must not always send publishAt"
  );
  assert.match(noticesRoute, /createNoticeSchema/);
  assert.match(noticeSchemas, /publishAt: z\.string\(\)\.datetime\(\{ offset: true \}\)\.nullable\(\)\.optional\(\)/);

  const noticesRouteModule = await import("../../src/app/api/notices/route.ts");
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const organization = await memoryDataAccess.organizations.create({ name: "Notice Create Org" });

  const createImmediateResponse = await noticesRouteModule.POST(
    new Request("http://localhost/api/notices", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-1",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({
        organizationId: organization.id,
        title: "Immediate notice",
        body: "Immediate notice body",
        audience: "employees",
        targetDepartmentIds: []
      })
    })
  );
  assert.equal(createImmediateResponse.status, 201);
  const immediatePayload = (await createImmediateResponse.json()) as {
    notice?: { status: string; publishAt: string | null };
  };
  assert.equal(immediatePayload.notice?.status, "DRAFT");
  assert.equal(immediatePayload.notice?.publishAt, null);

  const createNullPublishResponse = await noticesRouteModule.POST(
    new Request("http://localhost/api/notices", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-1",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({
        organizationId: organization.id,
        title: "Null notice",
        body: "Null publishAt notice body",
        audience: "employees",
        publishAt: null
      })
    })
  );
  assert.equal(createNullPublishResponse.status, 201);
  const nullPublishPayload = (await createNullPublishResponse.json()) as {
    notice?: { status: string; publishAt: string | null };
  };
  assert.equal(nullPublishPayload.notice?.status, "DRAFT");
  assert.equal(nullPublishPayload.notice?.publishAt, null);

  const createScheduledResponse = await noticesRouteModule.POST(
    new Request("http://localhost/api/notices", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-1",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({
        organizationId: organization.id,
        title: "Scheduled notice",
        body: "Scheduled publishAt notice body",
        audience: "employees",
        publishAt: "2026-03-10T00:00:00.000Z"
      })
    })
  );
  assert.equal(createScheduledResponse.status, 201);
  const scheduledPayload = (await createScheduledResponse.json()) as {
    notice?: { status: string; publishAt: string | null };
  };
  assert.equal(scheduledPayload.notice?.status, "SCHEDULED");
  assert.equal(scheduledPayload.notice?.publishAt, "2026-03-10T00:00:00.000Z");

  assert.match(workItem, /publishAt/);
  assert.match(contract, /path: \/notices/);
  assert.match(testCases, /Admin or manager can create a draft notice via `POST \/notices` without `publishAt`\./);
  assert.match(testCases, /Admin or manager can create a scheduled notice via `POST \/notices` with `publishAt`\./);
}

run()
  .then(() => {
    console.log("e2e-wi1050-notice-create-publishAt-fix.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
