import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type AuditEntry = {
  action: string;
  entityType: string;
  entityId: string | null;
  organizationId: string | null;
  actorRole: string;
  actorId: string | null;
  payload: unknown;
  createdAt: Date;
};

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function createAuditContext() {
  const entries: AuditEntry[] = [];

  const context = {
    dataAccess: {
      audit: {
        async append(input: {
          action: string;
          entityType: string;
          entityId?: string;
          organizationId?: string | null;
          actorRole: string;
          actorId?: string | null;
          payload?: unknown;
        }) {
          entries.push({
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId ?? null,
            organizationId: input.organizationId ?? null,
            actorRole: input.actorRole,
            actorId: input.actorId ?? null,
            payload: input.payload ?? null,
            createdAt: new Date(Date.now() + entries.length)
          });
        },
        async list(input: {
          actions?: string[];
          entityType?: string;
          entityId?: string;
          organizationId?: string;
          limit?: number;
        }) {
          const normalizedLimit = input.limit ?? 500;
          return entries
            .filter((entry) => (input.actions && input.actions.length > 0 ? input.actions.includes(entry.action) : true))
            .filter((entry) => (input.entityType ? entry.entityType === input.entityType : true))
            .filter((entry) => (input.entityId ? entry.entityId === input.entityId : true))
            .filter((entry) => (input.organizationId !== undefined ? entry.organizationId === input.organizationId : true))
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .slice(0, normalizedLimit)
            .map((entry) => ({ ...entry }));
        }
      }
    }
  };

  return { context, entries };
}

async function run() {
  const storeSource = readUtf8("src", "features", "notices", "store.ts");
  const apiRouteSource = readUtf8("src", "app", "api", "notices", "route.ts");
  const publishRouteSource = readUtf8(
    "src",
    "app",
    "api",
    "notices",
    "[noticeId]",
    "publish",
    "route.ts"
  );
  const readRouteSource = readUtf8(
    "src",
    "app",
    "api",
    "notices",
    "[noticeId]",
    "read",
    "route.ts"
  );
  const readAllRouteSource = readUtf8(
    "src",
    "app",
    "api",
    "notices",
    "read-all",
    "route.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0754-notices-audit-persistence-and-notification-link.md"
  );

  assert.match(storeSource, /notice\.created/);
  assert.match(storeSource, /notice\.published/);
  assert.match(storeSource, /notice\.notification\.enqueued/);
  assert.match(storeSource, /context\.dataAccess\.audit\.list/);
  assert.match(apiRouteSource, /getRuntimeDataAccess/);
  assert.match(publishRouteSource, /getRuntimeDataAccess/);
  assert.match(readRouteSource, /getRuntimeDataAccess/);
  assert.match(readAllRouteSource, /getRuntimeDataAccess/);

  const module = await import("../../src/features/notices/store.ts");
  const { context, entries } = createAuditContext();

  const created = await module.createNotice(context, {
    organizationId: "ORG-1",
    title: "공지 테스트",
    body: "공지 본문 테스트",
    audience: "employees",
    createdByActorId: "ADM-1",
    actorRole: "admin"
  });
  assert.equal(created.organizationId, "ORG-1");
  assert.equal(created.status, "DRAFT");

  const published = await module.publishNotice(context, {
    organizationId: "ORG-1",
    noticeId: created.id,
    actorId: "ADM-1",
    actorRole: "admin"
  });
  assert.ok(published);
  assert.equal(published?.status, "PUBLISHED");

  const notices = await module.listNotices(context, {
    organizationId: "ORG-1",
    audience: "employees",
    publishedOnly: true
  });
  assert.equal(notices.length, 1);
  assert.equal(notices[0]?.id, created.id);
  assert.equal(notices[0]?.status, "PUBLISHED");

  const receipt = await module.markNoticeRead(context, {
    organizationId: "ORG-1",
    noticeId: created.id,
    actorId: "EMP-1",
    actorRole: "employee"
  });
  assert.ok(receipt);
  assert.equal(receipt?.noticeId, created.id);

  const readReceipts = await module.listNoticeReadReceipts(context, {
    organizationId: "ORG-1",
    actorId: "EMP-1"
  });
  assert.equal(readReceipts.length, 1);
  assert.equal(readReceipts[0]?.noticeId, created.id);

  const actions = entries.map((entry) => entry.action);
  assert.ok(actions.includes("notice.created"));
  assert.ok(actions.includes("notice.published"));
  assert.ok(actions.includes("notice.notification.enqueued"));
  assert.ok(actions.includes("notice.read"));

  assert.match(workItem, /WI-0754/i);
  assert.match(workItem, /notice|audit|persistence|notification|db|publish|read/i);
}

run()
  .then(() => {
    console.log("e2e-wi0754-notices-audit-persistence-notification-link.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

