import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const notificationSettingsPage = readUtf8("src", "app", "employee", "notifications", "settings", "page.tsx");
  const onboardingTasksRoute = readUtf8("src", "app", "api", "admin", "onboarding", "tasks", "route.ts");
  const workItem = readUtf8("work-items", "WI-0963-i18n-centralize.md");

  const requiredKeys = [
    "admin.onboarding.defaultTask.signContract",
    "admin.onboarding.api.loadEmployeesLabel",
    "employee.notifications.settings.title",
    "employee.notifications.settings.saveError",
    "employee.notifications.settings.restoreDefaults"
  ];
  requiredKeys.forEach((key) => {
    assert.match(messages, new RegExp(`"${key}"`));
  });

  assert.match(notificationSettingsPage, /useI18n/);
  assert.match(notificationSettingsPage, /t\("employee\.notifications\.settings\.title"\)/);
  assert.match(notificationSettingsPage, /t\("employee\.notifications\.settings\.saveError"\)/);
  assert.doesNotMatch(notificationSettingsPage, /[가-힣]/);

  assert.match(onboardingTasksRoute, /defaultTaskTitleKeys/);
  assert.match(onboardingTasksRoute, /translate\(DEFAULT_LOCALE, key\)/);
  assert.doesNotMatch(onboardingTasksRoute, /[가-힣]/);

  assert.match(workItem, /WI-0963/i);
  assert.match(workItem, /i18n 메시지 중앙화/);
  assert.match(workItem, /messages\.ts/);
}

run()
  .then(() => {
    console.log("e2e-wi0963-i18n-centralize.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
