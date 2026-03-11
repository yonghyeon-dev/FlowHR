import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const notificationsWorkspace = readUtf8(
    "src",
    "components",
    "notifications",
    "NotificationsWorkspace.tsx"
  );
  const adminNotificationsPage = readUtf8("src", "app", "admin", "notifications", "page.tsx");
  const employeeNotificationsPage = readUtf8("src", "app", "employee", "notifications", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-1151-route-first-workspace-visual-wave-ten.md"
  );

  assert.match(
    notificationsWorkspace,
    /saas-content workspace-shell admin-workspace-shell/
  );
  assert.match(
    notificationsWorkspace,
    /saas-content workspace-shell employee-workspace-shell/
  );
  assert.match(
    notificationsWorkspace,
    /page-header workspace-page-header/
  );
  assert.match(
    notificationsWorkspace,
    /workspace-summary-strip/
  );
  assert.match(
    notificationsWorkspace,
    /workspace-section-card workspace-toolbar-card/
  );
  assert.match(
    notificationsWorkspace,
    /workspace-section-card workspace-note-card/
  );
  assert.match(notificationsWorkspace, /관리자 알림/);
  assert.match(notificationsWorkspace, /내 알림/);
  assert.match(notificationsWorkspace, /알림 목록/);
  assert.doesNotMatch(notificationsWorkspace, /\?뚮┝|\?쎌쓬|\?섏떊/);

  assert.match(adminNotificationsPage, /NotificationsWorkspace variant="admin"/);
  assert.match(employeeNotificationsPage, /NotificationsWorkspace variant="employee"/);
  assert.match(workItem, /WI-1151/);
  assert.match(workItem, /visual/i);
}

run()
  .then(() => {
    console.log("e2e-wi1151-route-first-workspace-visual-wave-ten.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
