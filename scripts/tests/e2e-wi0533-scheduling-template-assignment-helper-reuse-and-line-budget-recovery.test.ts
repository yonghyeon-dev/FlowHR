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
  const workItem = readUtf8(
    "work-items",
    "WI-0533-scheduling-template-assignment-helper-reuse-and-line-budget-recovery.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /function buildTemplateRangeWindows\(/);
  assert.match(service, /return buildRotationWindowsForTemplates\(\[template\], matchedDates\);/);
  assert.match(service, /assignWorkScheduleRangeFromTemplate/);
  assert.match(service, /const generatedWindows = buildTemplateRangeWindows\(template, matchedDates\);/);
  assert.match(
    service,
    /const createdScheduleIds = await createSchedulesFromGeneratedWindows\(\s*context,\s*input\.employeeId,\s*generatedWindows\s*\);/
  );
  assert.match(service, /assignWorkScheduleRotation/);
  assert.match(service, /const generatedWindows = buildRotationWindowsForTemplates\(templates, matchedDates\);/);

  const createHelperCalls = (service.match(/createSchedulesFromGeneratedWindows\(/g) ?? []).length;
  assert.ok(
    createHelperCalls >= 3,
    `expected createSchedulesFromGeneratedWindows reuse in multiple paths (current: ${createHelperCalls})`
  );

  assert.ok(
    countLines(service) <= 4200,
    `scheduling/service.ts should stay <= 4200 lines (current: ${countLines(service)})`
  );

  assert.match(workItem, /WI-0533/i);
  assert.match(workItem, /scheduling|template|assignment|helper|line-budget|recovery/i);
  assert.match(roadmap, /WI-0533/i);
}

run()
  .then(() => {
    console.log("e2e-wi0533-scheduling-template-assignment-helper-reuse-and-line-budget-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

