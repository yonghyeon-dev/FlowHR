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
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const contextHelper = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-service-context-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0598-scheduling-service-split-phase2.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/anomaly-service-context-helpers"/);
  assert.match(service, /requireSchedulingWriteActor\(/);
  assert.match(service, /requireSchedulingActor\(context\)/);
  assert.match(service, /resolveSchedulingTenantScope\(actor\)/);

  assert.match(contextHelper, /export async function requireSchedulingWriteActor\(/);
  assert.match(contextHelper, /export function requireSchedulingActor\(/);
  assert.match(contextHelper, /export function resolveSchedulingTenantScope\(/);

  assert.ok(
    countLines(service) <= 3380,
    `scheduling/service.ts should stay <= 3380 lines (current: ${countLines(service)})`
  );
  assert.ok(
    countLines(contextHelper) <= 120,
    `anomaly-service-context-helpers.ts should stay <= 120 lines (current: ${countLines(contextHelper)})`
  );

  assert.match(workItem, /WI-0598/i);
  assert.match(workItem, /scheduling|service|split|phase2|context|permission|helper/i);
  assert.match(roadmap, /WI-0598/i);
}

run()
  .then(() => {
    console.log("e2e-wi0598-scheduling-service-split-phase2.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
