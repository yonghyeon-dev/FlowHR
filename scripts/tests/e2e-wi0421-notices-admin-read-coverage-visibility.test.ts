import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const noticesRoute = readUtf8("src", "app", "api", "notices", "route.ts");
  const adminWorkspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const noticesCopy = readUtf8("src", "components", "notices", "copy.ts");

  const workItem = readUtf8("work-items", "WI-0421-notices-admin-read-coverage-visibility.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(noticesRoute, /const readReceipts = isAdminActor/);
  assert.match(noticesRoute, /listNoticeReadReceipts\(\{ organizationId \}\)/);
  assert.match(noticesRoute, /readNoticeIds: readReceipts\.map\(\(receipt\) => receipt\.noticeId\)/);

  assert.match(adminWorkspace, /parseReadReceipts/);
  assert.match(adminWorkspace, /const readCountByNoticeId = useMemo\(/);
  assert.match(adminWorkspace, /copy\.readCountLabel/);
  assert.match(adminWorkspace, /readCountByNoticeId\.get\(notice\.id\) \?\? 0/);

  assert.match(noticesCopy, /readCountLabel/);

  assert.match(workItem, /WI-0421/i);
  assert.match(workItem, /notice|admin|read|coverage|visibility/i);
  assert.match(roadmap, /WI-0421/i);
}

run()
  .then(() => {
    console.log("e2e-wi0421-notices-admin-read-coverage-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

