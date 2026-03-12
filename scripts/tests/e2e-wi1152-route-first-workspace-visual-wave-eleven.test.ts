import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-1152-route-first-workspace-visual-wave-eleven.md");
  const adminSettingsPage = readUtf8("src", "app", "admin", "settings", "page.tsx");
  const employeeSettingsPage = readUtf8("src", "app", "employee", "settings", "page.tsx");
  const progress = readUtf8("docs", "production-operating-progress.md");

  assert.match(wi, /WI-1152/);
  assert.match(wi, /admin/i);
  assert.match(wi, /employee/i);

  assert.match(adminSettingsPage, /workspace-shell admin-workspace-shell/);
  assert.match(adminSettingsPage, /workspace-page-header/);
  assert.match(adminSettingsPage, /workspace-summary-strip/);
  assert.match(adminSettingsPage, /workspace-section-card workspace-toolbar-card/);
  assert.match(adminSettingsPage, /workspace-section-card workspace-note-card/);
  assert.match(adminSettingsPage, /회계연도 시작/);
  assert.match(adminSettingsPage, /출퇴근 보안 설정/);
  assert.match(adminSettingsPage, /회사 운영 기본값/);

  assert.match(employeeSettingsPage, /workspace-shell employee-workspace-shell/);
  assert.match(employeeSettingsPage, /workspace-page-header employee-workspace-status-header/);
  assert.match(employeeSettingsPage, /workspace-summary-strip employee-workspace-status-strip/);
  assert.match(employeeSettingsPage, /workspace-section-card workspace-toolbar-card/);
  assert.match(employeeSettingsPage, /workspace-section-card workspace-note-card/);
  assert.match(employeeSettingsPage, /개인 설정/);
  assert.match(employeeSettingsPage, /언어 설정/);
  assert.match(employeeSettingsPage, /알림 설정 바로가기/);
  assert.match(employeeSettingsPage, /비밀번호 변경/);

  assert.match(progress, /Started `WI-1152`/);
}

run();
console.log("e2e-wi1152-route-first-workspace-visual-wave-eleven.test passed");
