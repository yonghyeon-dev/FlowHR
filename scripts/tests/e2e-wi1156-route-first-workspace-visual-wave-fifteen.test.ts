import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-1156-route-first-workspace-visual-wave-fifteen.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const approvalHistoryPage = readUtf8("src", "app", "admin", "approval-history", "page.tsx");
  const approvalPolicyPage = readUtf8("src", "app", "admin", "approval-policy", "page.tsx");
  const approvalTemplatesPage = readUtf8("src", "app", "admin", "approval-templates", "page.tsx");
  const approvalTemplatesSections = readUtf8("src", "app", "admin", "approval-templates", "page-sections.tsx");

  assert.match(wi, /WI-1156/);
  assert.match(wi, /승인 운영 인사이트 워크스페이스 시각 파동 15/);
  assert.match(progress, /Closed `WI-1155` with merge `3434b80ab7a8333762cb7f864de5c84cd89a6bda`/);
  assert.match(progress, /Started `WI-1156`/);

  for (const page of [approvalHistoryPage, approvalPolicyPage, approvalTemplatesPage]) {
    assert.match(page, /workspace-shell admin-workspace-shell/);
    assert.match(page, /workspace-page-header/);
    assert.match(page, /workspace-summary-strip/);
    assert.match(page, /workspace-source-banner/);
    assert.match(page, /href="\/admin"/);
  }

  assert.match(approvalHistoryPage, /workspace-section-card workspace-toolbar-card/);
  assert.match(approvalPolicyPage, /workspace-section-card workspace-toolbar-card/);
  assert.match(approvalTemplatesSections, /workspace-section-card/);
}

run();
console.log("e2e-wi1156-route-first-workspace-visual-wave-fifteen.test passed");
