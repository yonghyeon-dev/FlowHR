import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-1155-route-first-workspace-visual-wave-fourteen.md");
  const reportsPage = readUtf8("src", "app", "admin", "reports", "page.tsx");
  const auditLogsPage = readUtf8("src", "app", "admin", "audit-logs", "page.tsx");
  const progress = readUtf8("docs", "production-operating-progress.md");

  assert.match(wi, /WI-1155/);
  assert.match(wi, /운영 인사이트 워크스페이스 시각 파동 14/);

  for (const page of [reportsPage, auditLogsPage]) {
    assert.match(page, /workspace-shell admin-workspace-shell/);
    assert.match(page, /workspace-page-header/);
    assert.match(page, /workspace-summary-strip/);
    assert.match(page, /workspace-section-card workspace-toolbar-card/);
    assert.match(page, /workspace-source-banner/);
    assert.match(page, /href="\/admin"/);
  }

  assert.match(progress, /Started `WI-1155`/);
}

run();
console.log("e2e-wi1155-route-first-workspace-visual-wave-fourteen.test passed");
