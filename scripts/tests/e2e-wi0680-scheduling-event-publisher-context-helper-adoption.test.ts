import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const schedulingService = readUtf8("src", "features", "scheduling", "service.ts");
  const contextHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-service-context-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0680-scheduling-event-publisher-context-helper-adoption.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schedulingService, /resolveSchedulingEventPublisher/);
  assert.doesNotMatch(schedulingService, /function getEventPublisher\(/);
  assert.doesNotMatch(schedulingService, /getRuntimeDomainEventPublisher/);
  assert.match(contextHelpers, /export function resolveSchedulingEventPublisher\(/);

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );

  assert.match(workItem, /WI-0680/i);
  assert.match(workItem, /scheduling|event|publisher|context|helper|adoption/i);
  assert.match(roadmap, /WI-0680/i);
}

run()
  .then(() => {
    console.log("e2e-wi0680-scheduling-event-publisher-context-helper-adoption.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
