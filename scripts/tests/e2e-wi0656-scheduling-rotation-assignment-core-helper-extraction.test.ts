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
  const rotationAssignmentHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "rotation-assignment-core-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0656-scheduling-rotation-assignment-core-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schedulingService, /from "@\/features\/scheduling\/rotation-assignment-core-helpers"/);
  assert.match(rotationAssignmentHelpers, /export async function requireTemplatesWithinTenant\(/);
  assert.match(rotationAssignmentHelpers, /export function ensureRotationTemplatesShareWeekdaySet\(/);
  assert.match(rotationAssignmentHelpers, /export async function ensureNoOverlapsForGeneratedWindows\(/);
  assert.match(rotationAssignmentHelpers, /export async function createSchedulesFromGeneratedWindows\(/);

  assert.doesNotMatch(schedulingService, /async function requireTemplatesWithinTenant\(/);
  assert.doesNotMatch(schedulingService, /function ensureRotationTemplatesShareWeekdaySet\(/);
  assert.doesNotMatch(schedulingService, /async function ensureNoOverlapsForGeneratedWindows\(/);
  assert.doesNotMatch(schedulingService, /async function createSchedulesFromGeneratedWindows\(/);

  assert.match(
    schedulingService,
    /requireTemplatesWithinTenant\(\s*templateIds,\s*\(templateId\) => requireTemplateEntityWithinTenant\(context, templateId\)\s*\)/
  );
  assert.match(
    schedulingService,
    /ensureNoOverlapsForGeneratedWindows\(\{\s*organizationId:[\s\S]*listSchedulesInPeriod: \(overlapInput\) => context\.dataAccess\.scheduling\.listInPeriod\(overlapInput\)/
  );
  assert.match(
    schedulingService,
    /createSchedulesFromGeneratedWindows\(\{\s*employeeId:[\s\S]*createSchedule: \(scheduleInput\) => createWorkSchedule\(context, scheduleInput\)/
  );

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );

  assert.match(workItem, /WI-0656/i);
  assert.match(workItem, /scheduling|rotation|helper|extraction|line-budget/i);
  assert.match(roadmap, /WI-0656/i);
}

run()
  .then(() => {
    console.log("e2e-wi0656-scheduling-rotation-assignment-core-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
