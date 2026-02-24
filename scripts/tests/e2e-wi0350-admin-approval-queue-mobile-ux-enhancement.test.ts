import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const queuePanel = readUtf8("src", "components", "admin-approval", "ApprovalQueuePanel.tsx");
  const queueFilterSection = readUtf8(
    "src",
    "components",
    "admin-approval",
    "ApprovalQueueFilterSection.tsx"
  );
  const queueMobileSources = `${queuePanel}\n${queueFilterSection}`;
  const queueSearchSortPanel = readUtf8(
    "src",
    "components",
    "admin-approval",
    "ApprovalQueueSearchSortPanel.tsx"
  );
  const workItem = readUtf8("work-items", "WI-0350-admin-approval-queue-mobile-ux-enhancement.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(queuePanel, /queuePanelCopyByLocale/);
  assert.match(queueMobileSources, /queue-mobile-sticky/);
  assert.match(queueMobileSources, /mobileQuickActions/);
  assert.match(queuePanel, /onApplyPendingPreset/);
  assert.match(queuePanel, /onApplyUrgentPreset/);
  assert.match(queueSearchSortPanel, /searchSortCopyByLocale/);
  assert.match(queueSearchSortPanel, /useI18n/);

  assert.match(workItem, /WI-0350/i);
  assert.match(workItem, /mobile/i);
  assert.match(roadmap, /WI-0350/i);
}

run()
  .then(() => {
    console.log("e2e-wi0350-admin-approval-queue-mobile-ux-enhancement.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
