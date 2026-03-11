import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-1154-route-first-workspace-visual-wave-thirteen.md");
  const operatorAlertsPage = readUtf8("src", "app", "admin", "operator-alerts", "page.tsx");
  const notificationDefaultsPage = readUtf8("src", "app", "admin", "notification-defaults", "page.tsx");
  const approvalEscalationSettingsPage = readUtf8(
    "src",
    "app",
    "admin",
    "approval-escalation-settings",
    "page.tsx"
  );
  const leavePromotionEmailPage = readUtf8(
    "src",
    "app",
    "admin",
    "leave-promotion-email",
    "page.tsx"
  );
  const progress = readUtf8("docs", "production-operating-progress.md");

  assert.match(wi, /WI-1154/);
  assert.match(wi, /운영 설정 워크스페이스 시각 파동 13/);

  for (const page of [
    operatorAlertsPage,
    notificationDefaultsPage,
    approvalEscalationSettingsPage,
    leavePromotionEmailPage
  ]) {
    assert.match(page, /workspace-shell admin-workspace-shell/);
    assert.match(page, /workspace-page-header/);
    assert.match(page, /workspace-summary-strip/);
    assert.match(page, /workspace-section-card workspace-toolbar-card/);
    assert.match(page, /workspace-section-card workspace-note-card/);
    assert.match(page, /\/admin\/settings/);
    assert.match(page, /workspace-source-banner/);
  }

  assert.match(progress, /Started `WI-1154`/);
}

run();
console.log("e2e-wi1154-route-first-workspace-visual-wave-thirteen.test passed");
