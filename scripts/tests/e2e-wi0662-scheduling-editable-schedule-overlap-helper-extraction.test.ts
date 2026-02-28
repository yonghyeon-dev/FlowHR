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
  const helper = readUtf8("src", "features", "scheduling", "schedule-overlap-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0662-scheduling-editable-schedule-overlap-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/schedule-overlap-helpers"/);
  assert.match(helper, /export function listStrictScheduleOverlaps\(/);
  assert.match(helper, /schedule\.id !== input\.excludeScheduleId/);

  const helperUsageMatches = service.match(/listStrictScheduleOverlaps\(\{/g) ?? [];
  assert.ok(
    helperUsageMatches.length >= 2,
    `service should call listStrictScheduleOverlaps at least twice \(current: ${helperUsageMatches.length}\)`
  );
  assert.doesNotMatch(service, /\.filter\(\(existing\) => existing\.startAt < input\.endAt && existing\.endAt > input\.startAt\)/);
  assert.doesNotMatch(
    service,
    /\.filter\(\s*\(schedule\) => schedule\.id !== scheduleId && schedule\.startAt < endAt && schedule\.endAt > startAt\s*\)/
  );

  assert.ok(
    countLines(service) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines \(current: ${countLines(service)}\)`
  );
  assert.ok(
    countLines(helper) <= 120,
    `schedule-overlap-helpers.ts should stay <= 120 lines \(current: ${countLines(helper)}\)`
  );

  assert.match(workItem, /WI-0662/i);
  assert.match(workItem, /scheduling|overlap|editable|schedule|helper|extraction/i);
  assert.match(roadmap, /WI-0662/i);
}

run()
  .then(() => {
    console.log("e2e-wi0662-scheduling-editable-schedule-overlap-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
