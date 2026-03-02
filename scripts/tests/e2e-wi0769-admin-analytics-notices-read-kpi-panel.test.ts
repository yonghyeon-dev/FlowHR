import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const panel = readUtf8("src", "components", "admin-kpi", "AdminNoticesKpiPanel.tsx");
  const workItem = readUtf8("work-items", "WI-0769-admin-analytics-notices-read-kpi-panel.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboard, /AdminNoticesKpiPanel/);
  assert.match(dashboard, /loadNoticesKpi/);
  assert.match(dashboard, /analyticsMode && noticesKpi/);

  assert.match(copy, /noticesPanel/);
  assert.match(copy, /publishedNoticeCount/);
  assert.match(copy, /noReadNoticeCount/);
  assert.match(copy, /unreadAging3dCount/);

  assert.match(panel, /buildNoticeReadCoverageSnapshot/);
  assert.match(panel, /agingThresholdMs = 3 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(panel, /noReadNoticeCount/);
  assert.match(panel, /unreadAging3dCount/);

  const { buildNoticeReadCoverageSnapshot } = await import(
    "../../src/components/admin-kpi/AdminNoticesKpiPanel.tsx"
  );
  const now = new Date("2026-03-02T00:00:00.000Z");
  const snapshot = buildNoticeReadCoverageSnapshot(
    {
      notices: [
        { id: "N-1", status: "PUBLISHED", publishedAt: "2026-02-20T00:00:00.000Z", updatedAt: "2026-02-20T00:00:00.000Z" },
        { id: "N-2", status: "PUBLISHED", publishedAt: "2026-03-01T00:00:00.000Z", updatedAt: "2026-03-01T00:00:00.000Z" },
        { id: "N-3", status: "SCHEDULED", publishedAt: null, updatedAt: "2026-03-01T00:00:00.000Z" },
        { id: "N-4", status: "DRAFT", publishedAt: null, updatedAt: "2026-03-01T00:00:00.000Z" }
      ],
      readReceipts: [{ noticeId: "N-2", readAt: "2026-03-01T01:00:00.000Z" }]
    },
    now
  );
  assert.equal(snapshot.publishedNoticeCount, 2);
  assert.equal(snapshot.noReadNoticeCount, 1);
  assert.equal(snapshot.unreadAging3dCount, 1);

  assert.match(workItem, /WI-0769/i);
  assert.match(workItem, /admin|analytics|notice|read|kpi|panel/i);
  assert.match(roadmap, /WI-0769/i);
}

run()
  .then(() => {
    console.log("e2e-wi0769-admin-analytics-notices-read-kpi-panel.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
