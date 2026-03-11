import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-1153-route-first-workspace-visual-wave-twelve.md");
  const leavePoliciesPage = readUtf8("src", "app", "admin", "leave-policies", "page.tsx");
  const attendanceSecurityPage = readUtf8("src", "app", "admin", "attendance-security", "page.tsx");
  const featureManagementPage = readUtf8("src", "app", "admin", "feature-management", "page.tsx");
  const employeeNotificationSettingsPage = readUtf8(
    "src",
    "app",
    "employee",
    "notifications",
    "settings",
    "page.tsx"
  );
  const progress = readUtf8("docs", "production-operating-progress.md");

  assert.match(wi, /WI-1153/);
  assert.match(wi, /운영 설정 워크스페이스 시각 파동 12/);

  assert.match(leavePoliciesPage, /workspace-shell admin-workspace-shell/);
  assert.match(leavePoliciesPage, /workspace-page-header/);
  assert.match(leavePoliciesPage, /workspace-summary-strip/);
  assert.match(leavePoliciesPage, /workspace-section-card workspace-toolbar-card/);
  assert.match(leavePoliciesPage, /workspace-section-card workspace-note-card/);
  assert.match(leavePoliciesPage, /\/admin\/settings/);

  assert.match(attendanceSecurityPage, /workspace-shell admin-workspace-shell/);
  assert.match(attendanceSecurityPage, /workspace-page-header/);
  assert.match(attendanceSecurityPage, /workspace-summary-strip/);
  assert.match(attendanceSecurityPage, /workspace-section-card workspace-toolbar-card/);
  assert.match(attendanceSecurityPage, /workspace-section-card workspace-note-card/);
  assert.match(attendanceSecurityPage, /\/admin\/settings/);

  assert.match(featureManagementPage, /workspace-shell admin-workspace-shell/);
  assert.match(featureManagementPage, /workspace-page-header/);
  assert.match(featureManagementPage, /workspace-summary-strip/);
  assert.match(featureManagementPage, /workspace-section-card workspace-toolbar-card/);
  assert.match(featureManagementPage, /workspace-section-card workspace-note-card/);
  assert.match(featureManagementPage, /\/admin\/settings/);

  assert.match(employeeNotificationSettingsPage, /workspace-shell employee-workspace-shell/);
  assert.match(employeeNotificationSettingsPage, /workspace-page-header employee-workspace-status-header/);
  assert.match(employeeNotificationSettingsPage, /workspace-summary-strip employee-workspace-status-strip/);
  assert.match(employeeNotificationSettingsPage, /workspace-section-card workspace-toolbar-card/);
  assert.match(employeeNotificationSettingsPage, /workspace-section-card workspace-note-card/);
  assert.match(employeeNotificationSettingsPage, /\/employee\/settings/);

  assert.match(progress, /Started `WI-1153`/);
}

run();
console.log("e2e-wi1153-route-first-workspace-visual-wave-twelve.test passed");
