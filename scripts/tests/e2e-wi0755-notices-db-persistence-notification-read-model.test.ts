import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const prismaSchema = readUtf8("prisma", "schema.prisma");
  const dataAccessSource = readUtf8("src", "features", "shared", "data-access.ts");
  const prismaDataAccessSource = readUtf8("src", "features", "shared", "prisma-data-access.ts");
  const memoryDataAccessSource = readUtf8("src", "features", "shared", "memory-data-access.ts");
  const noticesStoreSource = readUtf8("src", "features", "notices", "store.ts");
  const workItem = readUtf8("work-items", "WI-0755-notices-db-persistence-and-notification-read-model.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(prismaSchema, /model Notice \{/);
  assert.match(prismaSchema, /model NoticeReadReceipt \{/);
  assert.match(prismaSchema, /model NoticeNotificationQueue \{/);
  assert.match(prismaSchema, /enum NoticeAudience \{/);
  assert.match(prismaSchema, /enum NoticeNotificationState \{/);

  assert.match(dataAccessSource, /export interface NoticeStore/);
  assert.match(dataAccessSource, /export interface NoticeReadReceiptStore/);
  assert.match(dataAccessSource, /export interface NoticeNotificationStore/);
  assert.match(dataAccessSource, /notices: NoticeStore/);
  assert.match(dataAccessSource, /noticeReadReceipts: NoticeReadReceiptStore/);
  assert.match(dataAccessSource, /noticeNotifications: NoticeNotificationStore/);

  assert.match(prismaDataAccessSource, /const notices: NoticeStore/);
  assert.match(prismaDataAccessSource, /const noticeReadReceipts: NoticeReadReceiptStore/);
  assert.match(prismaDataAccessSource, /const noticeNotifications: NoticeNotificationStore/);
  assert.match(memoryDataAccessSource, /notices: \{/);
  assert.match(memoryDataAccessSource, /noticeReadReceipts: \{/);
  assert.match(memoryDataAccessSource, /noticeNotifications: \{/);

  assert.match(noticesStoreSource, /dataAccess\.notices\./);
  assert.match(noticesStoreSource, /dataAccess\.noticeReadReceipts\./);
  assert.match(noticesStoreSource, /dataAccess\.noticeNotifications\./);

  const noticesModule = await import("../../src/features/notices/store.ts");
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const organization = await memoryDataAccess.organizations.create({ name: "Org Notices" });

  const created = await noticesModule.createNotice(
    { dataAccess: memoryDataAccess },
    {
      organizationId: organization.id,
      title: "db-backed notice",
      body: "notice read model",
      audience: "employees",
      createdByActorId: "ADM-1",
      actorRole: "admin"
    }
  );
  assert.ok(created.id.length > 0);
  assert.equal(created.organizationId, organization.id);

  const published = await noticesModule.publishNotice(
    { dataAccess: memoryDataAccess },
    {
      organizationId: organization.id,
      noticeId: created.id,
      actorId: "ADM-1",
      actorRole: "admin"
    }
  );
  assert.ok(published);
  assert.equal(published?.status, "PUBLISHED");

  const queueRows = await memoryDataAccess.noticeNotifications.list({
    organizationId: organization.id,
    noticeId: created.id
  });
  assert.equal(queueRows.length, 1);
  assert.equal(queueRows[0]?.state, "QUEUED");

  const receipt = await noticesModule.markNoticeRead(
    { dataAccess: memoryDataAccess },
    {
      organizationId: organization.id,
      noticeId: created.id,
      actorId: "EMP-1",
      actorRole: "employee"
    }
  );
  assert.ok(receipt);

  const receiptRows = await memoryDataAccess.noticeReadReceipts.list({
    organizationId: organization.id,
    actorId: "EMP-1",
    noticeId: created.id
  });
  assert.equal(receiptRows.length, 1);

  assert.match(workItem, /WI-0755/i);
  assert.match(workItem, /notice|db|read model|persistence|notification/i);
  assert.match(roadmap, /WI-0755/i);
}

run()
  .then(() => {
    console.log("e2e-wi0755-notices-db-persistence-notification-read-model.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
