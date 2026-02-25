import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminNotices = readUtf8("src", "app", "admin", "notices", "page.tsx");
  const adminBenefits = readUtf8("src", "app", "admin", "benefits", "page.tsx");
  const adminRecruitment = readUtf8("src", "app", "admin", "recruitment", "page.tsx");
  const employeeBenefits = readUtf8("src", "app", "employee", "benefits", "page.tsx");
  const employeeRecruitment = readUtf8("src", "app", "employee", "recruitment", "page.tsx");

  const notificationFeed = readUtf8("apps", "mobile", "src", "lib", "notificationFeed.js");
  const notificationHistory = readUtf8("apps", "mobile", "src", "lib", "notificationHistory.js");
  const notificationStore = readUtf8("apps", "mobile", "src", "lib", "notificationStore.js");
  const notifications = readUtf8("apps", "mobile", "src", "lib", "notifications.js");
  const notificationCenterScreen = readUtf8(
    "apps",
    "mobile",
    "src",
    "screens",
    "NotificationCenterScreen.js"
  );
  const notificationHistoryScreen = readUtf8(
    "apps",
    "mobile",
    "src",
    "screens",
    "NotificationHistoryScreen.js"
  );
  const presetCard = readUtf8(
    "apps",
    "mobile",
    "src",
    "components",
    "MobileAnalyticsFilterPresetCard.js"
  );

  const workItem = readUtf8("work-items", "WI-0406-global-i18n-residual-token-cleanup.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminNotices, /기본 화면입니다/);
  assert.match(adminBenefits, /기본 라우트입니다/);
  assert.match(adminRecruitment, /기본 라우트입니다/);
  assert.match(employeeBenefits, /기본 화면입니다/);
  assert.match(employeeRecruitment, /기본 화면입니다/);

  assert.match(notificationFeed, /CATEGORY_SEED_BY_LOCALE/);
  assert.match(notificationFeed, /resolveNotificationCategoryLabelMap/);
  assert.match(notificationFeed, /appendLiveMockNotification\(items, now = new Date\(\), locale = "ko"\)/);
  assert.match(notificationFeed, /"새 승인 요청"/);

  assert.match(notificationHistory, /getNotificationHistoryCategoryOptions/);
  assert.match(notificationHistory, /getNotificationHistoryReadOptions/);
  assert.match(notificationHistory, /getNotificationHistoryArchiveOptions/);
  assert.match(notificationHistory, /formatNotificationArchiveMeta\(item, locale = "ko"\)/);

  assert.match(notificationStore, /resolveMobileLocale/);
  assert.match(notificationStore, /seedInboxByLocale/);
  assert.match(notificationStore, /"명세서 발행"/);

  assert.match(notifications, /permissionLabel\(status, locale = "ko"\)/);
  assert.match(notifications, /"허용됨"/);

  assert.match(notificationCenterScreen, /resolveMobileLocale\(\)/);
  assert.match(notificationCenterScreen, /COPY_BY_LOCALE/);
  assert.match(notificationCenterScreen, /"알림 센터"/);
  assert.match(notificationCenterScreen, /loadNotificationInbox\(locale\)/);
  assert.match(notificationCenterScreen, /appendLiveMockNotification\(inbox, new Date\(\), locale\)/);

  assert.match(notificationHistoryScreen, /resolveMobileLocale\(\)/);
  assert.match(notificationHistoryScreen, /getNotificationHistoryCategoryOptions\(locale\)/);
  assert.match(notificationHistoryScreen, /formatNotificationArchiveMeta\(item, locale\)/);

  assert.match(presetCard, /resolveMobileLocale\(\)/);
  assert.match(presetCard, /COPY_BY_LOCALE/);
  assert.match(presetCard, /"필터 프리셋"/);

  assert.match(workItem, /WI-0406/i);
  assert.match(workItem, /i18n|locale|mobile|notice|benefits|recruitment/i);
  assert.match(roadmap, /WI-0406/i);
}

run()
  .then(() => {
    console.log("e2e-wi0406-global-i18n-residual-token-cleanup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
