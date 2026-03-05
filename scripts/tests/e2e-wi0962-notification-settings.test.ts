import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const page = readUtf8("src", "app", "employee", "notifications", "settings", "page.tsx");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const workItem = readUtf8("work-items", "WI-0962-notification-settings.md");

  assert.match(page, /"use client"/);
  assert.match(page, /flowhr\.employee\.notification-settings\.v1/);
  assert.match(page, /useI18n/);
  assert.match(page, /t\("employee\.notifications\.settings\.channel\.email"\)/);
  assert.match(page, /t\("employee\.notifications\.settings\.channel\.inApp"\)/);
  assert.match(page, /t\("employee\.notifications\.settings\.category\.leave"\)/);
  assert.match(page, /t\("employee\.notifications\.settings\.category\.attendance"\)/);
  assert.match(page, /t\("employee\.notifications\.settings\.category\.payroll"\)/);
  assert.match(page, /localStorage/);
  assert.match(page, /t\("employee\.notifications\.settings\.restoreDefaults"\)/);

  assert.match(messages, /"employee\.notifications\.settings\.channel\.email": "이메일 알림"/);
  assert.match(messages, /"employee\.notifications\.settings\.channel\.inApp": "인앱 알림"/);
  assert.match(messages, /"employee\.notifications\.settings\.category\.leave": "휴가 알림"/);
  assert.match(messages, /"employee\.notifications\.settings\.category\.attendance": "근태 알림"/);
  assert.match(messages, /"employee\.notifications\.settings\.category\.payroll": "급여 알림"/);
  assert.match(messages, /"employee\.notifications\.settings\.restoreDefaults": "기본값으로 복원"/);

  assert.match(workItem, /WI-0962/i);
  assert.match(workItem, /알림 설정 UI/);
  assert.match(workItem, /로컬스토리지/);
}

run()
  .then(() => {
    console.log("e2e-wi0962-notification-settings.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
