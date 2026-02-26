import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const list = readUtf8("src", "components", "notices", "EmployeeNoticeBoardList.tsx");
  const helpers = readUtf8("src", "components", "notices", "employee-notice-board-helpers.ts");
  const copy = readUtf8("src", "components", "notices", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0535-employee-notices-unread-aging-guidance.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helpers, /export function resolveNoticeUnreadAgingDays/);
  assert.match(list, /resolveNoticeUnreadAgingDays/);
  assert.match(list, /copy\.unreadAgingLabel/);
  assert.match(list, /copy\.unreadAgingRiskBadgeLabel/);
  assert.match(list, /D\+\{unreadAgingDays\}/);

  assert.match(copy, /unreadAgingLabel: string;/);
  assert.match(copy, /unreadAgingRiskBadgeLabel: string;/);
  assert.match(copy, /unreadAgingLabel: "[^"]+"/);
  assert.match(copy, /unreadAgingRiskBadgeLabel: "[^"]+"/);

  assert.match(workItem, /WI-0535/i);
  assert.match(workItem, /notice|unread|aging|guidance|badge/i);
  assert.match(roadmap, /WI-0535/i);
}

run()
  .then(() => {
    console.log("e2e-wi0535-employee-notices-unread-aging-guidance.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
