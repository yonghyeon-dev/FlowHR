import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

process.env.FLOWHR_DATA_ACCESS = "memory";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const noticeSchemas = readUtf8("src", "features", "notices", "schemas.ts");
  const noticeStore = readUtf8("src", "features", "notices", "store.ts");
  const noticePatchRoute = readUtf8("src", "app", "api", "notices", "[noticeId]", "route.ts");
  const workItem = readUtf8("work-items", "WI-1030-announcement-partial-update.md");

  assert.match(noticeSchemas, /title: z\.string\(\)\.trim\(\)\.min\(2\)\.max\(120\)\.optional\(\)/);
  assert.match(noticeSchemas, /body: z\.string\(\)\.trim\(\)\.min\(4\)\.max\(2000\)\.optional\(\)/);
  assert.match(noticeSchemas, /audience: noticeAudienceSchema\.optional\(\)/);
  assert.match(noticeSchemas, /\.refine\(\(payload\) =>/);
  assert.match(noticeStore, /input\.publishAt !== undefined/);
  assert.match(noticePatchRoute, /updateNoticeSchema\.safeParse/);
  assert.match(workItem, /PATCH/i);

  const noticesStoreModule = await import("../../src/features/notices/store.ts");
  const noticePatchRouteModule = await import("../../src/app/api/notices/[noticeId]/route.ts");
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const org = await memoryDataAccess.organizations.create({ name: "Notice Partial Update Org" });
  const context = { dataAccess: memoryDataAccess };

  const scheduled = await noticesStoreModule.createNotice(context, {
    organizationId: org.id,
    title: "Initial title",
    body: "Initial body for scheduled notice",
    audience: "employees",
    publishAt: "2026-03-08T09:30:00.000Z",
    createdByActorId: "ADM-NOTICE-1030",
    actorRole: "admin"
  });

  const updateTitleResponse = await noticePatchRouteModule.PATCH(
    new Request(`http://localhost/api/notices/${scheduled.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-1030",
        "x-actor-organization-id": org.id
      },
      body: JSON.stringify({
        title: "Updated title only"
      })
    }),
    { params: Promise.resolve({ noticeId: scheduled.id }) }
  );
  assert.equal(updateTitleResponse.status, 200);
  const updateTitlePayload = (await updateTitleResponse.json()) as {
    notice?: {
      title: string;
      body: string;
      audience: string;
      status: string;
      publishAt: string | null;
    };
  };
  assert.equal(updateTitlePayload.notice?.title, "Updated title only");
  assert.equal(updateTitlePayload.notice?.body, "Initial body for scheduled notice");
  assert.equal(updateTitlePayload.notice?.audience, "employees");
  assert.equal(updateTitlePayload.notice?.status, "SCHEDULED");
  assert.equal(updateTitlePayload.notice?.publishAt, "2026-03-08T09:30:00.000Z");

  const updateBodyResponse = await noticePatchRouteModule.PATCH(
    new Request(`http://localhost/api/notices/${scheduled.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-1030",
        "x-actor-organization-id": org.id
      },
      body: JSON.stringify({
        body: "Updated body only"
      })
    }),
    { params: Promise.resolve({ noticeId: scheduled.id }) }
  );
  assert.equal(updateBodyResponse.status, 200);
  const updateBodyPayload = (await updateBodyResponse.json()) as {
    notice?: {
      title: string;
      body: string;
      audience: string;
      status: string;
      publishAt: string | null;
    };
  };
  assert.equal(updateBodyPayload.notice?.title, "Updated title only");
  assert.equal(updateBodyPayload.notice?.body, "Updated body only");
  assert.equal(updateBodyPayload.notice?.audience, "employees");
  assert.equal(updateBodyPayload.notice?.status, "SCHEDULED");
  assert.equal(updateBodyPayload.notice?.publishAt, "2026-03-08T09:30:00.000Z");

  const emptyUpdateResponse = await noticePatchRouteModule.PATCH(
    new Request(`http://localhost/api/notices/${scheduled.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-1030",
        "x-actor-organization-id": org.id
      },
      body: JSON.stringify({})
    }),
    { params: Promise.resolve({ noticeId: scheduled.id }) }
  );
  assert.equal(emptyUpdateResponse.status, 400);
}

run()
  .then(() => {
    console.log("e2e-wi1030-announcement-partial-update.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
