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
    "WI-0726-scheduling-auto-action-notify-publish-side-effect-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentAutoActionExecutedEventPublisher\(/);
  assert.doesNotMatch(service, /name: "scheduling\.anomaly\.incident\.auto_action\.executed\.v1"/);
  assert.match(
    auditHelpers,
    /export function buildScheduleAnomalyIncidentAutoActionExecutedEventPublisher/
  );

  const module = await import(
    "../../src/features/scheduling/anomaly-incident-auto-action-audit-helpers.ts"
  );

  const published: Array<Record<string, unknown>> = [];
  const publishExecuted = module.buildScheduleAnomalyIncidentAutoActionExecutedEventPublisher({
    occurredAt: "2026-01-08T09:00:00.000Z",
    actorRole: "ADMIN",
    actorId: "admin-1",
    publishEvent: async (event: Record<string, unknown>) => {
      published.push(event);
    }
  });

  await publishExecuted({
    candidates: 4,
    assigned: 2
  });

  assert.equal(published.length, 1);
  assert.equal(published[0].name, "scheduling.anomaly.incident.auto_action.executed.v1");
  assert.equal(published[0].occurredAt, "2026-01-08T09:00:00.000Z");
  assert.equal(published[0].actorRole, "ADMIN");
  assert.equal((published[0].payload as Record<string, unknown>).assigned, 2);

  assert.match(workItem, /WI-0726/i);
  assert.match(workItem, /scheduling|auto action|notify|publish|side|effect|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0726-scheduling-auto-action-notify-publish-side-effect-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
