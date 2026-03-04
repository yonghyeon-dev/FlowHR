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

type NoticeEntity = {
  id: string;
  organizationId: string;
  title: string;
  body: string;
  audience: "all" | "employees" | "admins";
  targetDepartmentIds: string[];
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  publishAt: Date | null;
  publishedAt: Date | null;
  createdByActorId: string;
  createdAt: Date;
  updatedAt: Date;
};

type NoticeReadReceiptEntity = {
  id: string;
  organizationId: string;
  noticeId: string;
  actorId: string;
  readAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type NoticeNotificationEntity = {
  id: string;
  organizationId: string;
  noticeId: string;
  audience: "all" | "employees" | "admins";
  channel: "in_app";
  state: "QUEUED" | "DELIVERED" | "FAILED";
  enqueuedAt: Date;
  deliveredAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function createContext() {
  const entries: AuditEntry[] = [];
  const notices = new Map<string, NoticeEntity>();
  const receipts = new Map<string, NoticeReadReceiptEntity>();
  const notifications = new Map<string, NoticeNotificationEntity>();
  let sequence = 1;

  const nextId = (prefix: string) => `${prefix}-${String(sequence++).padStart(4, "0")}`;

  const context = {
    dataAccess: {
      notices: {
        async create(input: {
          organizationId: string;
          title: string;
          body: string;
          audience: "all" | "employees" | "admins";
          targetDepartmentIds?: string[];
          status?: "DRAFT" | "SCHEDULED" | "PUBLISHED";
          publishAt?: Date | null;
          publishedAt?: Date | null;
          createdByActorId: string;
          createdAt?: Date;
          updatedAt?: Date;
        }) {
          const now = new Date();
          const row: NoticeEntity = {
            id: nextId("NOTICE"),
            organizationId: input.organizationId,
            title: input.title,
            body: input.body,
            audience: input.audience,
            targetDepartmentIds: input.targetDepartmentIds ?? [],
            status: input.status ?? "DRAFT",
            publishAt: input.publishAt ?? null,
            publishedAt: input.publishedAt ?? null,
            createdByActorId: input.createdByActorId,
            createdAt: input.createdAt ?? now,
            updatedAt: input.updatedAt ?? now
          };
          notices.set(row.id, row);
          return { ...row };
        },
        async findById(id: string) {
          const row = notices.get(id);
          return row ? { ...row } : null;
        },
        async update(id: string, input: {
          title?: string;
          body?: string;
          audience?: "all" | "employees" | "admins";
          targetDepartmentIds?: string[];
          status?: "DRAFT" | "SCHEDULED" | "PUBLISHED";
          publishAt?: Date | null;
          publishedAt?: Date | null;
          updatedAt?: Date;
        }) {
          const existing = notices.get(id);
          if (!existing) {
            throw new Error(`notice not found: ${id}`);
          }
          const updated: NoticeEntity = {
            ...existing,
            title: input.title ?? existing.title,
            body: input.body ?? existing.body,
            audience: input.audience ?? existing.audience,
            targetDepartmentIds:
              input.targetDepartmentIds !== undefined
                ? input.targetDepartmentIds
                : existing.targetDepartmentIds,
            status: input.status ?? existing.status,
            publishAt: input.publishAt !== undefined ? input.publishAt : existing.publishAt,
            publishedAt: input.publishedAt !== undefined ? input.publishedAt : existing.publishedAt,
            updatedAt: input.updatedAt ?? new Date()
          };
          notices.set(id, updated);
          return { ...updated };
        },
        async delete(id: string) {
          const existing = notices.get(id);
          if (!existing) {
            throw new Error(`notice not found: ${id}`);
          }
          notices.delete(id);
          return { ...existing };
        },
        async list(input: {
          organizationId: string;
          audience?: "all" | "employees" | "admins";
          status?: "DRAFT" | "SCHEDULED" | "PUBLISHED";
          limit?: number;
        }) {
          const rows = Array.from(notices.values())
            .filter((row) => row.organizationId === input.organizationId)
            .filter((row) => (input.audience ? row.audience === input.audience : true))
            .filter((row) => (input.status ? row.status === input.status : true))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          return rows.slice(0, input.limit ?? 500).map((row) => ({ ...row }));
        }
      },
      noticeReadReceipts: {
        async upsert(input: { organizationId: string; noticeId: string; actorId: string; readAt: Date }) {
          const key = `${input.organizationId}::${input.noticeId}::${input.actorId}`;
          const existing = receipts.get(key);
          const now = new Date();
          const next: NoticeReadReceiptEntity = {
            id: existing?.id ?? nextId("NREAD"),
            organizationId: input.organizationId,
            noticeId: input.noticeId,
            actorId: input.actorId,
            readAt: input.readAt,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now
          };
          receipts.set(key, next);
          return { ...next };
        },
        async list(input: { organizationId: string; actorId?: string; noticeId?: string; limit?: number }) {
          const rows = Array.from(receipts.values())
            .filter((row) => row.organizationId === input.organizationId)
            .filter((row) => (input.actorId ? row.actorId === input.actorId : true))
            .filter((row) => (input.noticeId ? row.noticeId === input.noticeId : true))
            .sort((a, b) => b.readAt.getTime() - a.readAt.getTime());
          return rows.slice(0, input.limit ?? 500).map((row) => ({ ...row }));
        }
      },
      noticeNotifications: {
        async create(input: {
          organizationId: string;
          noticeId: string;
          audience: "all" | "employees" | "admins";
          channel: "in_app";
          state?: "QUEUED" | "DELIVERED" | "FAILED";
          enqueuedAt: Date;
          deliveredAt?: Date | null;
          lastError?: string | null;
        }) {
          const now = new Date();
          const row: NoticeNotificationEntity = {
            id: nextId("NQ"),
            organizationId: input.organizationId,
            noticeId: input.noticeId,
            audience: input.audience,
            channel: input.channel,
            state: input.state ?? "QUEUED",
            enqueuedAt: input.enqueuedAt,
            deliveredAt: input.deliveredAt ?? null,
            lastError: input.lastError ?? null,
            createdAt: now,
            updatedAt: now
          };
          notifications.set(row.id, row);
          return { ...row };
        },
        async findById(id: string) {
          const row = notifications.get(id);
          return row ? { ...row } : null;
        },
        async update(id: string, input: {
          state?: "QUEUED" | "DELIVERED" | "FAILED";
          deliveredAt?: Date | null;
          lastError?: string | null;
        }) {
          const existing = notifications.get(id);
          if (!existing) {
            throw new Error(`notification not found: ${id}`);
          }
          const next: NoticeNotificationEntity = {
            ...existing,
            state: input.state ?? existing.state,
            deliveredAt: input.deliveredAt !== undefined ? input.deliveredAt : existing.deliveredAt,
            lastError: input.lastError !== undefined ? input.lastError : existing.lastError,
            updatedAt: new Date()
          };
          notifications.set(id, next);
          return { ...next };
        },
        async list(input: { organizationId: string; noticeId?: string; state?: "QUEUED" | "DELIVERED" | "FAILED"; limit?: number }) {
          const rows = Array.from(notifications.values())
            .filter((row) => row.organizationId === input.organizationId)
            .filter((row) => (input.noticeId ? row.noticeId === input.noticeId : true))
            .filter((row) => (input.state ? row.state === input.state : true))
            .sort((a, b) => b.enqueuedAt.getTime() - a.enqueuedAt.getTime());
          return rows.slice(0, input.limit ?? 500).map((row) => ({ ...row }));
        }
      },
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

  return { context, entries, notifications };
}

async function run() {
  const storeSource = readUtf8("src", "features", "notices", "store.ts");
  const apiRouteSource = readUtf8("src", "app", "api", "notices", "route.ts");
  const publishRouteSource = readUtf8("src", "app", "api", "notices", "[noticeId]", "publish", "route.ts");
  const readRouteSource = readUtf8("src", "app", "api", "notices", "[noticeId]", "read", "route.ts");
  const readAllRouteSource = readUtf8("src", "app", "api", "notices", "read-all", "route.ts");
  const workItem = readUtf8("work-items", "WI-0754-notices-audit-persistence-and-notification-link.md");

  assert.match(storeSource, /dataAccess\.notices\./);
  assert.match(storeSource, /dataAccess\.noticeReadReceipts\./);
  assert.match(storeSource, /dataAccess\.noticeNotifications\./);
  assert.match(storeSource, /notice\.created/);
  assert.match(storeSource, /notice\.published/);
  assert.match(storeSource, /notice\.notification\.enqueued/);
  assert.match(apiRouteSource, /getRuntimeDataAccess/);
  assert.match(publishRouteSource, /getRuntimeDataAccess/);
  assert.match(readRouteSource, /getRuntimeDataAccess/);
  assert.match(readAllRouteSource, /getRuntimeDataAccess/);

  const module = await import("../../src/features/notices/store.ts");
  const { context, entries, notifications } = createContext();

  const created = await module.createNotice(context, {
    organizationId: "ORG-1",
    title: "notice title",
    body: "notice body",
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
  assert.equal(notifications.size, 1);

  const notices = await module.listNotices(context, {
    organizationId: "ORG-1",
    audience: "employees",
    publishedOnly: true
  });
  assert.equal(notices.length, 1);
  assert.equal(notices[0]?.id, created.id);

  const receipt = await module.markNoticeRead(context, {
    organizationId: "ORG-1",
    noticeId: created.id,
    actorId: "EMP-1",
    actorRole: "employee"
  });
  assert.ok(receipt);
  assert.equal(receipt?.noticeId, created.id);

  const receipts = await module.listNoticeReadReceipts(context, {
    organizationId: "ORG-1",
    actorId: "EMP-1"
  });
  assert.equal(receipts.length, 1);

  const markAll = await module.markAllNoticesRead(context, {
    organizationId: "ORG-1",
    actorId: "EMP-1",
    actorRole: "employee",
    audience: "employees"
  });
  assert.equal(markAll.length, 1);

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
