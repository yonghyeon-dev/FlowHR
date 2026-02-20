import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(adminPage, /approvalItemHistorySummaryMap/, "admin page should compute item-level history summary");
  assert.match(adminPage, /attendanceBulkValidationChecks/, "admin page should compute attendance bulk checks");
  assert.match(adminPage, /leaveBulkValidationChecks/, "admin page should compute leave bulk checks");
  assert.match(adminPage, /canRejectSelectedLeave/, "admin page should gate leave bulk reject by validation");
  assert.match(adminPage, /mobileApprovalFeedback/, "admin page should track mobile approval feedback");
  assert.match(adminPage, /publishMobileApprovalFeedback/, "admin page should publish mobile approval feedback");
  assert.match(adminPage, /id="approval-bulk-validation"/, "admin page should expose bulk validation section");
  assert.match(adminPage, /id="approval-item-history"/, "admin page should expose item history section");
  assert.match(adminPage, /id="approval-mobile-feedback"/, "admin page should expose mobile feedback section");
  assert.match(
    adminPage,
    /aria-label="attendance bulk pre-action checks"/,
    "admin page should render attendance pre-action check list"
  );
  assert.match(
    adminPage,
    /aria-label="leave bulk pre-action checks"/,
    "admin page should render leave pre-action check list"
  );
  assert.match(adminPage, /queue-item-history-inline/, "queue rows should show item-level history inline");

  assert.match(
    adminLayout,
    /\/admin#approval-bulk-validation/,
    "admin nav should include approval bulk validation anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-item-history/,
    "admin nav should include approval item history anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-mobile-feedback/,
    "admin nav should include approval mobile feedback anchor"
  );

  assert.match(globalCss, /\.queue-bulk-validation-panel/, "bulk validation panel style should exist");
  assert.match(globalCss, /\.queue-precheck-list/, "bulk precheck list style should exist");
  assert.match(globalCss, /\.queue-item-history-panel/, "item history panel style should exist");
  assert.match(globalCss, /\.queue-item-history-summary-list/, "item history summary list style should exist");
  assert.match(globalCss, /\.queue-item-history-inline/, "item history inline style should exist");
  assert.match(globalCss, /\.queue-mobile-feedback-panel/, "mobile feedback panel style should exist");
  assert.match(globalCss, /#approvals \.queue-bulk-validation-grid/, "mobile rule for validation grid should exist");
  assert.match(globalCss, /#approvals \.queue-mobile-feedback-chips/, "mobile rule for feedback chips should exist");
}

run();
console.log("e2e-wi0137-admin-approval-queue-ux-phase3-history-validation-mobile-feedback.test passed");
