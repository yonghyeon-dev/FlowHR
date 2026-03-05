import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const page = readUtf8("src", "app", "employee", "notifications", "settings", "page.tsx");
  const workItem = readUtf8("work-items", "WI-0962-notification-settings.md");

  assert.match(page, /"use client"/);
  assert.match(page, /flowhr\.employee\.notification-settings\.v1/);
  assert.match(page, /이메일 알림/);
  assert.match(page, /인앱 알림/);
  assert.match(page, /휴가 알림/);
  assert.match(page, /근태 알림/);
  assert.match(page, /급여 알림/);
  assert.match(page, /localStorage/);
  assert.match(page, /기본값으로 복원/);

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
