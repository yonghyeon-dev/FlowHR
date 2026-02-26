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
  const helpers = readUtf8("src", "features", "scheduling", "template-date-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0557-scheduling-template-date-helper-extraction-and-line-budget-recovery.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/template-date-helpers"/);
  assert.match(service, /parseDateToKstBase\(/);
  assert.match(service, /weekdayFromKstDate\(/);
  assert.match(service, /weekdayFromKstDateTime\(/);
  assert.match(service, /formatKstDateYmd\(/);
  assert.match(service, /dateTimeFromKstDateAndMinute\(/);
  assert.match(service, /enumerateTemplateMatchedDates\(/);

  assert.doesNotMatch(service, /function parseDateToKstBase\(/);
  assert.doesNotMatch(service, /function weekdayFromKstDate\(/);
  assert.doesNotMatch(service, /function weekdayFromKstDateTime\(/);
  assert.doesNotMatch(service, /function dateTimeFromKstDateAndMinute\(/);
  assert.doesNotMatch(service, /function formatKstDateYmd\(/);
  assert.doesNotMatch(service, /function enumerateTemplateMatchedDates\(/);

  assert.match(helpers, /export function parseDateToKstBase/);
  assert.match(helpers, /export function weekdayFromKstDate/);
  assert.match(helpers, /export function weekdayFromKstDateTime/);
  assert.match(helpers, /export function dateTimeFromKstDateAndMinute/);
  assert.match(helpers, /export function formatKstDateYmd/);
  assert.match(helpers, /export function enumerateDateRange/);
  assert.match(helpers, /export function enumerateTemplateMatchedDates/);

  assert.ok(
    countLines(service) <= 4000,
    `scheduling/service.ts should stay <= 4000 lines (current: ${countLines(service)})`
  );

  assert.match(workItem, /WI-0557/i);
  assert.match(workItem, /scheduling|template|date|helper|extraction|line budget|recovery/i);
  assert.match(roadmap, /WI-0557/i);
}

run()
  .then(() => {
    console.log("e2e-wi0557-scheduling-template-date-helper-extraction-and-line-budget-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
