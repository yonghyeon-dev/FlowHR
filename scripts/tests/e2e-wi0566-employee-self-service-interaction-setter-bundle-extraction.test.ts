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
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const helper = readUtf8("src", "app", "employee", "page-interaction-setter-bundles.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0566-employee-self-service-interaction-setter-bundle-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from "@\/app\/employee\/page-interaction-setter-bundles"/);
  assert.match(employeePage, /buildEmployeeInteractionSetterBundles\(\{/);
  assert.doesNotMatch(employeePage, /const attendanceInteractionSetters = \{/);
  assert.doesNotMatch(employeePage, /const leaveInteractionSetters = \{/);
  assert.doesNotMatch(employeePage, /const requestInteractionSetters = \{/);
  assert.doesNotMatch(employeePage, /const periodInteractionSetters = \{/);

  assert.match(helper, /export function buildEmployeeInteractionSetterBundles/);
  assert.match(helper, /attendanceInteractionSetters/);
  assert.match(helper, /leaveInteractionSetters/);
  assert.match(helper, /requestInteractionSetters/);
  assert.match(helper, /periodInteractionSetters/);

  assert.ok(
    countLines(employeePage) <= 500,
    `employee/page.tsx should stay <= 500 lines (current: ${countLines(employeePage)})`
  );
  assert.ok(
    countLines(helper) <= 220,
    `page-interaction-setter-bundles.ts should stay <= 220 lines (current: ${countLines(helper)})`
  );

  assert.match(workItem, /WI-0566/i);
  assert.match(workItem, /employee|self-service|interaction|setter|bundle|extraction/i);
  assert.match(roadmap, /WI-0566/i);
}

run()
  .then(() => {
    console.log("e2e-wi0566-employee-self-service-interaction-setter-bundle-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
