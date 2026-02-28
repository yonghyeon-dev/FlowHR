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
  const page = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const helpers = readUtf8("src", "app", "admin", "approval-executions", "page-helpers.ts");
  const summaryPanel = readUtf8(
    "src",
    "app",
    "admin",
    "approval-executions",
    "page-sections-summary-escalation.tsx"
  );
  const pageTypes = readUtf8("src", "app", "admin", "approval-executions", "page-types.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0659-admin-approval-executions-stalled-risk-summary-ux-hardening.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(page, /결재 실행 현황/);
  assert.match(page, /정체 에스컬레이션 드라이런/);
  assert.match(page, /정체 에스컬레이션 실행/);
  assert.match(page, /드라이런 완료: 후보/);
  assert.match(page, /에스컬레이션 전송 완료/);
  assert.match(page, /에스컬레이션 후보가 없어 전송을 건너뛰었습니다/);
  assert.match(page, /watchCount/);
  assert.match(page, /criticalCount/);
  assert.match(page, /maxStalledHours/);

  assert.match(summaryPanel, /summary\.watchCount/);
  assert.match(summaryPanel, /summary\.criticalCount/);
  assert.match(summaryPanel, /summary\.maxStalledHours/);
  assert.match(summaryPanel, /Watch queue/);
  assert.match(summaryPanel, /Critical queue/);

  assert.match(pageTypes, /watchCount: number;/);
  assert.match(pageTypes, /criticalCount: number;/);
  assert.match(pageTypes, /watchThresholdHours: number;/);
  assert.match(pageTypes, /criticalThresholdHours: number;/);
  assert.match(pageTypes, /maxStalledHours: number;/);

  assert.match(helpers, /급여 워크스페이스/);
  assert.match(helpers, /휴가 워크스페이스/);
  assert.match(helpers, /근태 워크스페이스/);

  assert.doesNotMatch(page, /寃곗옱|湲됱뿬|洹쇳깭|諛섎젮/);
  assert.doesNotMatch(helpers, /湲됱뿬|洹쇳깭/);

  assert.ok(
    countLines(page) <= 450,
    `admin/approval-executions/page.tsx should stay <= 450 lines (current: ${countLines(page)})`
  );

  assert.match(workItem, /WI-0659/i);
  assert.match(workItem, /approval|executions|stalled|risk|summary|ux|hardening/i);
  assert.match(roadmap, /WI-0659/i);
}

run()
  .then(() => {
    console.log("e2e-wi0659-admin-approval-executions-stalled-risk-summary-ux-hardening.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
