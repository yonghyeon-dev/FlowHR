import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-1157-route-first-workspace-visual-wave-sixteen.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const pageView = readUtf8("src", "app", "admin", "approval-executions", "page-view.tsx");
  const workConditions = readUtf8("src", "app", "admin", "approval-executions", "page-sections-work-conditions.tsx");
  const summaryEscalation = readUtf8("src", "app", "admin", "approval-executions", "page-sections-summary-escalation.tsx");
  const queueSections = readUtf8("src", "app", "admin", "approval-executions", "page-sections-queue.tsx");

  assert.match(wi, /WI-1157/);
  assert.match(wi, /승인 실행 워크스페이스 시각 파동 16/);
  assert.match(progress, /Closed `WI-1156` with merge `ab0cdfed371b7445f9d9de07dab109ed653f9ef4`/);
  assert.match(progress, /Started `WI-1157`/);

  assert.match(pageView, /workspace-shell admin-workspace-shell/);
  assert.match(pageView, /workspace-page-header/);
  assert.match(pageView, /workspace-summary-strip/);
  assert.match(pageView, /workspace-source-banner/);
  assert.match(pageView, /href="\/admin"/);

  assert.match(workConditions, /workspace-section-card workspace-toolbar-card/);
  assert.match(summaryEscalation, /workspace-section-card workspace-note-card/);
  assert.match(queueSections, /workspace-section-card/);
}

run();
console.log("e2e-wi1157-route-first-workspace-visual-wave-sixteen.test passed");
