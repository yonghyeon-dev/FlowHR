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
  const workItem = readUtf8(
    "work-items",
    "WI-0695-scheduling-rotation-balance-actor-guard-helper-adoption.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schedulingService, /export async function listWorkScheduleRotationBalance[\s\S]*const actor = requireSchedulingActor\(context\);/);
  assert.doesNotMatch(
    schedulingService,
    /export async function listWorkScheduleRotationBalance[\s\S]*const actor = context\.actor;[\s\S]*missing or invalid actor context/
  );

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );

  assert.match(workItem, /WI-0695/i);
  assert.match(workItem, /scheduling|rotation balance|actor guard|helper|adoption/i);
  assert.match(roadmap, /WI-0695/i);
}

run()
  .then(() => {
    console.log("e2e-wi0695-scheduling-rotation-balance-actor-guard-helper-adoption.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
