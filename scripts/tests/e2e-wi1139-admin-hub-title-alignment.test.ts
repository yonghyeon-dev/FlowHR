import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const onboardingPage = readUtf8("src", "app", "(protected)", "onboarding", "page.tsx");
  const workItem = readUtf8("work-items", "WI-1139-admin-hub-title-alignment.md");

  assert.match(adminPage, /관리자 허브/);
  assert.match(adminPage, /Admin hub/);
  assert.doesNotMatch(adminPage, /관리자 대시보드/);
  assert.doesNotMatch(adminPage, /Admin Dashboard/);

  assert.match(messages, /"home\.cta\.admin": "관리자 허브"/);
  assert.match(messages, /"home\.admin\.title": "관리자 허브"/);
  assert.match(messages, /"home\.cta\.admin": "Admin hub"/);
  assert.match(messages, /"home\.admin\.title": "Admin hub"/);

  assert.match(onboardingPage, /관리자 허브로 이동합니다\./);
  assert.match(onboardingPage, /moveToDashboardButtonLabel: "허브로 이동"/);
  assert.match(onboardingPage, /continue to the admin hub\./);
  assert.match(onboardingPage, /moveToDashboardButtonLabel: "Go to admin hub"/);

  assert.match(workItem, /WI-1139/);
  assert.match(workItem, /관리자 허브 상단 타이틀 정렬/);
}

run()
  .then(() => {
    console.log("e2e-wi1139-admin-hub-title-alignment.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
