import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

process.env.FLOWHR_DATA_ACCESS = "memory";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const noticeSchemas = readUtf8("src", "features", "notices", "schemas.ts");
  const noticeStore = readUtf8("src", "features", "notices", "store.ts");
  const noticePatchRoute = readUtf8("src", "app", "api", "notices", "[noticeId]", "route.ts");
  const workspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const view = readUtf8("src", "components", "notices", "AdminNoticeWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "notices", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0764-notices-draft-scheduled-edit.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(noticeSchemas, /export const updateNoticeSchema = z\.object\(/);
  assert.match(noticeStore, /const NOTICE_UPDATED_ACTION = "notice\.updated"/);
  assert.match(noticeStore, /export async function updateNotice/);
  assert.match(noticeStore, /published_locked/);

  assert.match(noticePatchRoute, /export async function PATCH/);
  assert.match(noticePatchRoute, /updateNoticeSchema/);
  assert.match(noticePatchRoute, /notice\.update\.published_locked/);

  assert.match(workspace, /editingNoticeId/);
  assert.match(workspace, /method = hasEditingTarget \? "PATCH" : "POST"/);
  assert.match(workspace, /onStartEditNotice/);
  assert.match(view, /copy\.editAction/);
  assert.match(view, /copy\.updateAction/);
  assert.match(copy, /updateAction/);
  assert.ok(countLines(workspace) <= 300, "AdminNoticeWorkspace must stay <= 300 lines");

  const noticesStoreModule = await import("../../src/features/notices/store.ts");
  const noticePatchRouteModule = await import("../../src/app/api/notices/[noticeId]/route.ts");
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const org = await memoryDataAccess.organizations.create({ name: "Notice Org" });
  const context = { dataAccess: memoryDataAccess };

  const draft = await noticesStoreModule.createNotice(context, {
    organizationId: org.id,
    title: "Initial notice",
    body: "Initial body for draft",
    audience: "employees",
    createdByActorId: "ADM-NOTICE-1",
    actorRole: "admin"
  });

  const updateDraftResponse = await noticePatchRouteModule.PATCH(
    new Request(`http://localhost/api/notices/${draft.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-1",
        "x-actor-organization-id": org.id
      },
      body: JSON.stringify({
        title: "Updated notice",
        body: "Updated body for scheduled notice",
        audience: "all",
        publishAt: "2026-03-04T09:30:00.000Z"
      })
    }),
    { params: Promise.resolve({ noticeId: draft.id }) }
  );
  assert.equal(updateDraftResponse.status, 200);
  const updateDraftPayload = (await updateDraftResponse.json()) as {
    notice?: { title: string; status: string; audience: string; publishAt: string | null };
  };
  assert.equal(updateDraftPayload.notice?.title, "Updated notice");
  assert.equal(updateDraftPayload.notice?.status, "SCHEDULED");
  assert.equal(updateDraftPayload.notice?.audience, "all");
  assert.equal(updateDraftPayload.notice?.publishAt, "2026-03-04T09:30:00.000Z");

  const published = await noticesStoreModule.publishNotice(context, {
    organizationId: org.id,
    noticeId: draft.id,
    actorId: "ADM-NOTICE-1",
    actorRole: "admin"
  });
  assert.ok(published);

  const updatePublishedResponse = await noticePatchRouteModule.PATCH(
    new Request(`http://localhost/api/notices/${draft.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-1",
        "x-actor-organization-id": org.id
      },
      body: JSON.stringify({
        title: "Should fail",
        body: "Cannot edit published notice",
        audience: "employees",
        publishAt: null
      })
    }),
    { params: Promise.resolve({ noticeId: draft.id }) }
  );
  assert.equal(updatePublishedResponse.status, 409);
  const updatePublishedPayload = (await updatePublishedResponse.json()) as { error?: string };
  assert.equal(updatePublishedPayload.error, "notice.update.published_locked");

  const auditRows = await memoryDataAccess.audit.list({
    organizationId: org.id,
    limit: 50
  });
  assert.ok(auditRows.some((row) => row.action === "notice.updated"));

  assert.match(workItem, /WI-0764/i);
  assert.match(workItem, /notice|draft|scheduled|edit|update/i);
  assert.match(roadmap, /WI-0764/i);
}

run()
  .then(() => {
    console.log("e2e-wi0764-notices-draft-scheduled-edit.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
