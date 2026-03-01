import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const auditHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-auto-action-audit-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0723-scheduling-auto-action-notify-side-effect-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentAutoActionNotificationAuditAppender\(/);
  assert.doesNotMatch(service, /buildScheduleAnomalyIncidentAutoActionExecutionAuditEntry\(/);

  assert.match(
    auditHelpers,
    /export function buildScheduleAnomalyIncidentAutoActionNotificationAuditAppender/
  );

  const module = await import(
    "../../src/features/scheduling/anomaly-incident-auto-action-audit-helpers.ts"
  );

  const appended: Array<Record<string, unknown>> = [];
  const appendAudit = module.buildScheduleAnomalyIncidentAutoActionNotificationAuditAppender({
    organizationId: "org-1",
    actorRole: "ADMIN",
    actorId: "admin-1",
    appendAuditEntry: async (entry: Record<string, unknown>) => {
      appended.push(entry);
    }
  });

  await appendAudit({
    action: "scheduling.anomaly.incident.auto_action.notified",
    payload: {
      executedAt: "2026-01-05T09:00:00.000Z",
      assigned: 2
    }
  });

  assert.equal(appended.length, 1);
  assert.equal(appended[0].action, "scheduling.anomaly.incident.auto_action.notified");
  assert.equal(appended[0].organizationId, "org-1");
  assert.equal((appended[0].payload as Record<string, unknown>).assigned, 2);

  assert.match(workItem, /WI-0723/i);
  assert.match(workItem, /scheduling|auto action|notify|side|effect|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0723-scheduling-auto-action-notify-side-effect-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
