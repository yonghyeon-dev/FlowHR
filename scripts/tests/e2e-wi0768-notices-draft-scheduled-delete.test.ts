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
  const noticeItemRoute = readUtf8("src", "app", "api", "notices", "[noticeId]", "route.ts");
  const dataAccess = readUtf8("src", "features", "shared", "data-access.ts");
  const memoryDataAccessSource = readUtf8("src", "features", "shared", "memory-data-access.ts");
  const prismaDataAccessSource = readUtf8("src", "features", "shared", "prisma-data-access.ts");
  const workspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const view = readUtf8("src", "components", "notices", "AdminNoticeWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "notices", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0768-notices-draft-scheduled-delete.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(noticeSchemas, /export const deleteNoticeSchema = z\.object\(/);
  assert.match(noticeStore, /const NOTICE_DELETED_ACTION = "notice\.deleted"/);
  assert.match(noticeStore, /export async function deleteNotice/);
  assert.match(noticeStore, /published_locked/);
  assert.match(dataAccess, /interface NoticeStore[\s\S]*delete\(id: string\): Promise<NoticeEntity>/);
  assert.match(memoryDataAccessSource, /notices:\s*\{[\s\S]*async delete\(id: string\)/);
  assert.match(prismaDataAccessSource, /const notices: NoticeStore = \{[\s\S]*async delete\(id: string\)/);

  assert.match(noticeItemRoute, /export async function DELETE/);
  assert.match(noticeItemRoute, /notice\.delete\.published_locked/);
  assert.match(workspace, /onDeleteNotice/);
  assert.match(view, /copy\.deleteAction/);
  assert.match(copy, /deleteAction/);
  assert.ok(countLines(workspace) <= 300, "AdminNoticeWorkspace must stay <= 300 lines");

  const noticesModule = await import("../../src/features/notices/store.ts");
  const noticeRouteModule = await import("../../src/app/api/notices/[noticeId]/route.ts");
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const org = await memoryDataAccess.organizations.create({ name: "Notice Delete Org" });
  const context = { dataAccess: memoryDataAccess };

  const draft = await noticesModule.createNotice(context, {
    organizationId: org.id,
    title: "Draft delete",
    body: "Draft notice can be deleted",
    audience: "employees",
    createdByActorId: "ADM-NOTICE-DEL-1",
    actorRole: "admin"
  });

  const scheduled = await noticesModule.createNotice(context, {
    organizationId: org.id,
    title: "Scheduled delete",
    body: "Scheduled notice can be deleted",
    audience: "all",
    publishAt: "2026-04-01T09:00:00.000Z",
    createdByActorId: "ADM-NOTICE-DEL-1",
    actorRole: "admin"
  });

  const deleteDraftResponse = await noticeRouteModule.DELETE(
    new Request(`http://localhost/api/notices/${draft.id}`, {
      method: "DELETE",
      headers: {
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-DEL-1",
        "x-actor-organization-id": org.id
      }
    }),
    { params: Promise.resolve({ noticeId: draft.id }) }
  );
  assert.equal(deleteDraftResponse.status, 200);
  const deleteDraftPayload = (await deleteDraftResponse.json()) as {
    notice?: { id: string; status: string };
  };
  assert.equal(deleteDraftPayload.notice?.id, draft.id);
  assert.equal(deleteDraftPayload.notice?.status, "DRAFT");

  const deleteScheduledResponse = await noticeRouteModule.DELETE(
    new Request(`http://localhost/api/notices/${scheduled.id}`, {
      method: "DELETE",
      headers: {
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-DEL-1",
        "x-actor-organization-id": org.id
      }
    }),
    { params: Promise.resolve({ noticeId: scheduled.id }) }
  );
  assert.equal(deleteScheduledResponse.status, 200);
  const deleteScheduledPayload = (await deleteScheduledResponse.json()) as {
    notice?: { id: string; status: string };
  };
  assert.equal(deleteScheduledPayload.notice?.id, scheduled.id);
  assert.equal(deleteScheduledPayload.notice?.status, "SCHEDULED");

  const publishCandidate = await noticesModule.createNotice(context, {
    organizationId: org.id,
    title: "Publish lock",
    body: "Published notice must stay immutable for delete",
    audience: "employees",
    createdByActorId: "ADM-NOTICE-DEL-1",
    actorRole: "admin"
  });
  const published = await noticesModule.publishNotice(context, {
    organizationId: org.id,
    noticeId: publishCandidate.id,
    actorId: "ADM-NOTICE-DEL-1",
    actorRole: "admin"
  });
  assert.ok(published);
  assert.equal(published?.status, "PUBLISHED");

  const deletePublishedResponse = await noticeRouteModule.DELETE(
    new Request(`http://localhost/api/notices/${publishCandidate.id}`, {
      method: "DELETE",
      headers: {
        "x-actor-role": "admin",
        "x-actor-id": "ADM-NOTICE-DEL-1",
        "x-actor-organization-id": org.id
      }
    }),
    { params: Promise.resolve({ noticeId: publishCandidate.id }) }
  );
  assert.equal(deletePublishedResponse.status, 409);
  const deletePublishedPayload = (await deletePublishedResponse.json()) as { error?: string };
  assert.equal(deletePublishedPayload.error, "notice.delete.published_locked");

  const remaining = await noticesModule.listNotices(context, {
    organizationId: org.id
  });
  assert.equal(remaining.some((notice) => notice.id === draft.id), false);
  assert.equal(remaining.some((notice) => notice.id === scheduled.id), false);
  assert.equal(remaining.some((notice) => notice.id === publishCandidate.id), true);

  const auditRows = await memoryDataAccess.audit.list({
    organizationId: org.id,
    limit: 100
  });
  const deletedAuditRows = auditRows.filter((row) => row.action === "notice.deleted");
  assert.equal(deletedAuditRows.length, 2);
  assert.ok(deletedAuditRows.some((row) => row.entityId === draft.id));
  assert.ok(deletedAuditRows.some((row) => row.entityId === scheduled.id));

  assert.match(workItem, /WI-0768/i);
  assert.match(workItem, /notice|draft|scheduled|delete|withdraw/i);
  assert.match(roadmap, /WI-0768/i);
}

run()
  .then(() => {
    console.log("e2e-wi0768-notices-draft-scheduled-delete.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
